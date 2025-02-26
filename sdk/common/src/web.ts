import { BlockmetricCore } from './core';
import { BlockmetricOptions, DeviceInfo, AppInfo } from './types';

export class BlockmetricWeb extends BlockmetricCore {
  constructor(apiKey: string, options: BlockmetricOptions = {}) {
    super(apiKey, options);
    this.setupPageTracking();
  }

  protected getDeviceInfo(): DeviceInfo {
    return {
      platform: 'web',
      version: navigator.userAgent,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      connectionType: ((navigator as any).connection || {}).effectiveType || 'unknown'
    };
  }

  protected getAppInfo(): AppInfo {
    return {
      name: document.title,
      version: '1.0.0', // You might want to make this configurable
      path: window.location.href,
      locale: navigator.language
    };
  }

  protected async generateVisitorFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.languages?.join(','),
      (navigator as any).deviceMemory,
      navigator.hardwareConcurrency,
      navigator.platform || 'unknown',
      navigator.vendor,
      screen.colorDepth,
      screen.pixelDepth,
      `${screen.width}x${screen.height}`,
      window.devicePixelRatio,
      new Date().getTimezoneOffset(),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      !!navigator.cookieEnabled,
      !!window.indexedDB,
      !!window.localStorage,
      !!window.sessionStorage
    ].filter(Boolean);

    const fingerprint = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  protected async getStoredVisitorId(): Promise<string | null> {
    const storageKey = 'blockmetric_visitor_id';
    return localStorage.getItem(storageKey) || this.getCookie(storageKey);
  }

  protected async storeVisitorId(id: string): Promise<void> {
    const storageKey = 'blockmetric_visitor_id';
    try {
      localStorage.setItem(storageKey, id);
      this.setCookie(storageKey, id, 365);
    } catch (e) {
      console.warn('Failed to store visitor ID:', e);
    }
  }

  protected generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + value + expires + "; path=/; SameSite=Strict";
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private setupPageTracking(): void {
    window.addEventListener('load', () => this.trackStart());
    window.addEventListener('beforeunload', () => this.trackExit());

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.trackEvent('page_blur');
      } else {
        this.trackEvent('page_focus');
      }
    });
  }

  public async trackPageView(properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('page_view', {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
      ...properties
    });
  }
}