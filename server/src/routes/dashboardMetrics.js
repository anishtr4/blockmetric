const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../db/sequelize');
const Pageview = require('../models/Pageview');

// GET /api/analytics/dashboard-metrics - Get dashboard metrics
const { validateApiKey } = require('../middleware/auth');

router.get('/dashboard-metrics', validateApiKey, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    const previousThirtyDays = new Date(Date.now() - (60 * 24 * 60 * 60 * 1000));

    // Get current period metrics using Sequelize
    const currentMetrics = await Pageview.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('visitorId'))), 'uniqueVisitors'],
        [sequelize.fn('COUNT', sequelize.col('*')), 'totalPageViews'],
        [sequelize.literal(`
          CAST(
            (SELECT COUNT(DISTINCT s.session_id) 
            FROM pageviews s 
            WHERE s.api_key = '${req.apiKeyData.key}' 
            AND s.timestamp >= '${thirtyDaysAgo.toISOString()}' 
            AND s.session_id IN (
              SELECT session_id 
              FROM pageviews 
              WHERE api_key = '${req.apiKeyData.key}' 
              GROUP BY session_id 
              HAVING COUNT(*) = 1
            )
          ) * 100.0 / NULLIF(COUNT(DISTINCT session_id), 0) AS DECIMAL(10,2))
        `), 'bounceRate'],
        [sequelize.literal(`
          CAST(
            AVG(
              TIMESTAMPDIFF(SECOND,
                (SELECT MIN(timestamp) FROM pageviews p2 WHERE p2.session_id = Pageview.session_id),
                (SELECT MAX(timestamp) FROM pageviews p3 WHERE p3.session_id = Pageview.session_id)
              )
            ) AS UNSIGNED
          )
        `), 'avgSessionDuration']
      ],
      where: {
        api_key: req.apiKeyData.key,
        timestamp: { [Op.gte]: thirtyDaysAgo }
      }
    });

    // Get previous period metrics
    const previousMetrics = await Pageview.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('visitorId'))), 'uniqueVisitors'],
        [sequelize.fn('COUNT', sequelize.col('*')), 'totalPageViews']
      ],
      where: {
        api_key: req.apiKeyData.key,
        timestamp: {
          [Op.gte]: previousThirtyDays,
          [Op.lt]: thirtyDaysAgo
        }
      }
    });

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (!previous) return 0;
      return ((current - previous) / previous) * 100;
    };

    // Get top pages metrics
    const topPages = await Pageview.findAll({
      attributes: [
        'page_url',
        [sequelize.fn('COUNT', sequelize.col('*')), 'views'],
        [sequelize.fn('AVG', 
          sequelize.fn('TIMESTAMPDIFF', 
            sequelize.literal('SECOND'), 
            sequelize.col('timestamp'),
            sequelize.literal('(SELECT timestamp FROM pageviews p2 WHERE p2.session_id = Pageview.session_id AND p2.timestamp > Pageview.timestamp ORDER BY timestamp ASC LIMIT 1)')
          )
        ), 'avgTimeOnPage']
      ],
      where: {
        api_key: req.apiKeyData.key,
        timestamp: { [Op.gte]: thirtyDaysAgo }
      },
      group: ['page_url'],
      order: [[sequelize.fn('COUNT', sequelize.col('*')), 'DESC']],
      limit: 10
    });

    // Get recent user activity
    const recentActivity = await Pageview.findAll({
      attributes: [
        'timestamp',
        'page_url',
        ['visitorId', 'visitorId'],
        'title',
        'referrer',
        'screen_resolution',
        'language',
        'timezone',
        'connection_type',
        'page_load_time'
      ],
      where: {
        api_key: req.apiKeyData.key,
        timestamp: { [Op.gte]: thirtyDaysAgo }
      },
      order: [['timestamp', 'DESC']],
      limit: 20
    });

    // Get device analytics
    const deviceAnalytics = await sequelize.query(`
      SELECT 
        device_type,
        browser,
        os,
        COUNT(*) as count
      FROM device_info di
      JOIN user_sessions us ON di.session_id = us.id
      JOIN api_keys ak ON us.api_key_id = ak.id
      JOIN pageviews pv ON pv.session_id = us.id
      WHERE ak.key = :apiKey
      AND pv.timestamp >= :thirtyDaysAgo
      GROUP BY device_type, browser, os
    `, {
      replacements: { 
        apiKey: req.apiKeyData.key,
        thirtyDaysAgo: thirtyDaysAgo.toISOString()
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Process device analytics
    const deviceDistribution = {};
    const browserUsage = {};
    const operatingSystems = {};

    deviceAnalytics.forEach(record => {
      if (record.device_type) {
        deviceDistribution[record.device_type] = (deviceDistribution[record.device_type] || 0) + record.count;
      }
      if (record.browser) {
        browserUsage[record.browser] = (browserUsage[record.browser] || 0) + record.count;
      }
      if (record.os) {
        operatingSystems[record.os] = (operatingSystems[record.os] || 0) + record.count;
      }
    });

    const metrics = {
      currentPeriod: {
        uniqueVisitors: parseInt(currentMetrics.get('uniqueVisitors') || 0),
        totalPageViews: parseInt(currentMetrics.get('totalPageViews') || 0),
        bounceRate: parseFloat(currentMetrics.get('bounceRate') || 0).toFixed(2),
        avgSessionDuration: parseInt(currentMetrics.get('avgSessionDuration') || 0)
      },
      previousPeriod: {
        uniqueVisitors: parseInt(previousMetrics.get('uniqueVisitors') || 0),
        totalPageViews: parseInt(previousMetrics.get('totalPageViews') || 0),
        bounceRate: 0, // Default to 0 for previous period if not available
        avgSessionDuration: 0 // Default to 0 for previous period if not available
      },
      changes: {
        uniqueVisitors: calculateChange(
          parseInt(currentMetrics.get('uniqueVisitors') || 0),
          parseInt(previousMetrics.get('uniqueVisitors') || 0)
        ).toFixed(1),
        totalPageViews: calculateChange(
          parseInt(currentMetrics.get('totalPageViews') || 0),
          parseInt(previousMetrics.get('totalPageViews') || 0)
        ).toFixed(1),
        bounceRate: calculateChange(
          parseFloat(currentMetrics.get('bounceRate') || 0),
          0
        ).toFixed(1),
        avgSessionDuration: calculateChange(
          parseInt(currentMetrics.get('avgSessionDuration') || 0),
          0
        ).toFixed(1)
      },
      deviceAnalytics: {
        deviceDistribution: Object.entries(deviceDistribution).map(([type, count]) => ({
          type,
          count,
          percentage: ((count / Object.values(deviceDistribution).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
        })),
        browserUsage: Object.entries(browserUsage).map(([browser, count]) => ({
          browser,
          count,
          percentage: ((count / Object.values(browserUsage).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
        })),
        operatingSystems: Object.entries(operatingSystems).map(([os, count]) => ({
          os,
          count,
          percentage: ((count / Object.values(operatingSystems).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
        }))
      },
      topPages: topPages.map(page => ({
        url: page.get('page_url'),
        views: parseInt(page.get('views')),
        avgTimeOnPage: Math.round(parseFloat(page.get('avgTimeOnPage') || 0))
      })),
      recentActivity: recentActivity.map(activity => ({
        timestamp: activity.get('timestamp'),
        page: activity.get('page_url'),
        visitorId: activity.get('visitorId'),
        title: activity.get('title'),
        referrer: activity.get('referrer'),
        screenResolution: activity.get('screen_resolution'),
        language: activity.get('language'),
        timezone: activity.get('timezone'),
        connectionType: activity.get('connection_type'),
        pageLoadTime: activity.get('page_load_time')
      }))
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Error fetching dashboard metrics' });
  }
});

module.exports = router;