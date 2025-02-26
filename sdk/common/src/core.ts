import { EventData, BlockmetricOptions, DeviceInfo, AppInfo } from './types';

export abstract class BlockmetricCore {
  protected apiKey: string;
  protected baseUrl: string;
  protected sessionId: string;
  protected startTime: Date;
  protected visitorId: string;

  constructor(apiKey: string, options: BlockmetricOptions = {}) {
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.blockmetric.io';
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    this.visitorId = '';
  }

  protected abstract getDeviceInfo(): DeviceInfo;
  protected abstract getAppInfo(): AppInfo;
  protected abstract generateVisitorFingerprint(): Promise<string>;
  protected abstract getStoredVisitorId(): Promise<string | null>;
  protected abstract storeVisitorId(id: string): Promise<void>;

  protected async getOrCreateVisitorId(): Promise<string> {
    let visitorId = await this.getStoredVisitorId();
    
    if (!visitorId) {
      visitorId = await this.generateVisitorFingerprint();
      await this.storeVisitorId(visitorId);
    }

    return visitorId;
  }

  protected abstract generateSessionId(): string;

  protected async sendEvent(eventName: string, properties: Record<string, any> = {}): Promise<void> {
    const eventData: EventData = {
      eventName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      device: await this.getDeviceInfo(),
      app: await this.getAppInfo(),
      ...properties
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error(`Failed to track event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error tracking event:', error);
      // TODO: Implement offline event queue
    }
  }

  public async trackEvent(eventName: string, properties: Record<string, any> = {}): Promise<void> {
    await this.sendEvent(eventName, properties);
  }

  public async trackStart(): Promise<void> {
    await this.sendEvent('start');
  }

  public async trackExit(): Promise<void> {
    const exitTime = new Date();
    const timeSpent = exitTime.getTime() - this.startTime.getTime();

    await this.sendEvent('exit', {
      time_spent: timeSpent,
      exit_time: exitTime.toISOString()
    });
  }
}