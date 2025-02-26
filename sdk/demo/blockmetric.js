class BlockmetricAnalytics {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'http://192.168.1.3:5002';
    this.sessionId = this.generateSessionId();
    this.pageLoadTime = new Date();
    this.visitorId = this.getOrCreateVisitorId();
    this.setupPageTracking();
  }

  // Generate a unique visitor ID based on multiple identification methods
  async generateVisitorFingerprint() {
    try {
      const components = [
        // Browser-specific information
        navigator.userAgent,
        navigator.language,
        navigator.languages?.join(','),
        navigator.deviceMemory,
        navigator.hardwareConcurrency,
        navigator.platform || 'unknown',
        navigator.vendor,
        // Screen properties
        screen.colorDepth,
        screen.pixelDepth,
        screen.width + 'x' + screen.height,
        window.devicePixelRatio,
        // System information
        new Date().getTimezoneOffset(),
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        // Browser capabilities
        !!navigator.cookieEnabled,
        !!navigator.onLine,
        !!window.indexedDB,
        !!window.localStorage,
        !!window.sessionStorage,
        // Canvas fingerprint (simplified)
        this.getCanvasFingerprint(),
        // Audio fingerprint
        this.getAudioFingerprint(),
        // WebGL information
        this.getWebGLFingerprint(),
        // Installed plugins
        this.getPluginsFingerprint()
      ].filter(Boolean); // Remove any undefined values

      const fingerprint = components.join('|');

      // Try using crypto.subtle API first
      if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprint);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      // Fallback to simple hashing when crypto API is not available
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    } catch (error) {
      console.error('Error generating visitor fingerprint:', error);
      // Return a timestamp-based fallback ID as last resort
      return `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // Get canvas fingerprint
  getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Draw a complex shape with different colors and fonts
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125,1,62,20);
      ctx.fillStyle = '#069';
      ctx.fillText('Blockmetric:)', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Analytics', 4, 17);

      return canvas.toDataURL();
    } catch (e) {
      return '';
    }
  }

  // Get audio fingerprint
  getAudioFingerprint() {
    try {
      const audioContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
      
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
      compressor.knee.setValueAtTime(40, audioContext.currentTime);
      compressor.ratio.setValueAtTime(12, audioContext.currentTime);
      compressor.attack.setValueAtTime(0, audioContext.currentTime);
      compressor.release.setValueAtTime(0.25, audioContext.currentTime);

      oscillator.connect(compressor);
      compressor.connect(audioContext.destination);
      oscillator.start(0);

      return audioContext.startRendering().then(buffer => {
        const data = buffer.getChannelData(0).slice(4500, 5000);
        return data.reduce((acc, val) => acc + Math.abs(val), 0).toString();
      });
    } catch (e) {
      return '';
    }
  }

  // Get WebGL fingerprint
  getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return '';

      const info = [
        gl.getParameter(gl.VERSION),
        gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        gl.getParameter(gl.VENDOR),
        gl.getParameter(gl.RENDERER),
        gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
        gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)
      ];

      return info.join('|');
    } catch (e) {
      return '';
    }
  }

  // Get plugins fingerprint
  getPluginsFingerprint() {
    try {
      const plugins = Array.from(navigator.plugins || []);
      return plugins.map(p => [p.name, p.description, p.filename].join(':')).join('|');
    } catch (e) {
      return '';
    }
  }

  // Get or create a persistent visitor ID using multiple storage methods
  async getOrCreateVisitorId() {
    const storageKey = 'blockmetric_visitor_id';
    let visitorId;

    // Try to get from cookie first
    visitorId = this.getCookie(storageKey);
    
    // If not in cookie, try localStorage
    if (!visitorId) {
      visitorId = localStorage.getItem(storageKey);
    }

    // If still no visitor ID, generate a new one
    if (!visitorId) {
      visitorId = await this.generateVisitorFingerprint();
      
      // Try to set in both cookie and localStorage for redundancy
      this.setCookie(storageKey, visitorId, 365); // 1 year expiry
      try {
        localStorage.setItem(storageKey, visitorId);
      } catch (e) {
        console.warn('LocalStorage not available');
      }
    }

    return visitorId;
  }

  // Cookie helper methods
  setCookie(name, value, days) {
    try {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = "; expires=" + date.toUTCString();
      document.cookie = name + "=" + value + expires + "; path=/; SameSite=Strict";
    } catch (e) {
      console.warn('Unable to set cookie:', e);
    }
  }

  getCookie(name) {
    try {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
    } catch (e) {
      console.warn('Unable to read cookie:', e);
    }
    return null;
  }

  setupPageTracking() {
    // Track when page becomes hidden (user leaves the page)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.trackPageExit();
      }
    });

    // Track when user is about to leave the page
    window.addEventListener('beforeunload', () => {
      this.trackPageExit();
    });
  }

  async shouldTrackPageview() {
    // Always track pageviews instantly
    return true;
  }

  cleanupOldPageviewEntries(visitorId) {
    try {
      const keys = Object.keys(localStorage);
      const pageviewPrefix = `blockmetric_pageview_${visitorId}_`;
      const now = new Date();
      
      // Remove entries older than 24 hours
      keys.forEach(key => {
        if (key.startsWith(pageviewPrefix)) {
          const [year, month, day, hour] = key.replace(pageviewPrefix, '').split('-').map(Number);
          const entryDate = new Date(year, month, day, hour);
          
          if (now.getTime() - entryDate.getTime() > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (e) {
      console.warn('Error cleaning up old pageview entries:', e);
    }
  }

  async trackPageview() {
    try {
      // Check if we should track this pageview
      if (!(await this.shouldTrackPageview())) {
        return;
      }

      this.pageLoadTime = new Date(); // Reset page load time
      const visitorId = await this.getOrCreateVisitorId();
      
      // Create a unique page view identifier combining visitor ID and timestamp
      const pageViewId = `${visitorId}_${this.pageLoadTime.getTime()}`;
      
      // Check if this is a page refresh by looking at the last pageview timestamp
      const lastPageviewKey = `blockmetric_last_pageview_${visitorId}`;
      const lastPageview = localStorage.getItem(lastPageviewKey);
      const currentTime = this.pageLoadTime.getTime();
      
      // If last pageview was within last 2 seconds, treat as refresh and skip
      if (lastPageview && (currentTime - parseInt(lastPageview)) < 2000) {
        console.debug('Skipping pageview tracking - detected as page refresh');
        return;
      }
      
      // Update last pageview timestamp
      try {
        localStorage.setItem(lastPageviewKey, currentTime.toString());
      } catch (e) {
        console.warn('Unable to store last pageview timestamp');
      }
      
      const data = {
        title: document.title,
        referrer: document.referrer,
        timestamp: this.pageLoadTime.toISOString(),
        sessionId: this.sessionId,
        visitorId: visitorId,
        pageViewId: pageViewId,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        connectionType: (navigator.connection || {}).effectiveType || 'unknown',
        pageLoadTime: this.pageLoadTime.getTime()
      };

      await this.sendRequest('/api/analytics/pageviews', data);
    } catch (error) {
      console.error('Error tracking pageview:', error);
    }
  }

  async trackPageExit() {
    try {
      const exitTime = new Date();
      const timeSpent = exitTime.getTime() - this.pageLoadTime.getTime();
      
      // Only track if the time spent is reasonable (between 1 second and 1 hour)
      if (timeSpent >= 1000 && timeSpent <= 3600000) {
        await this.trackEvent('page_exit', {
          title: document.title,
          timeSpent,
          exitTime: exitTime.toISOString()
        });
      }
    } catch (error) {
      console.error('Error tracking page exit:', error);
    }
  }

  async trackEvent(eventName, eventData = {}) {
    try {
      const data = {
        eventName,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        ...eventData
      };

      await this.sendRequest('/api/analytics/events', data);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  // Private methods
  generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async sendRequest(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-Forwarded-For': '1' // Signal to backend that IP tracking is enabled
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending analytics data:', error);
      throw error;
    }
  }
}

// Auto-initialize if script is loaded with data-api-key attribute
document.addEventListener('DOMContentLoaded', () => {
  const script = document.querySelector('script[data-api-key]');
  if (script) {
    const apiKey = script.getAttribute('data-api-key');
    const baseUrl = script.getAttribute('data-base-url');
    window.blockmetric = new BlockmetricAnalytics(apiKey, { baseUrl });
    window.blockmetric.trackPageview();
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlockmetricAnalytics;
} else {
  window.BlockmetricAnalytics = BlockmetricAnalytics;
}