export interface BlockmetricOptions {
  baseUrl?: string;
}

export interface DeviceInfo {
  platform: string;
  arch?: string;
  version: string;
  hostname?: string;
  cpus?: number;
  memory?: number;
  type?: string;
  userAgent?: string;
  language?: string;
  screenResolution?: string;
  timezone?: string;
  connectionType?: string;
}

export interface AppInfo {
  name: string;
  version: string;
  path?: string;
  locale?: string;
}

export interface EventData {
  eventName: string;
  timestamp: string;
  sessionId: string;
  visitorId: string;
  device: DeviceInfo;
  app: AppInfo;
  [key: string]: any;
}

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export interface FingerprinterAdapter {
  generateFingerprint(): Promise<string>;
}