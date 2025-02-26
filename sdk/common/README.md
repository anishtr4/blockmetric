# @blockmetric/sdk

A unified analytics SDK for tracking user behavior in both web and Electron applications.

## Installation

```bash
npm install @blockmetric/sdk
```

## Usage

### Web Applications

```typescript
import { BlockmetricWeb } from '@blockmetric/sdk';

const analytics = new BlockmetricWeb('your-api-key');

// Track page views
analytics.trackPageView();

// Track custom events
analytics.trackEvent('button_click', {
  button_id: 'submit-form',
  page: '/checkout'
});
```

### Electron Applications

```typescript
import { BlockmetricElectron } from '@blockmetric/sdk';

const analytics = new BlockmetricElectron('your-api-key');

// Automatically tracks app lifecycle events
// (start, exit, window focus/blur)

// Track screen views
analytics.trackScreenView('settings-page');

// Track user actions
analytics.trackUserAction('save_preferences', {
  theme: 'dark',
  notifications: true
});
```

## API Reference

### Common Methods

- `trackEvent(eventName: string, properties?: Record<string, any>)`: Track a custom event
- `trackStart()`: Track session start
- `trackExit()`: Track session end

### Web-specific Methods

- `trackPageView(properties?: Record<string, any>)`: Track page views

### Electron-specific Methods

- `trackScreenView(screenName: string, properties?: Record<string, any>)`: Track screen views
- `trackUserAction(action: string, properties?: Record<string, any>)`: Track user actions

## Configuration

```typescript
const options = {
  baseUrl: 'https://your-api-endpoint.com' // Optional: Override default API endpoint
};

const analytics = new BlockmetricWeb('your-api-key', options);
```

## License

MIT