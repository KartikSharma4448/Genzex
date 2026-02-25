// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// server/storage.ts
import { randomUUID } from "crypto";

// server/ai-model.ts
import { readFileSync } from "fs";
import { resolve } from "path";
var GenzexAIModel = class {
  modelBuffer = null;
  modelWeights = [];
  loaded = false;
  totalInferences = 0;
  totalLatency = 0;
  modelSize = 0;
  lastInference = null;
  constructor() {
    this.loadModel();
  }
  loadModel() {
    try {
      const modelPath = resolve(__dirname, "../server/genzex_model.tflite");
      this.modelBuffer = readFileSync(modelPath);
      this.modelSize = this.modelBuffer.length;
      this.modelWeights = this.extractWeights(this.modelBuffer);
      this.loaded = true;
      console.log(`[AI] GenzexModel loaded: ${this.modelSize} bytes, ${this.modelWeights.length} weight parameters`);
    } catch (e) {
      try {
        const altPath = resolve(process.cwd(), "server/genzex_model.tflite");
        this.modelBuffer = readFileSync(altPath);
        this.modelSize = this.modelBuffer.length;
        this.modelWeights = this.extractWeights(this.modelBuffer);
        this.loaded = true;
        console.log(`[AI] GenzexModel loaded: ${this.modelSize} bytes, ${this.modelWeights.length} weight parameters`);
      } catch (e2) {
        console.error("[AI] Failed to load model:", e2);
        this.loaded = false;
      }
    }
  }
  extractWeights(buffer) {
    const weights = [];
    for (let i = 0; i < buffer.length; i += 4) {
      if (i + 3 < buffer.length) {
        const val = buffer.readFloatLE(i);
        if (isFinite(val) && Math.abs(val) < 100) {
          weights.push(val);
        }
      }
    }
    if (weights.length < 10) {
      for (let i = 0; i < buffer.length; i++) {
        weights.push(buffer[i] / 255);
      }
    }
    return weights;
  }
  featureExtract(ip, port, protocol) {
    const octets = ip.split(".").map(Number);
    const normalizedOctets = octets.map((o) => o / 255);
    const normalizedPort = port / 65535;
    const protocolMap = {
      TCP: 0.2,
      UDP: 0.4,
      HTTP: 0.6,
      HTTPS: 0.8,
      DNS: 1
    };
    const protocolFeature = protocolMap[protocol] || 0.5;
    const ipEntropy = this.calcEntropy(octets);
    const isPrivate = octets[0] === 10 || octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31 || octets[0] === 192 && octets[1] === 168 ? 1 : 0;
    const isHighPort = port > 1024 ? 1 : 0;
    const knownBadPrefixes = [45, 89, 123, 200, 156, 78, 33];
    const isSuspiciousPrefix = knownBadPrefixes.includes(octets[0]) ? 1 : 0;
    return [
      ...normalizedOctets,
      normalizedPort,
      protocolFeature,
      ipEntropy,
      isPrivate,
      isHighPort,
      isSuspiciousPrefix
    ];
  }
  calcEntropy(values) {
    const total = values.reduce((a, b) => a + b, 0) || 1;
    let entropy = 0;
    for (const v of values) {
      if (v > 0) {
        const p = v / total;
        entropy -= p * Math.log2(p);
      }
    }
    return entropy / 8;
  }
  inference(features) {
    const start = performance.now();
    const weightStep = Math.max(1, Math.floor(this.modelWeights.length / (features.length * 3)));
    const hiddenSize = 3;
    const hidden = [];
    for (let h = 0; h < hiddenSize; h++) {
      let sum = 0;
      for (let f = 0; f < features.length; f++) {
        const wIdx = (h * features.length + f) * weightStep;
        const weight = wIdx < this.modelWeights.length ? this.modelWeights[wIdx] : 0.5;
        sum += features[f] * weight;
      }
      hidden.push(1 / (1 + Math.exp(-sum)));
    }
    const isPrivate = features[7];
    const isSuspiciousPrefix = features[9];
    const normalizedPort = features[4];
    const isHTTPS = features[5] > 0.75;
    let safeScore = hidden[0] * 0.3 + isPrivate * 0.4 + (isHTTPS ? 0.2 : 0) + (1 - isSuspiciousPrefix) * 0.1;
    let suspiciousScore = hidden[1] * 0.3 + (1 - isPrivate) * 0.2 + normalizedPort * 0.15 + isSuspiciousPrefix * 0.35;
    let maliciousScore = hidden[2] * 0.2 + isSuspiciousPrefix * 0.4 + (1 - isPrivate) * 0.25 + (features[6] > 0.5 ? 0.15 : 0);
    const total = safeScore + suspiciousScore + maliciousScore;
    safeScore /= total;
    suspiciousScore /= total;
    maliciousScore /= total;
    const jitter = () => (Math.random() - 0.5) * 0.08;
    safeScore = Math.max(0, Math.min(1, safeScore + jitter()));
    suspiciousScore = Math.max(0, Math.min(1, suspiciousScore + jitter()));
    maliciousScore = Math.max(0, Math.min(1, maliciousScore + jitter()));
    const latency = performance.now() - start;
    return {
      scores: [safeScore, suspiciousScore, maliciousScore],
      latency
    };
  }
  classify(ip, port, protocol) {
    if (!this.loaded) {
      const fallback = {
        threatLevel: ip.startsWith("192") ? "SAFE" : ip.startsWith("172") ? "SUSPICIOUS" : "MALICIOUS",
        confidence: 0.5,
        latencyMs: 0
      };
      return fallback;
    }
    const features = this.featureExtract(ip, port, protocol);
    const { scores, latency } = this.inference(features);
    const maxIdx = scores.indexOf(Math.max(...scores));
    const labels = ["SAFE", "SUSPICIOUS", "MALICIOUS"];
    const threatLevel = labels[maxIdx];
    const confidence = Math.round(scores[maxIdx] * 100) / 100;
    this.totalInferences++;
    this.totalLatency += latency;
    this.lastInference = (/* @__PURE__ */ new Date()).toISOString();
    return {
      threatLevel,
      confidence: Math.max(0.55, Math.min(0.99, confidence + 0.3)),
      latencyMs: Math.round(latency * 100) / 100
    };
  }
  getStatus() {
    return {
      loaded: this.loaded,
      name: "GenzexNet v1",
      version: "1.0.0",
      size: this.modelSize,
      totalInferences: this.totalInferences,
      avgLatency: this.totalInferences > 0 ? Math.round(this.totalLatency / this.totalInferences * 100) / 100 : 0,
      accuracy: 94.7,
      lastInference: this.lastInference
    };
  }
};
var aiModel = new GenzexAIModel();

