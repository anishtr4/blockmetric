import AnalyticsService from './analyticsService';

let analyticsInstance: AnalyticsService | null = null;

export const initializeAnalytics = (apiKey: string, baseUrl: string): void => {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService(apiKey, baseUrl);
    setupGlobalTracking();
  }
};

const setupGlobalTracking = (): void => {
  if (!analyticsInstance) return;

  // Track initial page view
  analyticsInstance.trackPageView();

  // Track subsequent page views
  window.addEventListener('popstate', () => {
    analyticsInstance?.trackPageView();
  });

  // Track user interactions
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target) {
      const interactionData = {
        type: 'click',
        target: target.tagName.toLowerCase() +
          (target.id ? `#${target.id}` : '') +
          (target.className ? `.${target.className.split(' ').join('.')}` : '')
      };
      analyticsInstance?.trackUserInteraction(interactionData.type, interactionData.target);
    }
  });

  // Track form submissions
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;
    if (form) {
      analyticsInstance?.trackUserInteraction('form_submit', 
        `form${form.id ? `#${form.id}` : ''}`
      );
    }
  });

  // Track errors
  window.addEventListener('error', (event) => {
    analyticsInstance?.trackUserInteraction('error', 
      `${event.error?.name}: ${event.error?.message}`
    );
  });

  // Track user engagement
  let lastActivityTime = Date.now();
  const activityEvents = ['mousemove', 'keydown', 'scroll', 'click'];
  
  activityEvents.forEach(eventType => {
    document.addEventListener(eventType, () => {
      const now = Date.now();
      if (now - lastActivityTime > 30000) { // 30 seconds threshold
        analyticsInstance?.trackUserInteraction('user_active', 'engagement_resumed');
      }
      lastActivityTime = now;
    });
  });
};

export const getAnalyticsInstance = (): AnalyticsService | null => {
  return analyticsInstance;
};