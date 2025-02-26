const express = require('express');
const router = express.Router();
const pool = require('../db/config');

// GET /api/analytics/dashboard-metrics - Get dashboard metrics
router.get('/dashboard-metrics', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    const previousThirtyDays = new Date(Date.now() - (60 * 24 * 60 * 60 * 1000));

    // Get current period metrics
    const [currentMetrics] = await pool.query(
      `WITH session_durations AS (
        SELECT 
          session_id,
          TIMESTAMPDIFF(SECOND, MIN(timestamp), MAX(timestamp)) as duration
        FROM pageviews
        WHERE api_key = ? AND timestamp >= ?
        GROUP BY session_id
       ),
       bounce_metrics AS (
        SELECT
          COUNT(DISTINCT session_id) as total_sessions,
          SUM(CASE WHEN pageviews = 1 THEN 1 ELSE 0 END) as bounce_sessions
        FROM (
          SELECT session_id, COUNT(*) as pageviews
          FROM pageviews
          WHERE api_key = ? AND timestamp >= ?
          GROUP BY session_id
        ) session_counts
       )
       SELECT 
        COUNT(DISTINCT p.visitorId) as uniqueVisitors,
        COUNT(*) as totalPageViews,
        AVG(sd.duration) as avgSessionDuration,
        (bm.bounce_sessions * 100.0 / NULLIF(bm.total_sessions, 0)) as bounceRate
       FROM pageviews p
       LEFT JOIN session_durations sd ON TRUE
       CROSS JOIN bounce_metrics bm
       WHERE p.api_key = ? AND p.timestamp >= ?
       GROUP BY bm.bounce_sessions, bm.total_sessions`,
      [apiKey, thirtyDaysAgo, apiKey, thirtyDaysAgo, apiKey, thirtyDaysAgo]
    );

    // Get previous period metrics
    const [previousMetrics] = await pool.query(
      `WITH session_durations AS (
        SELECT 
          session_id,
          TIMESTAMPDIFF(SECOND, MIN(timestamp), MAX(timestamp)) as duration
        FROM pageviews
        WHERE api_key = ? AND timestamp >= ? AND timestamp < ?
        GROUP BY session_id
       ),
       bounce_metrics AS (
        SELECT
          COUNT(DISTINCT session_id) as total_sessions,
          SUM(CASE WHEN pageviews = 1 THEN 1 ELSE 0 END) as bounce_sessions
        FROM (
          SELECT session_id, COUNT(*) as pageviews
          FROM pageviews
          WHERE api_key = ? AND timestamp >= ? AND timestamp < ?
          GROUP BY session_id
        ) session_counts
       )
       SELECT 
        COUNT(DISTINCT p.visitorId) as uniqueVisitors,
        COUNT(*) as totalPageViews,
        AVG(sd.duration) as avgSessionDuration,
        (bm.bounce_sessions * 100.0 / NULLIF(bm.total_sessions, 0)) as bounceRate
       FROM pageviews p
       LEFT JOIN session_durations sd ON TRUE
       CROSS JOIN bounce_metrics bm
       WHERE p.api_key = ? AND p.timestamp >= ? AND p.timestamp < ?
       GROUP BY bm.bounce_sessions, bm.total_sessions`,
      [apiKey, previousThirtyDays, thirtyDaysAgo, apiKey, previousThirtyDays, thirtyDaysAgo, apiKey, previousThirtyDays, thirtyDaysAgo]
    );

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (!previous) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    // Format session duration
    const formatDuration = (seconds) => {
      if (!seconds) return '0s';
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
    };

    // Get top pages
    const [topPages] = await pool.query(
      `SELECT 
        page_url as page,
        COUNT(*) as views,
        AVG(
          CASE 
            WHEN TIMESTAMPDIFF(SECOND, timestamp, 
              (SELECT MIN(p2.timestamp)
               FROM pageviews p2
               WHERE p2.session_id = pageviews.session_id
               AND p2.timestamp > pageviews.timestamp)
            ) > 0
            THEN TIMESTAMPDIFF(SECOND, timestamp,
              (SELECT MIN(p2.timestamp)
               FROM pageviews p2
               WHERE p2.session_id = pageviews.session_id
               AND p2.timestamp > pageviews.timestamp)
            )
            ELSE 30 -- Default value for last page in session
          END
        ) as avgTime
      FROM pageviews
      WHERE api_key = ? AND timestamp >= ?
      GROUP BY page_url
      ORDER BY views DESC
      LIMIT 10`,
      [apiKey, thirtyDaysAgo]
    );

    // Get device statistics using device_info table
    const [deviceStats] = await pool.query(
      `SELECT 
        device_type as name,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM device_info di
      JOIN user_sessions us ON di.session_id = us.id
      JOIN api_keys ak ON us.api_key_id = ak.id
      WHERE ak.key = ? AND us.start_time >= ?
      GROUP BY device_type
      ORDER BY percentage DESC`,
      [apiKey, thirtyDaysAgo]
    );

    // Get browser statistics using device_info table
    const [browserStats] = await pool.query(
      `SELECT 
        browser as name,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM device_info di
      JOIN user_sessions us ON di.session_id = us.id
      JOIN api_keys ak ON us.api_key_id = ak.id
      WHERE ak.key = ? AND us.start_time >= ?
      GROUP BY browser
      ORDER BY percentage DESC`,
      [apiKey, thirtyDaysAgo]
    );

    // Get OS statistics using device_info table
    const [osStats] = await pool.query(
      `SELECT 
        os as name,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM device_info di
      JOIN user_sessions us ON di.session_id = us.id
      JOIN api_keys ak ON us.api_key_id = ak.id
      WHERE ak.key = ? AND us.start_time >= ?
      GROUP BY os
      ORDER BY percentage DESC`,
      [apiKey, thirtyDaysAgo]
    );

    // Get recent user activity combining pageviews and analytics events with enhanced details
    const [userActivity] = await pool.query(
      `WITH combined_activity AS (
        SELECT 
          timestamp,
          'Page View' as action,
          page_url as page,
          title,
          visitorId,
          user_agent,
          'pageview' as source
        FROM pageviews
        WHERE api_key = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION ALL
        SELECT 
          ae.timestamp,
          ae.event_type as action,
          ae.page_url as page,
          NULL as title,
          ae.visitor_id as visitorId,
          ae.user_agent,
          'event' as source
        FROM analytics_events ae
        JOIN api_keys ak ON ae.api_key_id = ak.id
        WHERE ak.key = ? AND ae.timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      )
      SELECT
        DATE_FORMAT(timestamp, '%b %d, %Y %h:%i %p') as formatted_time,
        action,
        page,
        COALESCE(NULLIF(SUBSTRING_INDEX(SUBSTRING_INDEX(page, '/', 3), '/', -1), ''), 'Unknown') as location,
        source
      FROM combined_activity
      ORDER BY timestamp DESC
      LIMIT 30`,
      [apiKey, apiKey]
    );

    // Handle empty metrics data with fallback values
    const current = currentMetrics[0] || {
      uniqueVisitors: 0,
      totalPageViews: 0,
      avgSessionDuration: 0,
      bounceRate: 0
    };
    const previous = previousMetrics[0] || {
      uniqueVisitors: 0,
      totalPageViews: 0,
      avgSessionDuration: 0,
      bounceRate: 0
    };

    res.json({
      uniqueVisitors: current.uniqueVisitors || 0,
      visitorChange: calculateChange(current.uniqueVisitors, previous.uniqueVisitors),
      averageSessionDuration: formatDuration(current.avgSessionDuration),
      sessionDurationChange: calculateChange(current.avgSessionDuration, previous.avgSessionDuration),
      bounceRate: Number(current.bounceRate || 0),
      bounceRateChange: calculateChange(current.bounceRate, previous.bounceRate),
      totalPageViews: current.totalPageViews || 0,
      pageViewsChange: calculateChange(current.totalPageViews, previous.totalPageViews),
      topPages: topPages.map(page => ({
        ...page,
        avgTime: formatDuration(page.avgTime),
        change: '+0%' // You might want to calculate this based on previous period
      })),
      deviceStats: deviceStats.map(stat => ({
        ...stat,
        percentage: Math.round(stat.percentage)
      })),
      browserStats: browserStats.map(stat => ({
        ...stat,
        percentage: Math.round(stat.percentage)
      })),
      osStats: osStats.map(stat => ({
        ...stat,
        percentage: Math.round(stat.percentage)
      })),
      userActivity: userActivity.map(activity => ({
        ...activity,
        location: 'Unknown' // You might want to add location tracking
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Error fetching dashboard metrics' });
  }
});

module.exports = router;