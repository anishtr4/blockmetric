const express = require('express');
const router = express.Router();
const { validateApiKey } = require('../middleware/auth');
const Event = require('../models/Event');
const Pageview = require('../models/Pageview');

// POST /api/events - Track events
router.post('/events', validateApiKey, async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const origin = req.headers.origin || req.headers.referer || 'unknown';
    const eventData = { ...req.body, apiKey, url: origin };
    console.log('eventData',eventData);
    // Validate event type and required fields
    if (!eventData.eventName) {
      const error = new Error('Event name is required');
      error.code = 'EVENT_TRACKING_ERROR';
      throw error;
    }

    // Validate specific event types
    if (eventData.eventName === 'performance_metric' && !eventData.metricName) {
      const error = new Error('Metric name is required for performance metrics');
      error.code = 'EVENT_TRACKING_ERROR';
      throw error;
    }

    if (eventData.eventName === 'resource_timing' && (!eventData.resourceType || !eventData.resourceUrl)) {
      const error = new Error('Resource type and URL are required for resource timing');
      error.code = 'EVENT_TRACKING_ERROR';
      throw error;
    }

    if (eventData.eventName === 'navigation_timing' && (eventData.dnsTime === undefined || eventData.tcpTime === undefined || eventData.ttfb === undefined)) {
      const error = new Error('DNS time, TCP time, and TTFB are required for navigation timing');
      error.code = 'EVENT_TRACKING_ERROR';
      throw error;
    }
    
    const event = new Event(eventData);
    await event.save();
    
    res.status(201).json({ message: 'Event tracked successfully' });
  } catch (error) {
    next(error); // Pass error to error handling middleware
  }
});

// POST /api/pageviews - Track page views
router.post('/pageviews', validateApiKey, async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const origin = req.headers.origin || req.headers.referer || 'unknown';
    const pageviewData = { ...req.body, apiKey, url: origin };
    
    const pageview = new Pageview(pageviewData);
    await pageview.save();
    
    res.status(201).json({ message: 'Pageview tracked successfully' });
  } catch (error) {
    console.error('Error tracking pageview:', error);
    res.status(500).json({ error: 'Error tracking pageview' });
  }
});

