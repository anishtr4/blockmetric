const { app } = require('electron');
const os = require('os');
const crypto = require('crypto');
const fetch = require('node-fetch');
const Store = require('electron-store');

class BlockmetricDesktop {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.blockmetric.io';
    this.sessionId = this.generateSessionId();
    this.appStartTime = new Date();
    this.store = new Store();
    this.deviceInfo = this.getDeviceInfo();
    this.appInfo = this.getAppInfo();
    this.visitorId = this.getOrCreateVisitorId();
  }

  getDeviceInfo() {
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

  getAppInfo() {
    return {
      name: app.getName(),
      version: app.getVersion(),
      path: app.getPath('exe'),
      locale: app.getLocale()
    };
  }

  generateSessionId() {
    return crypto.randomUUID();
  }

  generateVisitorFingerprint() {
    const components = [
      this.deviceInfo.platform,
      this.deviceInfo.arch,
      this.deviceInfo.version,
      this.deviceInfo.hostname,
      this.deviceInfo.cpus,
      this.deviceInfo.memory,
      this.deviceInfo.type,
      this.appInfo.name,
      this.appInfo.version,
      this.appInfo.path,
      this.appInfo.locale
    ].filter(Boolean);

    const fingerprint = components.join('|');
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  getOrCreateVisitorId() {
    const storageKey = 'blockmetric_visitor_id';
    let visitorId = this.store.get(storageKey);

    if (!visitorId) {
      visitorId = this.generateVisitorFingerprint();
      this.store.set(storageKey, visitorId);
    }

    return visitorId;
  }

  async trackEvent(eventName, properties = {}) {
    const eventData = {
      eventName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      device: this.deviceInfo,
      app: this.appInfo,
      ...properties
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'x-app-identifier': this.appInfo.name
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

  async trackAppStart() {
    await this.trackEvent('app_start');
  }

  async trackAppExit() {
    const exitTime = new Date();
    const timeSpent = exitTime.getTime() - this.appStartTime.getTime();

    await this.trackEvent('app_exit', {
      time_spent: timeSpent,
      exit_time: exitTime.toISOString()
    });
  }

  async trackScreenView(screenName) {
    await this.trackEvent('screen_view', { screen_name: screenName });
  }

  async trackUserAction(action, properties = {}) {
    await this.trackEvent('user_action', {
      action,
      ...properties
    });
  }

  setupAppTracking() {
    // Track app start
    this.trackAppStart();

    // Track app exit
    app.on('before-quit', async () => {
      await this.trackAppExit();
    });

    // Track window focus/blur
    app.on('browser-window-focus', () => {
      this.trackEvent('window_focus');
    });

    app.on('browser-window-blur', () => {
      this.trackEvent('window_blur');
    });
  }
}

module.exports = BlockmetricDesktop;