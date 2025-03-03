const express = require('express');
const router = express.Router();
const { validateApiKey } = require('../middleware/auth');
const Event = require('../models/EventMySQL');
const Pageview = require('../models/PageviewMySQL');
const pool = require('../db/config');

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

    await Event.create(eventData);
    
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

    await Pageview.create(pageviewData);
    
    res.status(201).json({ message: 'Pageview tracked successfully' });
  } catch (error) {
    console.error('Error tracking pageview:', error);
    res.status(500).json({ error: 'Error tracking pageview' });
  }
});

// GET /api/analytics/user-metrics - Get user metrics (MAU, DAU, HAU)
router.get('/user-metrics', async (req, res) => {
  // Origin validation is handled by validateApiKey middleware
  try {
    const apiKey = req.headers['x-api-key'];
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

    // Query for current period metrics
    const [mauResult, dauResult, hauResult] = await Promise.all([
      // Monthly Active Users
      pool.query(
        'SELECT COUNT(DISTINCT visitorId) as total FROM pageviews WHERE api_key = ? AND timestamp >= ?',
        [apiKey, monthStart]
      ),
      // Daily Active Users
      pool.query(
        'SELECT COUNT(DISTINCT visitorId) as total FROM pageviews WHERE api_key = ? AND timestamp >= ?',
        [apiKey, dayStart]
      ),
      // Hourly Active Users - Count unique visitors in the last hour
      pool.query(
        'SELECT COUNT(DISTINCT visitorId) as total FROM pageviews WHERE api_key = ? AND timestamp >= ? AND timestamp <= NOW()',
        [apiKey, hourStart]
      )
    ]);

    const mau = mauResult[0][0];
    const dau = dauResult[0][0];
    const hau = hauResult[0][0];

    // Query for previous period metrics
    const [prevMauResult, prevDauResult, prevHauResult] = await Promise.all([
      pool.query(
        'SELECT COUNT(DISTINCT visitorId) as total FROM pageviews WHERE api_key = ? AND timestamp >= ? AND timestamp < ?',
        [apiKey, prevMonthStart, monthStart]
      ),
      pool.query(
        'SELECT COUNT(DISTINCT visitorId) as total FROM pageviews WHERE api_key = ? AND timestamp >= ? AND timestamp < ?',
        [apiKey, prevDayStart, dayStart]
      ),
      pool.query(
        'SELECT COUNT(DISTINCT visitorId) as total FROM pageviews WHERE api_key = ? AND timestamp >= ? AND timestamp < ? AND timestamp <= ?',
        [apiKey, prevHourStart, hourStart, new Date(hourStart)]
      )
    ]);

    const prevMau = prevMauResult[0][0];
    const prevDau = prevDauResult[0][0];
    const prevHau = prevHauResult[0][0];

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (!current || !previous) return '0%';
      if (previous.total === 0) return current.total > 0 ? '+100%' : '0%';
      const change = ((current.total - previous.total) / previous.total) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    res.json({
      mau: mau?.total || 0,
      dau: dau?.total || 0,
      hau: hau?.total || 0,
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

    // Query pageviews using MySQL
    const [pageviews] = await pool.query(
      `SELECT 
        DATE_FORMAT(timestamp, ?) as time,
        COUNT(*) as visitors,
        COUNT(DISTINCT visitorId) as uniqueVisitors
      FROM pageviews
      WHERE api_key = ? AND timestamp >= ?
      GROUP BY time
      ORDER BY time ASC`,
      [groupingFormat, apiKey, startDate]
    );

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

    // Get pageviews within the time range
    const [pageviews] = await pool.query(
      'SELECT timestamp, visitorId FROM pageviews WHERE api_key = ? AND timestamp >= ? ORDER BY timestamp ASC',
      [apiKey, startTime]
    );

    // Group pageviews by interval
    const timeSlots = [];
    for (let i = 0; i < limit; i++) {
      const slotStart = new Date(startTime.getTime() + (i * intervalMs));
      const slotEnd = new Date(slotStart.getTime() + intervalMs);
      
      const slotPageviews = pageviews.filter(pv => {
        const pvTime = new Date(pv.timestamp);
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
      const [realtimePageviews] = await pool.query(
        'SELECT visitorId, timestamp FROM pageviews WHERE api_key = ? AND timestamp >= ?',
        [apiKey, realtimeWindow]
      );

      const realtimeData = {
        currentVisitors: new Set(realtimePageviews.map(pv => pv.visitorId)).size,
        pageviewsLastMinute: realtimePageviews.filter(pv => 
          new Date(pv.timestamp) >= new Date(now.getTime() - 60000)
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
router.get('/demographics', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));

    const [pageviews] = await pool.query(
      'SELECT timezone FROM pageviews WHERE api_key = ? AND timestamp >= ?',
      [apiKey, thirtyDaysAgo]
    );

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