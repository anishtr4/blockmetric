const express = require('express');
const router = express.Router();
const { validateApiKey } = require('../middleware/auth');
const Event = require('../models/Event');
const Pageview = require('../models/Pageview');

// Helper function to anonymize IP address
const anonymizeIp = (ip) => {
  if (!ip) return null;
  // For IPv4, remove last octet
  // For IPv6, remove last 64 bits
  return ip.includes(':') 
    ? ip.replace(/:[^:]*$/, ':0000')
    : ip.replace(/\.\d+$/, '.0');
};

// POST /api/events - Track events
router.post('/events', validateApiKey, async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const origin = req.headers.origin || req.headers.referer || 'unknown';
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const eventData = { 
      ...req.body, 
      apiKey, 
      url: origin,
      ipAddress: anonymizeIp(clientIp)
    };

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

    const event = new Event(eventData);
    await event.save();
    
    res.status(201).json({ message: 'Event tracked successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/pageviews - Track page views
router.post('/pageviews', validateApiKey, async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const origin = req.headers.origin || req.headers.referer || 'unknown';
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    const pageviewData = { 
      ...req.body, 
      apiKey, 
      url: origin,
      ipAddress: anonymizeIp(clientIp),
      timestamp: new Date() // Ensure timestamp is set
    };

    console.log('pageviewData',pageviewData)
    // Validate required fields
    if (!pageviewData.visitorId || !pageviewData.pageViewId) {
      throw new Error('Visitor ID and Page View ID are required');
    }

    const pageview = new Pageview(pageviewData);
    await pageview.save();
    
    res.status(201).json({ message: 'Pageview tracked successfully' });
  } catch (error) {
    console.error('Error tracking pageview:', error);
    res.status(500).json({ error: 'Error tracking pageview' });
  }
});

// GET /api/analytics/visitor-trends - Get visitor trends by time range
router.get('/visitor-trends', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const timeRange = req.query.timeRange || 'daily';
    const now = new Date();
    let startDate;
    let groupingFormat;

    // Set time range and data grouping format
    switch (timeRange) {
      case 'yearly':
        startDate = new Date(2020, 0, 1); // Start from 2020 or your preferred start year
        groupingFormat = '%Y';
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), 0, 1); // Start of current year
        groupingFormat = '%Y-%m';
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), 0, 1); // Start of current year
        groupingFormat = '%Y-%U'; // Week number format
        break;
      default: // daily
        startDate = new Date(now.getFullYear(), 0, 1); // Start of current year
        groupingFormat = '%Y-%m-%d';
    }

    // Aggregate pageviews using MongoDB aggregation pipeline
    const pageviews = await Pageview.aggregate([
      {
        $match: {
          apiKey,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupingFormat,
              date: '$timestamp'
            }
          },
          visitors: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' }
        }
      },
      {
        $project: {
          _id: 0,
          time: '$_id',
          visitors: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' }
        }
      },
      { $sort: { time: 1 } }
    ]);

    // Process the data based on time range
    let processedData = pageviews;

    if (timeRange === 'weekly') {
      // Convert week numbers to date ranges
      processedData = pageviews.map(item => {
        const [year, week] = item.time.split('-');
        const weekStart = new Date(year, 0, 1 + (week * 7));
        return {
          ...item,
          time: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });
    } else if (timeRange === 'monthly') {
      // Convert month numbers to month names
      processedData = pageviews.map(item => {
        const [year, month] = item.time.split('-');
        return {
          ...item,
          time: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' })
        };
      });
    }

    // Fill in missing data points with zeros
    const filledData = fillMissingDataPoints(processedData, timeRange, startDate, now);

    res.json(filledData);
  } catch (error) {
    console.error('Error fetching visitor trends:', error);
    res.status(500).json({ error: 'Error fetching visitor trends' });
  }
});

// Helper function to fill missing data points
const fillMissingDataPoints = (data, timeRange, startDate, endDate) => {
  const filledData = [...data];
  const dateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: timeRange === 'daily' ? 'numeric' : undefined,
    year: timeRange === 'yearly' ? 'numeric' : undefined
  });

  let current = new Date(startDate);
  while (current <= endDate) {
    let timeKey;
    switch (timeRange) {
      case 'yearly':
        timeKey = current.getFullYear().toString();
        current.setFullYear(current.getFullYear() + 1);
        break;
      case 'monthly':
        timeKey = dateFormat.format(current);
        current.setMonth(current.getMonth() + 1);
        break;
      case 'weekly':
        timeKey = dateFormat.format(current);
        current.setDate(current.getDate() + 7);
        break;
      default: // daily
        timeKey = dateFormat.format(current);
        current.setDate(current.getDate() + 1);
    }

    if (!filledData.find(item => item.time === timeKey)) {
      filledData.push({
        time: timeKey,
        visitors: 0,
        uniqueVisitors: 0
      });
    }
  }

  return filledData.sort((a, b) => {
    if (timeRange === 'yearly') {
      return parseInt(a.time) - parseInt(b.time);
    }
    return a.time.localeCompare(b.time);
  });
};

