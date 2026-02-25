import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import type { Connection, DashboardStats, Settings, ModelStatus } from "@shared/schema";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

interface NetworkContextValue {
  connections: Connection[];
  stats: DashboardStats;
  logs: Connection[];
  settings: Settings;
  modelStatus: ModelStatus | null;
  logFilter: string;
  setLogFilter: (filter: string) => void;
  updateSetting: (key: keyof Settings, value: boolean) => void;
  isLoading: boolean;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

const APP_NAMES = [
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
];

const PROTOCOLS = ["TCP", "UDP", "HTTP", "HTTPS", "DNS"] as const;
const MAX_CONNECTIONS = 50;
const MAX_LOGS = 200;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateRandomIP(): string {
  const prefixes = [192, 172, 10, 45, 89, 123, 200, 156, 78, 33];
  const first = prefixes[randomInt(0, prefixes.length - 1)];
  return `${first}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
}

function classifyThreat(ip: string, settings: Settings): { threatLevel: Connection["threatLevel"]; confidence: number } {
  if (!settings.threatDetectionEnabled) {
    return { threatLevel: "SAFE", confidence: 0 };
  }

  const firstOctet = Number(ip.split(".")[0]);
  if ([45, 89, 123, 200, 156, 78, 33].includes(firstOctet)) {
    return { threatLevel: Math.random() > 0.45 ? "MALICIOUS" : "SUSPICIOUS", confidence: 0.75 + Math.random() * 0.2 };
  }

  if ([172, 10].includes(firstOctet)) {
    return { threatLevel: "SUSPICIOUS", confidence: 0.6 + Math.random() * 0.25 };
  }

  return { threatLevel: "SAFE", confidence: 0.55 + Math.random() * 0.2 };
}

function generateConnection(settings: Settings): Connection {
  const ip = generateRandomIP();
  const { threatLevel, confidence } = classifyThreat(ip, settings);
  const blocked = settings.firewallMode && threatLevel === "MALICIOUS";

  return {
    id: randomId(),
    appName: APP_NAMES[randomInt(0, APP_NAMES.length - 1)],
    ipAddress: ip,
    protocol: PROTOCOLS[randomInt(0, PROTOCOLS.length - 1)],
    port: randomInt(1024, 65535),
    threatLevel,
    confidence: Math.round(confidence * 100) / 100,
    timestamp: new Date().toISOString(),
    blocked,
  };
}

function filterLogs(items: Connection[], filter: string): Connection[] {
  if (filter === "ALL") return items;
  if (filter === "BLOCKED") return items.filter((l) => l.blocked);
  return items.filter((l) => l.threatLevel === filter);
}

function calculateStats(connections: Connection[], blockedCount: number, settings: Settings): DashboardStats {
  const safe = connections.filter((c) => c.threatLevel === "SAFE").length;
  const suspicious = connections.filter((c) => c.threatLevel === "SUSPICIOUS").length;
  const malicious = connections.filter((c) => c.threatLevel === "MALICIOUS").length;
  const confsWithConfidence = connections.filter((c) => c.confidence > 0);
  const avgConfidence = confsWithConfidence.length > 0
    ? Math.round((confsWithConfidence.reduce((sum, c) => sum + c.confidence, 0) / confsWithConfidence.length) * 100) / 100
    : 0;

  return {
    total: connections.length,
    safe,
    suspicious,
    malicious,
    blocked: blockedCount,
    modelActive: settings.threatDetectionEnabled,
    avgConfidence,
  };
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ total: 0, safe: 0, suspicious: 0, malicious: 0, blocked: 0, modelActive: false, avgConfidence: 0 });
  const [logs, setLogs] = useState<Connection[]>([]);
  const [allLogs, setAllLogs] = useState<Connection[]>([]);
  const [settings, setSettings] = useState<Settings>({
    monitoringEnabled: true,
    threatDetectionEnabled: true,
    firewallMode: false,
  });
  const [blockedCount, setBlockedCount] = useState(0);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [logFilter, setLogFilter] = useState("ALL");
  const [useLocalSimulation, setUseLocalSimulation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const localInitRef = useRef(false);

  const baseUrl = useMemo(() => {
    try {
      return getApiUrl();
    } catch {
      return "";
    }
  }, []);

  const initializeLocalSimulation = useCallback(() => {
    if (localInitRef.current) return;
    localInitRef.current = true;
    setUseLocalSimulation(true);

    const seededLogs: Connection[] = [];
    const seededConnections: Connection[] = [];
    let seededBlockedCount = 0;
    for (let i = 0; i < 15; i++) {
      const conn = generateConnection(settings);
      conn.timestamp = new Date(Date.now() - randomInt(0, 300000)).toISOString();
      seededLogs.push(conn);
      if (conn.blocked) {
        seededBlockedCount++;
      } else {
        seededConnections.push(conn);
      }
    }

    setConnections(seededConnections.slice(0, MAX_CONNECTIONS));
    setAllLogs(seededLogs.slice(0, MAX_LOGS));
    setLogs(filterLogs(seededLogs, logFilter).slice(0, MAX_LOGS));
    setBlockedCount(seededBlockedCount);
    setStats(calculateStats(seededConnections, seededBlockedCount, settings));
    setModelStatus({
      loaded: true,
      name: "GenzexNet (On-device Simulator)",
      version: "1.0.0",
      size: 0,
      totalInferences: seededLogs.length,
      avgLatency: 0.05,
      accuracy: 94.7,
      lastInference: new Date().toISOString(),
    });
    setIsLoading(false);
  }, [logFilter, settings]);

  const fetchData = useCallback(async () => {
    if (!baseUrl) {
      initializeLocalSimulation();
      return;
    }
    try {
      const [connRes, statsRes, settingsRes, modelRes] = await Promise.all([
        fetch(`${baseUrl}api/connections`),
        fetch(`${baseUrl}api/stats`),
        fetch(`${baseUrl}api/settings`),
        fetch(`${baseUrl}api/model/status`),
      ]);
      const [connData, statsData, settingsData, modelData] = await Promise.all([
        connRes.json(),
        statsRes.json(),
        settingsRes.json(),
        modelRes.json(),
      ]);
      setConnections(connData);
      setStats(statsData);
      setSettings(settingsData);
      setModelStatus(modelData);
      setUseLocalSimulation(false);
      setIsLoading(false);
    } catch (e) {
      console.error("Failed to fetch data:", e);
      initializeLocalSimulation();
    }
  }, [baseUrl, initializeLocalSimulation]);

  const fetchLogs = useCallback(async () => {
    if (!baseUrl || useLocalSimulation) return;
    try {
      const res = await fetch(`${baseUrl}api/logs?filter=${logFilter}`);
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs:", e);
    }
  }, [baseUrl, logFilter, useLocalSimulation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (useLocalSimulation) return;
    if (!baseUrl || !settings.monitoringEnabled) return;

    const interval = setInterval(async () => {
      try {
        await fetch(`${baseUrl}api/connections/generate`, { method: "POST" });
        await fetchData();
        await fetchLogs();
      } catch (e) {
        console.error("Failed to generate connection:", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [baseUrl, settings.monitoringEnabled, fetchData, fetchLogs, useLocalSimulation]);

  useEffect(() => {
    if (!useLocalSimulation) return;
    setLogs(filterLogs(allLogs, logFilter));
  }, [allLogs, logFilter, useLocalSimulation]);

  useEffect(() => {
    if (!useLocalSimulation || !settings.monitoringEnabled) return;

    const interval = setInterval(() => {
      const conn = generateConnection(settings);
      setAllLogs((prev) => [conn, ...prev].slice(0, MAX_LOGS));
      setConnections((prev) => (conn.blocked ? prev : [conn, ...prev].slice(0, MAX_CONNECTIONS)));
      setModelStatus((prev) => prev
        ? {
          ...prev,
          totalInferences: settings.threatDetectionEnabled ? prev.totalInferences + 1 : prev.totalInferences,
          lastInference: new Date().toISOString(),
        }
        : prev);

      if (conn.blocked) {
        setBlockedCount((prev) => prev + 1);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [settings, useLocalSimulation]);

  useEffect(() => {
    if (!useLocalSimulation) return;
    setStats(calculateStats(connections, blockedCount, settings));
  }, [blockedCount, connections, settings, useLocalSimulation]);

  const updateSetting = useCallback(async (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (!baseUrl || useLocalSimulation) {
      return;
    }

    try {
      await apiRequest("PUT", "/api/settings", { [key]: value });
    } catch (e) {
      console.error("Failed to update setting:", e);
    }
  }, [baseUrl, settings, useLocalSimulation]);

  const value = useMemo(() => ({
    connections,
    stats,
    logs,
    settings,
    modelStatus,
    logFilter,
    setLogFilter,
    updateSetting,
    isLoading,
  }), [connections, stats, logs, settings, modelStatus, logFilter, updateSetting, isLoading]);

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