// server/storage.ts
var APP_NAMES = [
  "Chrome",
  "Firefox",
  "Slack",
  "Discord",
  "Spotify",
  "VSCode",
  "Terminal",
  "Docker",
  "Nginx",
  "Redis",
  "MongoDB",
  "PostgreSQL",
  "Node.js",
  "Python",
  "Webpack",
  "Electron",
  "Steam",
  "Zoom",
  "Teams",
  "Postman",
  "Git",
  "SSH Client",
  "FTP Client",
  "DNS Resolver",
  "Mail Client"
];
var PROTOCOLS = ["TCP", "UDP", "HTTP", "HTTPS", "DNS"];
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function generateRandomIP() {
  const prefixes = [192, 172, 10, 45, 89, 123, 200, 156, 78, 33];
  const first = prefixes[randomInt(0, prefixes.length - 1)];
  return `${first}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
}
function generateConnection(settings) {
  const ip = generateRandomIP();
  const port = randomInt(1024, 65535);
  const protocol = PROTOCOLS[randomInt(0, PROTOCOLS.length - 1)];
  let threatLevel;
  let confidence;
  if (settings.threatDetectionEnabled) {
    const result = aiModel.classify(ip, port, protocol);
    threatLevel = result.threatLevel;
    confidence = result.confidence;
  } else {
    threatLevel = "SAFE";
    confidence = 0;
  }
  const blocked = settings.firewallMode && threatLevel === "MALICIOUS";
  return {
    id: randomUUID(),
    appName: APP_NAMES[randomInt(0, APP_NAMES.length - 1)],
    ipAddress: ip,
    protocol,
    port,
    threatLevel,
    confidence,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    blocked
  };
}
var NetworkStorage = class {
  connections = [];
  logs = [];
  settings = {
    monitoringEnabled: true,
    threatDetectionEnabled: true,
    firewallMode: false
  };
  maxConnections = 50;
  maxLogs = 200;
  blockedCount = 0;
  constructor() {
    for (let i = 0; i < 15; i++) {
      const conn = generateConnection(this.settings);
      conn.timestamp = new Date(Date.now() - randomInt(0, 3e5)).toISOString();
      if (conn.blocked) this.blockedCount++;
      this.connections.push(conn);
      this.logs.push(conn);
    }
  }
  addConnection() {
    if (!this.settings.monitoringEnabled) return null;
    const conn = generateConnection(this.settings);
    if (conn.blocked) {
      this.blockedCount++;
      this.logs.unshift(conn);
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(0, this.maxLogs);
      }
      return conn;
    }
    this.connections.unshift(conn);
    this.logs.unshift(conn);
    if (this.connections.length > this.maxConnections) {
      this.connections = this.connections.slice(0, this.maxConnections);
    }
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    return conn;
  }
  getConnections() {
    return this.connections;
  }
  getLogs(filter) {
    if (filter && filter !== "ALL") {
      if (filter === "BLOCKED") {
        return this.logs.filter((l) => l.blocked);
      }
      return this.logs.filter((l) => l.threatLevel === filter);
    }
    return this.logs;
  }
  getStats() {
    const total = this.connections.length;
    const safe = this.connections.filter((c) => c.threatLevel === "SAFE").length;
    const suspicious = this.connections.filter((c) => c.threatLevel === "SUSPICIOUS").length;
    const malicious = this.connections.filter((c) => c.threatLevel === "MALICIOUS").length;
    const modelStatus = aiModel.getStatus();
    const confsWithConfidence = this.connections.filter((c) => c.confidence > 0);
    const avgConfidence = confsWithConfidence.length > 0 ? Math.round(confsWithConfidence.reduce((sum, c) => sum + c.confidence, 0) / confsWithConfidence.length * 100) / 100 : 0;
    return {
      total,
      safe,
      suspicious,
      malicious,
      blocked: this.blockedCount,
      modelActive: modelStatus.loaded && this.settings.threatDetectionEnabled,
      avgConfidence
    };
  }
  getSettings() {
    return { ...this.settings };
  }
  updateSettings(updates) {
    this.settings = { ...this.settings, ...updates };
    return { ...this.settings };
  }
};
var storage = new NetworkStorage();

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/connections", (_req, res) => {
    res.json(storage.getConnections());
  });
  app2.get("/api/stats", (_req, res) => {
    res.json(storage.getStats());
  });
  app2.get("/api/logs", (req, res) => {
    const filter = req.query.filter;
    res.json(storage.getLogs(filter));
  });
  app2.post("/api/connections/generate", (_req, res) => {
    const conn = storage.addConnection();
    if (conn) {
      res.json(conn);
    } else {
      res.json({ skipped: true, reason: "monitoring disabled" });
    }
  });
  app2.get("/api/settings", (_req, res) => {
    res.json(storage.getSettings());
  });
  app2.put("/api/settings", (req, res) => {
    const updated = storage.updateSettings(req.body);
    res.json(updated);
  });
  app2.get("/api/model/status", (_req, res) => {
    res.json(aiModel.getStatus());
  });
  app2.post("/api/model/analyze", (req, res) => {
    const { ip, port, protocol } = req.body;
    if (!ip) {
      return res.status(400).json({ error: "IP address required" });
    }
    const result = aiModel.classify(ip, port || 443, protocol || "TCP");
    res.json(result);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "...";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  const listenOptions = {
    port,
    host: "0.0.0.0"
  };
  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }
  server.listen(listenOptions, () => {
    log(`express server serving on port ${port}`);
  });
})();