// GET /api/analytics/data
router.get('/data', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Get pageviews with visitor information
    const pageviews = await Pageview.find({
      apiKey,
      timestamp: { $gte: thirtyDaysAgo }
    }).select('-ipAddress').sort({ timestamp: 1 }); // Sort by timestamp ascending

    // Calculate metrics
    const uniqueVisitors = new Set(pageviews.map(pv => pv.visitorId)).size;
    const totalPageViews = pageviews.length;

    // Group pageviews by session
    const sessionMap = new Map();
    pageviews.forEach(pv => {
      if (!sessionMap.has(pv.sessionId)) {
        sessionMap.set(pv.sessionId, []);
      }
      sessionMap.get(pv.sessionId).push(pv);
    });

    // Calculate session metrics
    let totalSessionDuration = 0;
    let bouncedSessions = 0;
    let nonBouncedSessions = 0;
    sessionMap.forEach(sessionPageviews => {
      // Calculate session duration
      if (sessionPageviews.length > 1) {
        const firstView = sessionPageviews[0];
        const lastView = sessionPageviews[sessionPageviews.length - 1];
        const duration = new Date(lastView.timestamp).getTime() - new Date(firstView.timestamp).getTime();
        totalSessionDuration += duration;
        nonBouncedSessions++;
      }

      // Count bounced sessions (single page view)
      if (sessionPageviews.length === 1) {
        bouncedSessions++;
      }
    });

    const uniqueSessions = sessionMap.size;
    const averageSessionDuration = nonBouncedSessions > 0 ? Math.round(totalSessionDuration / nonBouncedSessions / 1000) : 0; // in seconds
    const bounceRate = uniqueSessions > 0 ? Math.round((bouncedSessions / uniqueSessions) * 100) : 0;

    // Get operating system statistics
    const osStats = pageviews.reduce((acc, pv) => {
      const userAgent = pv.userAgent || '';
      let os = 'Unknown';
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('Linux')) os = 'Linux';
      acc[os] = (acc[os] || 0) + 1;
      return acc;
    }, {});

    // Get recent user activity (combining pageviews and events)
    const recentEvents = await Event.find({
      apiKey,
      timestamp: { $gte: thirtyDaysAgo }
    }).select('eventName timestamp url data').sort({ timestamp: -1 }).limit(10);

    const recentActivity = [...pageviews, ...recentEvents]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(item => {
        if (item.eventName) {
          // It's an event
          return {
            time: new Date(item.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            action: item.eventName,
            page: item.url,
            data: item.data
          };
        } else {
          // It's a pageview
          return {
            time: new Date(item.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            action: 'Page View',
            page: item.url,
            visitorId: item.visitorId
          };
        }
      });

    // Calculate visitor time distribution
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

    // Get browser and device statistics
    const browserStats = pageviews.reduce((acc, pv) => {
      const userAgent = pv.userAgent || '';
      let browser = 'Unknown';
      
      // Improved browser detection
      if (userAgent.includes('Chrome') || userAgent.includes('Chromium')) {
        if (userAgent.includes('Brave')) {
          browser = 'Brave';
        } else if (userAgent.includes('Edge')) {
          browser = 'Edge';
        } else if (userAgent.includes('OPR') || userAgent.includes('Opera')) {
          browser = 'Opera';
        } else {
          browser = 'Chrome';
        }
      } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari';
      }
      
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});

    const deviceStats = pageviews.reduce((acc, pv) => {
      const userAgent = pv.userAgent || '';
      let device = 'Unknown';
      if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        device = 'Mobile';
      } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
        device = 'Tablet';
      } else {
        device = 'Desktop';
      }
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    // Format browser and device stats as percentages
    const formatStats = (stats) => {
      const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
      return Object.entries(stats).map(([name, count]) => ({
        name,
        percentage: Math.round((count / total) * 100)
      }));
    };

    // Get top pages
    const pageStats = pageviews.reduce((acc, pv) => {
      acc[pv.url] = (acc[pv.url] || 0) + 1;
      return acc;
    }, {});

    const topPages = Object.entries(pageStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4)
      .map(([page, views]) => ({
        page,
        views,
        change: '+0%' // You would need historical data to calculate real change
      }));

    // Calculate changes (mock data for now)
    const visitorChange = '+0%';
    const sessionDurationChange = '+0%';
    const bounceRateChange = '+0%';
    const pageViewsChange = '+0%';

    // Format average session duration
    const formatDuration = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    };

    res.json({
      uniqueVisitors,
      visitorChange,
      uniqueSessions,
      totalPageViews,
      pageViewsChange,
      averageSessionDuration: formatDuration(averageSessionDuration),
      sessionDurationChange,
      bounceRate,
      bounceRateChange,
      visitorsByTime,
      topPages,
      deviceStats: formatStats(deviceStats),
      browserStats: formatStats(browserStats),
      osStats: formatStats(osStats),
      userActivity: recentActivity
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: 'Error fetching analytics data' });
  }
});

module.exports = router;