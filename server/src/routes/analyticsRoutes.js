const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../db/sequelize');
const Event = require('../models/Event');
const Pageview = require('../models/Pageview');
const { validateApiKey } = require('../middleware/auth');

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
    
    // Validate event type and required fields
    if (!req.body.eventName) {
      const error = new Error('Event name is required');
      error.code = 'EVENT_TRACKING_ERROR';
      throw error;
    }

    if (!req.body.sessionId) {
      const error = new Error('Session ID is required');
      error.code = 'EVENT_TRACKING_ERROR';
      throw error;
    }

    // Validate specific event types
    if (req.body.eventName === 'performance_metric' && !req.body.metricName) {
      const error = new Error('Metric name is required for performance metrics');
      error.code = 'EVENT_TRACKING_ERROR';
      throw error;
    }

    // Create event using Sequelize model
    await Event.create({
      eventType: req.body.eventName,
      pageUrl: origin,
      sessionId: req.body.sessionId,
      userAgent: req.headers['user-agent'],
      ipAddress: anonymizeIp(clientIp),
      referrer: req.headers.referer,
      resourceType: req.body.resourceType,
      resourceUrl: req.body.resourceUrl,
      resourceSize: req.body.resourceSize,
      resourceTiming: req.body.resourceTiming,
      visitorId: req.body.visitorId,
      apiKeyId: req.apiKeyData.id // Fix: Use apiKeyData.id instead of apiKeyId
    });
    
    res.status(201).json({ message: 'Event tracked successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/pageviews - Track page views
router.post('/pageviews', validateApiKey, async (req, res) => {
  try {
    const origin = req.headers.origin || req.headers.referer || 'unknown';
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Validate required fields
    if (!req.body.visitorId || !req.body.sessionId) {
      throw new Error('Visitor ID and Session ID are required');
    }

    // Create pageview using Sequelize model
    await Pageview.create({
      page_url: req.body.pageUrl || origin,
      title: req.body.title,
      referrer: req.headers.referer,
      sessionId: req.body.sessionId,
      apiKeyId: req.apiKeyId,
      visitorId: req.body.visitorId,
      userAgent: req.headers['user-agent'],
      screenResolution: req.body.screenResolution,
      language: req.body.language,
      timezone: req.body.timezone,
      connectionType: req.body.connectionType,
      pageLoadTime: req.body.pageLoadTime,
      ipAddress: anonymizeIp(clientIp),
      lastVisit: new Date()
    });
    
    res.status(201).json({ message: 'Pageview tracked successfully' });
  } catch (error) {
    console.error('Error tracking pageview:', error);
    res.status(500).json({ error: 'Error tracking pageview' });
  }
});

// GET /api/analytics/user-metrics - Get user metrics (MAU, DAU, HAU)
router.get('/user-metrics', validateApiKey, async (req, res) => {
  try {
    const now = new Date();

    // Calculate date ranges
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    // Previous period date ranges for comparison
    const prevMonthStart = new Date(monthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const prevDayStart = new Date(dayStart);
    prevDayStart.setDate(prevDayStart.getDate() - 1);
    const prevHourStart = new Date(hourStart);
    prevHourStart.setHours(prevHourStart.getHours() - 1);

    // Query for current period metrics using Sequelize
    const [mau, dau, hau] = await Promise.all([
      // Monthly Active Users
      Pageview.count({
        distinct: true,
        col: 'visitorId',
        where: {
          apiKeyId: req.apiKeyId,
          timestamp: { [Op.gte]: monthStart }
        }
      }),
      // Daily Active Users
      Pageview.count({
        distinct: true,
        col: 'visitorId',
        where: {
          apiKeyId: req.apiKeyId,
          timestamp: { [Op.gte]: dayStart }
        }
      }),
      // Hourly Active Users
      Pageview.count({
        distinct: true,
        col: 'visitorId',
        where: {
          apiKeyId: req.apiKeyId,
          timestamp: { [Op.gte]: hourStart }
        }
      })
    ]);

    // Query for previous period metrics
    const [prevMau, prevDau, prevHau] = await Promise.all([
      Pageview.count({
        distinct: true,
        col: 'visitorId',
        where: {
          apiKeyId: req.apiKeyId,
          timestamp: { [Op.gte]: prevMonthStart, [Op.lt]: monthStart }
        }
      }),
      Pageview.count({
        distinct: true,
        col: 'visitorId',
        where: {
          apiKeyId: req.apiKeyId,
          timestamp: { [Op.gte]: prevDayStart, [Op.lt]: dayStart }
        }
      }),
      Pageview.count({
        distinct: true,
        col: 'visitorId',
        where: {
          apiKeyId: req.apiKeyId,
          timestamp: { [Op.gte]: prevHourStart, [Op.lt]: hourStart }
        }
      })
    ]);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (!current || !previous) return '0%';
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    res.json({
      mau,
      dau,
      hau,
      mauChange: calculateChange(mau, prevMau),
      dauChange: calculateChange(dau, prevDau),
      hauChange: calculateChange(hau, prevHau)
    });
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    res.status(500).json({ error: 'Error fetching user metrics' });
  }
});

// GET /api/analytics/visitor-trends - Get visitor trends by time range
router.get('/visitor-trends', validateApiKey, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'daily';
    const now = new Date();
    let startDate;

    // Set time range
    switch (timeRange) {
      case 'yearly':
        startDate = new Date(2020, 0, 1); // Start from 2020
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), 0, 1); // Start of current year
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), 0, 1); // Start of current year
        break;
      default: // daily
        startDate = new Date(now.getFullYear(), 0, 1); // Start of current year
    }

    // Query pageviews using Sequelize
    const pageviews = await Pageview.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('timestamp')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('*')), 'visitors'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('visitorId'))), 'uniqueVisitors']
      ],
      where: {
        apiKeyId: req.apiKeyId,
        timestamp: { [Op.gte]: startDate }
      },
      group: [sequelize.fn('DATE', sequelize.col('timestamp'))],
      order: [[sequelize.fn('DATE', sequelize.col('timestamp')), 'ASC']]
    });

    // Process the data based on time range
    let processedData = pageviews.map(pv => ({
      time: pv.get('date'),
      visitors: parseInt(pv.get('visitors')),
      uniqueVisitors: parseInt(pv.get('uniqueVisitors'))
    }));

    if (timeRange === 'weekly') {
      processedData = processedData.map(item => ({
        ...item,
        time: new Date(item.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));
    } else if (timeRange === 'monthly') {
      processedData = processedData.map(item => ({
        ...item,
        time: new Date(item.time).toLocaleDateString('en-US', { month: 'short' })
      }));
    }

    // Fill in missing data points
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
router.get('/data', validateApiKey, async (req, res) => {
  try {
    const interval = req.query.interval || '30min';
    const limit = parseInt(req.query.limit) || 336;
    const includeRealtime = req.query.includeRealtime === 'true';

    // Parse interval into milliseconds
    const intervalMs = {
      '5min': 5 * 60 * 1000,
      '15min': 15 * 60 * 1000,
      '30min': 30 * 60 * 1000,
      '1hour': 60 * 60 * 1000,
      '1day': 24 * 60 * 60 * 1000
    }[interval] || (30 * 60 * 1000); // Default to 30min

    const now = new Date();
    const startTime = new Date(now.getTime() - (intervalMs * limit));

    // Get pageviews within the time range using Sequelize
    const pageviews = await Pageview.findAll({
      attributes: ['timestamp', 'visitorId'],
      where: {
        apiKey: req.apiKey,
        timestamp: { [Op.gte]: startTime }
      },
      order: [['createdAt', 'ASC']]
    });

    // Group pageviews by interval
    const timeSlots = [];
    for (let i = 0; i < limit; i++) {
      const slotStart = new Date(startTime.getTime() + (i * intervalMs));
      const slotEnd = new Date(slotStart.getTime() + intervalMs);
      
      const slotPageviews = pageviews.filter(pv => {
        const pvTime = pv.createdAt;
        return pvTime >= slotStart && pvTime < slotEnd;
      });

      timeSlots.push({
        timestamp: slotStart.toISOString(),
        pageviews: slotPageviews.length,
        uniqueVisitors: new Set(slotPageviews.map(pv => pv.visitorId)).size
      });
    }

    // Add realtime data if requested
    if (includeRealtime) {
      const realtimeWindow = new Date(now.getTime() - (5 * 60 * 1000)); // Last 5 minutes
      const realtimePageviews = await Pageview.findAll({
        attributes: ['visitorId', 'timestamp'],
        where: {
          apiKey: req.apiKey,
          timestamp: { [Op.gte]: realtimeWindow }
        }
      });

      const realtimeData = {
        currentVisitors: new Set(realtimePageviews.map(pv => pv.visitorId)).size,
        pageviewsLastMinute: realtimePageviews.filter(pv => 
          pv.timestamp >= new Date(now.getTime() - 60000)
        ).length
      };

      res.json({
        timeSlots,
        realtime: realtimeData
      });
    } else {
      res.json({ timeSlots });
    }

  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: 'Error fetching analytics data' });
  }
});

