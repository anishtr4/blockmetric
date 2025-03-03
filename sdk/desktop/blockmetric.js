import { app, BrowserWindow, session } from 'electron';
import crypto from 'crypto';
import os from 'os';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch'; // Ensure this package is installed
import https from 'https';

class BlockmetricAnalytics {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://ses-stage.com/blockmetric-api';
    this.sessionId = this.generateSessionId();
    this.pageLoadTime = new Date();
    this.storagePath = options.storagePath || path.join(app.getPath('userData'), 'blockmetric');
    this.ensureStorageDirectory();
    this.visitorId = null;

    this.initializeVisitorId().then((id) => {
      this.visitorId = id;
      if (options.autoTrack !== false) {
        this.setupAppTracking();
      }
    });
  }

  ensureStorageDirectory() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  async generateVisitorFingerprint() {
    try {
      await app.whenReady();
      const currentWindow = BrowserWindow.getFocusedWindow();
      const webContents = currentWindow ? currentWindow.webContents : null;

      let userAgent = '';
      let language = app.getLocale();

      if (webContents) {
        userAgent = await webContents.executeJavaScript('navigator.userAgent');
      }

      const components = [
        app.getName(),
        app.getVersion(),
        userAgent,
        os.platform(),
        os.release(),
        os.arch(),
        os.hostname(),
        os.type(),
        os.cpus().map((cpu) => cpu.model).join(','),
        os.totalmem().toString(),
        currentWindow ? `${currentWindow.getBounds().width}x${currentWindow.getBounds().height}` : '',
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        new Date().getTimezoneOffset().toString()
      ].filter(Boolean);

      const fingerprint = components.join('|');
      return crypto.createHash('sha256').update(fingerprint).digest('hex');
    } catch (error) {
      console.error('Error generating visitor fingerprint:', error);
      return `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  async initializeVisitorId() {
    const visitorIdPath = path.join(this.storagePath, 'visitor_id.txt');

    try {
      if (fs.existsSync(visitorIdPath)) {
        const visitorId = fs.readFileSync(visitorIdPath, 'utf8').trim();
        if (visitorId) {
          return visitorId;
        }
      }
    } catch (e) {
      console.warn('Error reading visitor ID:', e);
    }

    const visitorId = await this.generateVisitorFingerprint();

    try {
      fs.writeFileSync(visitorIdPath, visitorId);
    } catch (e) {
      console.warn('Error saving visitor ID:', e);
    }

    return visitorId;
  }

  setupAppTracking() {
    // app.on('before-quit', () => this.trackAppExit());
    // app.on('window-all-closed', () => {
    //   if (process.platform !== 'darwin') {
    //     this.trackAppExit();
    //   }
    // });
    // app.on('browser-window-focus', () => this.trackEvent('window_focus'));
    // app.on('browser-window-blur', () => this.trackEvent('window_blur'));

    app.on('browser-window-created', (event, window) => {
      this.trackScreenView(window.webContents.getTitle() || 'New Window');
      window.webContents.on('did-navigate', (event, url) => {
        this.trackScreenView(window.webContents.getTitle() || url);
      });
    });
  }

  trackScreenView(screenName) {
    if (!this.visitorId) return;

    const currentWindow = BrowserWindow.getFocusedWindow();
    this.pageLoadTime = new Date();

    const data = {
      title: screenName,
      timestamp: this.pageLoadTime.toISOString(),
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      pageViewId: `${this.visitorId}_${this.pageLoadTime.getTime()}`,
      appName: app.getName(),
      appVersion: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      screenResolution: currentWindow ? `${currentWindow.getBounds().width}x${currentWindow.getBounds().height}` : 'unknown',
      language: app.getLocale(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: `Mozilla/5.0 (${os.platform() === 'darwin' ? 'Macintosh' : os.type()}; ${os.arch()} ${os.platform() === 'win32' ? 'Windows NT ' + os.release() : os.platform() === 'darwin' ? 'Intel Mac OS X ' + os.release().replace(/\./g, '_') : os.type() + ' ' + os.release()}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`,

    };

    this.sendRequest('/analytics/pageviews', data);
  }

  trackAppExit() {
    if (!this.visitorId) return;

    const exitTime = new Date();
    const timeSpent = exitTime.getTime() - this.pageLoadTime.getTime();

    if (timeSpent >= 1000) {
      this.trackEvent('app_exit', { timeSpent, exitTime: exitTime.toISOString() });
    }
  }

  async trackEvent(eventName, eventData = {}) {
    if (!this.visitorId) return;

    try {
   

      const data = {
        eventName,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        appName: app.getName(),
        appVersion: app.getVersion(),
        ...eventData
    };

      await this.sendRequest('/analytics/events', data);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  generateSessionId() {
    return crypto.randomUUID();
  }

  async sendRequest(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
           'User-Agent': `Mozilla/5.0 (${os.platform() === 'darwin' ? 'Macintosh' : os.type()}; ${os.arch()} ${os.platform() === 'win32' ? 'Windows NT ' + os.release() : os.platform() === 'darwin' ? 'Intel Mac OS X ' + os.release().replace(/\./g, '_') : os.type() + ' ' + os.release()}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`,
          'Origin': `app://${app.getName()}`
        },
        body: JSON.stringify(data),
        agent: new https.Agent({ rejectUnauthorized: false }) // ⚠️ Allows self-signed SSL (Only for testing)
      });
  
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorBody}`);
      }
    } catch (error) {
      console.error('Error sending analytics data:', error);
    }
  }
  
}

export default BlockmetricAnalytics;