// GET /api/analytics/data
router.get('/data', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
console.log('apiKey',apiKey);
    // Get pageviews
    const pageviews = await Pageview.find({
      apiKey,
      timestamp: { $gte: thirtyDaysAgo }
    });

    // Calculate metrics for current period
    const uniqueVisitors = new Set(pageviews.map(pv => pv.sessionId)).size;
    const totalPageViews = pageviews.length;

    // Calculate visitor time distribution for the last 24 hours
    const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const recentPageviews = pageviews.filter(pv => new Date(pv.timestamp) >= last24Hours);
    
    const visitorsByTime = Array.from({ length: 12 }, (_, i) => {
      const hour = i * 2;
      const hourStr = hour.toString().padStart(2, '0') + ':00';
      const visitors = recentPageviews.filter(pv => {
        const pvHour = new Date(pv.timestamp).getHours();
        return pvHour >= hour && pvHour < (hour + 2);
      }).length;
      return { time: hourStr, visitors };
    });

    // Calculate top pages with real change percentage
    const pageStats = {};
    pageviews.forEach(pv => {
      if (!pageStats[pv.url]) {
        pageStats[pv.url] = { views: 0, previousViews: 0 };
      }
      const viewDate = new Date(pv.timestamp);
      if (viewDate >= new Date(now.setDate(now.getDate() - 15))) {
        pageStats[pv.url].views++;
      } else {
        pageStats[pv.url].previousViews++;
      }
    });

    const topPages = Object.entries(pageStats)
      .map(([page, stats]) => {
        const change = stats.previousViews > 0
          ? (((stats.views - stats.previousViews) / stats.previousViews) * 100).toFixed(1) + '%'
          : '+100%';
        return {
          page,
          views: stats.views + stats.previousViews,
          change: change.startsWith('-') ? change : '+' + change
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 4);

    // Calculate device stats from user agent
    const deviceCounts = {};
    let totalDevices = 0;
    pageviews.forEach(pv => {
      const userAgent = pv.userAgent || '';
      let deviceType = 'Unknown';
      if (userAgent.match(/Mobile|Android|iPhone|iPad|iPod/i)) {
        deviceType = userAgent.match(/iPad/i) ? 'Tablet' : 'Mobile';
      } else if (userAgent.match(/Windows|Macintosh|Linux/i)) {
        deviceType = 'Desktop';
      }
      deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
      totalDevices++;
    });

    const deviceStats = Object.entries(deviceCounts).map(([type, count]) => ({
      type,
      percentage: Math.round((count / totalDevices) * 100)
    })).sort((a, b) => b.percentage - a.percentage);

    // Calculate browser stats
    const browserCounts = {};
    let totalBrowsers = 0;
    pageviews.forEach(pv => {
      const userAgent = pv.userAgent || '';
      let browser = 'Others';
      if (userAgent.match(/Chrome/i)) browser = 'Chrome';
      else if (userAgent.match(/Firefox/i)) browser = 'Firefox';
      else if (userAgent.match(/Safari/i)) browser = 'Safari';
      else if (userAgent.match(/Edge/i)) browser = 'Edge';
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
      totalBrowsers++;
    });

    const browserStats = Object.entries(browserCounts).map(([name, count]) => ({
      name,
      percentage: Math.round((count / totalBrowsers) * 100)
    })).sort((a, b) => b.percentage - a.percentage);

    // Calculate OS stats
    const osCounts = {};
    let totalOS = 0;
    pageviews.forEach(pv => {
      const userAgent = pv.userAgent || '';
      let os = 'Others';
      if (userAgent.match(/Windows/i)) os = 'Windows';
      else if (userAgent.match(/Macintosh/i)) os = 'macOS';
      else if (userAgent.match(/iPhone|iPad|iPod/i)) os = 'iOS';
      else if (userAgent.match(/Android/i)) os = 'Android';
      osCounts[os] = (osCounts[os] || 0) + 1;
      totalOS++;
    });

    const osStats = Object.entries(osCounts).map(([name, count]) => ({
      name,
      percentage: Math.round((count / totalOS) * 100)
    })).sort((a, b) => b.percentage - a.percentage);

    // Calculate session metrics with improved accuracy
    const sessions = {};
    pageviews.forEach(pv => {
      const sessionId = pv.sessionId;
      const timestamp = new Date(pv.timestamp);
      
      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          views: 1,
          startTime: timestamp,
          lastTime: timestamp,
          pages: new Set([pv.url]),
          duration: 0
        };
      } else {
        sessions[sessionId].views++;
        sessions[sessionId].pages.add(pv.url);
        if (timestamp < sessions[sessionId].startTime) {
          sessions[sessionId].startTime = timestamp;
        }
        if (timestamp > sessions[sessionId].lastTime) {
          sessions[sessionId].lastTime = timestamp;
          sessions[sessionId].duration = sessions[sessionId].lastTime - sessions[sessionId].startTime;
        }
      }
    });

    // Calculate session metrics with improved validation
    let totalDuration = 0;
    let validSessions = 0;
    let bouncedSessions = 0;
    let previousPeriodTotalDuration = 0;
    let previousPeriodValidSessions = 0;
    
    Object.values(sessions).forEach(session => {
      // Consider sessions between 1 second and 3 hours as valid
      if (session.duration >= 1000 && session.duration <= 10800000) {
        const sessionDate = new Date(session.startTime);
        if (sessionDate >= thirtyDaysAgo) {
          totalDuration += session.duration;
          validSessions++;
          
          // A bounce is when a session has only one page view
          if (session.pages.size === 1 && session.views === 1) {
            bouncedSessions++;
          }
        } else if (sessionDate >= previousPeriodStart) {
          previousPeriodTotalDuration += session.duration;
          previousPeriodValidSessions++;
        }
      }
    });

    const averageSessionDuration = validSessions > 0
      ? Math.round(totalDuration / validSessions / 1000)
      : 0;

    const previousAverageSessionDuration = previousPeriodValidSessions > 0
      ? Math.round(previousPeriodTotalDuration / previousPeriodValidSessions / 1000)
      : 0;

    const sessionDurationChange = previousAverageSessionDuration > 0
      ? ((averageSessionDuration - previousAverageSessionDuration) / previousAverageSessionDuration * 100).toFixed(1) + '%'
      : '+0%';

    const bounceRate = validSessions > 0
      ? Math.round((bouncedSessions / validSessions) * 100)
      : 0;
    // const bounceRate = Math.round((bounces / Object.keys(sessions).length) * 100);

    // Get recent user activity
    const events = await Event.find({ apiKey })
      .sort({ timestamp: -1 })
      .limit(4);

    const userActivity = events.map(event => ({
      time: new Date(event.timestamp).toLocaleTimeString(),
      location: event.location || 'Unknown',
      action: event.eventName,
      page: event.url
    }));

    // Calculate changes (comparing with previous period)
    const previousPeriodStart = new Date(thirtyDaysAgo);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
    
    const previousPageviews = await Pageview.find({
      apiKey,
      timestamp: { 
        $gte: previousPeriodStart,
        $lt: thirtyDaysAgo
      }
    });

    const previousVisitors = new Set(previousPageviews.map(pv => pv.sessionId)).size;
    const visitorChange = previousVisitors > 0
      ? ((uniqueVisitors - previousVisitors) / previousVisitors * 100).toFixed(1)
      : '100';

    const previousPageViewsCount = previousPageviews.length;
    const pageViewsChange = previousPageViewsCount > 0
      ? ((totalPageViews - previousPageViewsCount) / previousPageViewsCount * 100).toFixed(1)
      : '100';

    // Calculate bounce rate change
    const previousSessions = {};
    previousPageviews.forEach(pv => {
      const sessionId = pv.sessionId;
      if (!previousSessions[sessionId]) {
        previousSessions[sessionId] = { views: 1, pages: new Set([pv.url]) };
      } else {
        previousSessions[sessionId].views++;
        previousSessions[sessionId].pages.add(pv.url);
      }
    });

    const previousBouncedSessions = Object.values(previousSessions)
      .filter(s => s.views === 1 && s.pages.size === 1).length;
    const previousValidSessions = Object.keys(previousSessions).length;
    const previousBounceRate = previousValidSessions > 0
      ? Math.round((previousBouncedSessions / previousValidSessions) * 100)
      : 0;

    const bounceRateChange = previousBounceRate > 0
      ? ((bounceRate - previousBounceRate) / previousBounceRate * 100).toFixed(1)
      : '0';

    res.json({
      uniqueVisitors,
      visitorChange: visitorChange.startsWith('-') ? visitorChange + '%' : '+' + visitorChange + '%',
      averageSessionDuration: `${Math.floor(averageSessionDuration / 60)}m ${averageSessionDuration % 60}s`,
      sessionDurationChange: sessionDurationChange.startsWith('-') ? sessionDurationChange : '+' + sessionDurationChange,
      bounceRate,
      bounceRateChange: bounceRateChange.startsWith('-') ? bounceRateChange + '%' : '+' + bounceRateChange + '%',
      pageViews: totalPageViews,
      pageViewsChange: pageViewsChange.startsWith('-') ? pageViewsChange + '%' : '+' + pageViewsChange + '%',
      visitorsByTime,
      topPages,
      deviceStats,
      browserStats,
      osStats,
      userActivity
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// POST /api/events
router.post('/events', validateApiKey, async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      apiKey: req.headers['x-api-key']
    });
    await event.save();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving event:', error);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

// GET /api/analytics/performance
router.get('/performance', validateApiKey, async (req, res) => {
  try {
    // In a real implementation, these metrics would be calculated from actual monitoring data
    const performanceData = {
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

    res.json(performanceData);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// GET /api/analytics/demographics
router.get('/demographics', validateApiKey, async (req, res) => {
  try {
    // In a real implementation, this data would come from analytics processing
    const demographicsData = {
      ageDistribution: [
        { ageGroup: '18-24', percentage: 25 },
        { ageGroup: '25-34', percentage: 35 },
        { ageGroup: '35-44', percentage: 20 },
        { ageGroup: '45-54', percentage: 12 },
        { ageGroup: '55+', percentage: 8 }
      ],
      geographicDistribution: [
        { country: 'United States', visitors: 45000 },
        { country: 'United Kingdom', visitors: 32000 },
        { country: 'Germany', visitors: 25000 },
        { country: 'France', visitors: 18000 },
        { country: 'Canada', visitors: 15000 }
      ]
    };

    res.json(demographicsData);
  } catch (error) {
    console.error('Error fetching demographics data:', error);
    res.status(500).json({ error: 'Failed to fetch demographics data' });
  }
});

module.exports = router;