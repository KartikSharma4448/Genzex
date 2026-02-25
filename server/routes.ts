import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { aiModel } from "./ai-model";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/connections", (_req, res) => {
    res.json(storage.getConnections());
  });

  app.get("/api/stats", (_req, res) => {
    res.json(storage.getStats());
  });

  app.get("/api/logs", (req, res) => {
    const filter = req.query.filter as string | undefined;
    res.json(storage.getLogs(filter));
  });

  app.post("/api/connections/generate", (_req, res) => {
    const conn = storage.addConnection();
    if (conn) {
      res.json(conn);
    } else {
      res.json({ skipped: true, reason: "monitoring disabled" });
    }
  });

  app.get("/api/settings", (_req, res) => {
    res.json(storage.getSettings());
  });

  app.put("/api/settings", (req, res) => {
    const updated = storage.updateSettings(req.body);
    res.json(updated);
  });

  app.get("/api/model/status", (_req, res) => {
    res.json(aiModel.getStatus());
  });

  app.post("/api/model/analyze", (req, res) => {
    const { ip, port, protocol } = req.body;
    if (!ip) {
      return res.status(400).json({ error: "IP address required" });
    }
    const result = aiModel.classify(ip, port || 443, protocol || "TCP");
    res.json(result);
  });

  const httpServer = createServer(app);
  return httpServer;
}
