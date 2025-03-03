import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

// Mock data for demonstration
const mockAnalyticsData = {
  uniqueVisitors: 12500,
  visitorChange: '+15%',
  averageSessionDuration: '2m 45s',
  sessionDurationChange: '+5%',
  bounceRate: 45.2,
  bounceRateChange: '-2%',
  pageViews: 35000,
  pageViewsChange: '+12%',
  visitorsByTime: [
    { time: '00:00', visitors: 150 },
    { time: '02:00', visitors: 90 },
    { time: '04:00', visitors: 70 },
    { time: '06:00', visitors: 110 },
    { time: '08:00', visitors: 290 },
    { time: '10:00', visitors: 430 },
    { time: '12:00', visitors: 500 },
    { time: '14:00', visitors: 470 },
    { time: '16:00', visitors: 410 },
    { time: '18:00', visitors: 350 },
    { time: '20:00', visitors: 280 },
    { time: '22:00', visitors: 210 }
  ],
  topPages: [
    { page: '/dashboard', views: 12500, change: '+10%' },
    { page: '/analytics', views: 8900, change: '+15%' },
    { page: '/settings', views: 6700, change: '+5%' },
    { page: '/profile', views: 4500, change: '-2%' }
  ],
  deviceStats: [
    { type: 'Mobile', percentage: 55 },
    { type: 'Desktop', percentage: 35 },
    { type: 'Tablet', percentage: 10 }
  ],
  browserStats: [
    { name: 'Chrome', percentage: 60 },
    { name: 'Safari', percentage: 20 },
    { name: 'Firefox', percentage: 15 },
    { name: 'Others', percentage: 5 }
  ],
  osStats: [
    { name: 'Windows', percentage: 45 },
    { name: 'macOS', percentage: 30 },
    { name: 'iOS', percentage: 15 },
    { name: 'Android', percentage: 10 }
  ],
  userActivity: [
    { time: '14:25', location: 'New York', action: 'Page View', page: '/dashboard' },
    { time: '14:23', location: 'London', action: 'Click', page: '/analytics' },
    { time: '14:20', location: 'Paris', action: 'Sign In', page: '/login' },
    { time: '14:18', location: 'Tokyo', action: 'Page View', page: '/settings' }
  ]
};

const mockPerformanceData = {
  metrics: {
    pageLoad: { time: '1.2s', status: 'Good', average: '1.5s' },
    firstPaint: { time: '0.8s', status: 'Good', average: '1.0s' },
    interactive: { time: '2.1s', status: 'Fair', average: '2.0s' }
  },
  deviceSpeeds: [
    { device: 'Desktop', speed: '1.1s', status: 'good' },
    { device: 'Mobile', speed: '2.3s', status: 'fair' },
    { device: 'Tablet', speed: '1.8s', status: 'good' }
  ],
  resourceLoading: [
    { type: 'HTML', time: '0.3s' },
    { type: 'CSS', time: '0.4s' },
    { type: 'JavaScript', time: '0.9s' },
    { type: 'Images', time: '1.5s' }
  ],
  serverMetrics: [
    { name: 'TTFB', value: '150ms' },
    { name: 'DNS Lookup', value: '40ms' },
    { name: 'TCP Connection', value: '100ms' }
  ],
  webVitals: [
    { name: 'LCP', value: '1.8s' },
    { name: 'FID', value: '65ms' },
    { name: 'CLS', value: '0.08' }
  ],
  optimization: [
    { name: 'Compression', status: 'Enabled' },
    { name: 'Minification', status: 'Enabled' },
    { name: 'Cache Status', status: 'Active' }
  ]
};

// GET /api/analytics/data
router.get('/data', async (req: Request, res: Response) => {
  try {
    // In a real application, you would fetch this data from a database
    // and perform necessary aggregations
    res.json(mockAnalyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// GET /api/analytics/performance
router.get('/performance', async (req: Request, res: Response) => {
  try {
    // In a real application, you would calculate these metrics
    // from actual performance monitoring data
    res.json(mockPerformanceData);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// POST /api/analytics/pageviews
router.post('/pageviews', async (req: Request, res: Response) => {
  try {
    // Here you would store the pageview data in your database
    console.log('Received pageview:', req.body);
    res.status(200).json({ message: 'Pageview recorded successfully' });
  } catch (error) {
    console.error('Error recording pageview:', error);
    res.status(500).json({ error: 'Failed to record pageview' });
  }
});

// POST /api/analytics/events
router.post('/events', async (req: Request, res: Response) => {
  try {
    // Here you would store the event data in your database
    console.log('Received event:', req.body);
    res.status(200).json({ message: 'Event recorded successfully' });
  } catch (error) {
    console.error('Error recording event:', error);
    res.status(500).json({ error: 'Failed to record event' });
  }
});

export default router;