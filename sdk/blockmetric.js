class BlockmetricAnalytics {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'http://localhost:5002';
    this.sessionId = this.generateSessionId();
  }

  async trackPageview() {
    try {
      const data = {
        title: document.title,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        connectionType: (navigator.connection || {}).effectiveType || 'unknown'
      };

      await this.sendRequest('/api/analytics/pageviews', data);
    } catch (error) {
      console.error('Error tracking pageview:', error);
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
          'X-API-Key': this.apiKey
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