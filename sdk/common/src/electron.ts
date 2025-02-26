import { app } from 'electron';
import { BlockmetricCore } from './core';
import { BlockmetricOptions, DeviceInfo, AppInfo } from './types';
import * as os from 'os';
import * as crypto from 'crypto';
import Store from 'electron-store';

type StoreType = {
  get: (key: string) => any;
  set: (key: string, value: any) => void;
};

export class BlockmetricElectron extends BlockmetricCore {
  private store: StoreType;

  constructor(apiKey: string, options: BlockmetricOptions = {}) {
    super(apiKey, options);
    this.store = new Store() as unknown as StoreType;
    this.setupAppTracking();
  }

  protected getDeviceInfo(): DeviceInfo {
    return {
      platform: process.platform,
      arch: process.arch,
      version: os.release(),
      hostname: os.hostname(),
      cpus: os.cpus().length,
      memory: os.totalmem(),
      type: os.type()
    };
  }

  protected getAppInfo(): AppInfo {
    return {
      name: app.getName(),
      version: app.getVersion(),
      path: app.getPath('exe'),
      locale: app.getLocale()
    };
  }

  protected async generateVisitorFingerprint(): Promise<string> {
    const components = [
      process.platform,
      process.arch,
      os.release(),
      os.hostname(),
      os.cpus().length,
      os.totalmem(),
      os.type(),
      app.getName(),
      app.getVersion(),
      app.getPath('exe'),
      app.getLocale()
    ].filter(Boolean);

    const fingerprint = components.join('|');
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  protected async getStoredVisitorId(): Promise<string | null> {
    const storageKey = 'blockmetric_visitor_id';
    return this.store.get(storageKey) as string | null;
  }

  protected async storeVisitorId(id: string): Promise<void> {
    const storageKey = 'blockmetric_visitor_id';
    this.store.set(storageKey, id);
  }

  protected generateSessionId(): string {
    return crypto.randomUUID();
  }

  private setupAppTracking(): void {
    // Track app start
    this.trackStart();

    // Track app exit
    app.on('before-quit', async () => {
      await this.trackExit();
    });

    // Track window focus/blur
    app.on('browser-window-focus', () => {
      this.trackEvent('window_focus');
    });

    app.on('browser-window-blur', () => {
      this.trackEvent('window_blur');
    });
  }

  public async trackScreenView(screenName: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties
    });
  }

  public async trackUserAction(action: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('user_action', {
      action,
      ...properties
    });
  }
}