// Timezone to country mapping
const timezoneCountryMap = {
  'Asia/Calcutta': 'India',
  'Asia/Kolkata': 'India',
  'America/New_York': 'United States',
  'America/Los_Angeles': 'United States',
  'America/Chicago': 'United States',
  'Europe/London': 'United Kingdom',
  'Europe/Paris': 'France',
  'Europe/Berlin': 'Germany',
  'Asia/Tokyo': 'Japan',
  'Asia/Shanghai': 'China',
  'Australia/Sydney': 'Australia',
  'America/Toronto': 'Canada',
  'Asia/Singapore': 'Singapore',
  'Asia/Dubai': 'United Arab Emirates',
  'Europe/Amsterdam': 'Netherlands',
  'Europe/Madrid': 'Spain',
  'Europe/Rome': 'Italy',
  'Asia/Seoul': 'South Korea',
  'Asia/Hong_Kong': 'Hong Kong',
  'Europe/Moscow': 'Russia'
};

// GET /api/analytics/demographics - Get visitor demographics
router.get('/demographics', validateApiKey, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));

    const pageviews = await Pageview.findAll({
      attributes: ['timezone'],
      where: {
        api_key: req.apiKey,
        timestamp: { [Op.gte]: thirtyDaysAgo }
      }
    });

    // Process geographic distribution based on timezones
    const countryStats = pageviews.reduce((acc, pv) => {
      const timezone = pv.timezone || 'Unknown';
      const country = timezoneCountryMap[timezone] || 'Other';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    // Format statistics as percentages and visitor counts
    const formatStats = (stats) => {
      const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
      return Object.entries(stats)
        .map(([name, count]) => ({
          name,
          visitors: count,
          percentage: Math.round((count / total) * 100)
        }))
        .sort((a, b) => b.visitors - a.visitors);
    };

    res.json({
      geographicDistribution: formatStats(countryStats)
    });
  } catch (error) {
    console.error('Error fetching demographics:', error);
    res.status(500).json({ error: 'Error fetching demographics data' });
  }
});

module.exports = router;