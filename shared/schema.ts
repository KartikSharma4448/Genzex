export interface Connection {
  id: string;
  appName: string;
  ipAddress: string;
  protocol: string;
  port: number;
  threatLevel: "SAFE" | "SUSPICIOUS" | "MALICIOUS";
  confidence: number;
  timestamp: string;
  blocked?: boolean;
}

export interface DashboardStats {
  total: number;
  safe: number;
  suspicious: number;
  malicious: number;
  blocked: number;
  modelActive: boolean;
  avgConfidence: number;
}

export interface Settings {
  monitoringEnabled: boolean;
  threatDetectionEnabled: boolean;
  firewallMode: boolean;
}

export interface ModelStatus {
  loaded: boolean;
  name: string;
  version: string;
  size: number;
  totalInferences: number;
  avgLatency: number;
  accuracy: number;
  lastInference: string | null;
}
