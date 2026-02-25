import { randomUUID } from "crypto";
import type { Connection, DashboardStats, Settings } from "@shared/schema";
import { aiModel } from "./ai-model";

const APP_NAMES = [
  "Chrome", "Firefox", "Slack", "Discord", "Spotify",
  "VSCode", "Terminal", "Docker", "Nginx", "Redis",
  "MongoDB", "PostgreSQL", "Node.js", "Python", "Webpack",
  "Electron", "Steam", "Zoom", "Teams", "Postman",
  "Git", "SSH Client", "FTP Client", "DNS Resolver", "Mail Client",
];

const PROTOCOLS = ["TCP", "UDP", "HTTP", "HTTPS", "DNS"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomIP(): string {
  const prefixes = [192, 172, 10, 45, 89, 123, 200, 156, 78, 33];
  const first = prefixes[randomInt(0, prefixes.length - 1)];
  return `${first}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
}

function generateConnection(settings: Settings): Connection {
  const ip = generateRandomIP();
  const port = randomInt(1024, 65535);
  const protocol = PROTOCOLS[randomInt(0, PROTOCOLS.length - 1)];

  let threatLevel: "SAFE" | "SUSPICIOUS" | "MALICIOUS";
  let confidence: number;

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
    timestamp: new Date().toISOString(),
    blocked,
  };
}

class NetworkStorage {
  private connections: Connection[] = [];
  private logs: Connection[] = [];
  private settings: Settings = {
    monitoringEnabled: true,
    threatDetectionEnabled: true,
    firewallMode: false,
  };
  private maxConnections = 50;
  private maxLogs = 200;
  private blockedCount = 0;

  constructor() {
    for (let i = 0; i < 15; i++) {
      const conn = generateConnection(this.settings);
      conn.timestamp = new Date(Date.now() - randomInt(0, 300000)).toISOString();
      if (conn.blocked) this.blockedCount++;
      this.connections.push(conn);
      this.logs.push(conn);
    }
  }

  addConnection(): Connection | null {
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

  getConnections(): Connection[] {
    return this.connections;
  }

  getLogs(filter?: string): Connection[] {
    if (filter && filter !== "ALL") {
      if (filter === "BLOCKED") {
        return this.logs.filter((l) => l.blocked);
      }
      return this.logs.filter((l) => l.threatLevel === filter);
    }
    return this.logs;
  }

  getStats(): DashboardStats {
    const total = this.connections.length;
    const safe = this.connections.filter((c) => c.threatLevel === "SAFE").length;
    const suspicious = this.connections.filter((c) => c.threatLevel === "SUSPICIOUS").length;
    const malicious = this.connections.filter((c) => c.threatLevel === "MALICIOUS").length;
    const modelStatus = aiModel.getStatus();
    const confsWithConfidence = this.connections.filter((c) => c.confidence > 0);
    const avgConfidence = confsWithConfidence.length > 0
      ? Math.round((confsWithConfidence.reduce((sum, c) => sum + c.confidence, 0) / confsWithConfidence.length) * 100) / 100
      : 0;

    return {
      total,
      safe,
      suspicious,
      malicious,
      blocked: this.blockedCount,
      modelActive: modelStatus.loaded && this.settings.threatDetectionEnabled,
      avgConfidence,
    };
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<Settings>): Settings {
    this.settings = { ...this.settings, ...updates };
    return { ...this.settings };
  }
}

export const storage = new NetworkStorage();
