const pool = require('../db/config');
const { parseUserAgent } = require('../utils/deviceParser');

class Pageview {
    static async create(pageviewData) {
        // First, ensure we have a valid user session
        const [sessionResult] = await pool.query(
            'SELECT id FROM user_sessions WHERE session_id = ? AND api_key_id = (SELECT id FROM api_keys WHERE `key` = ?)',
            [pageviewData.sessionId, pageviewData.apiKey]
        );

        let sessionId;
        if (sessionResult.length > 0) {
            sessionId = sessionResult[0].id;
        } else {
            // Create new session if none exists
            const [newSession] = await pool.query(
                'INSERT INTO user_sessions (api_key_id, session_id) SELECT id, ? FROM api_keys WHERE `key` = ?',
                [pageviewData.sessionId, pageviewData.apiKey]
            );
            sessionId = newSession.insertId;
        }

        // Parse user agent and extract device information
        const deviceInfo = parseUserAgent(pageviewData.userAgent);

        // Update or create device info record for every pageview
        await pool.query(
            'INSERT INTO device_info (session_id, device_type, browser, os, screen_resolution) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE device_type = VALUES(device_type), browser = VALUES(browser), os = VALUES(os), screen_resolution = VALUES(screen_resolution)',
            [sessionId, deviceInfo.deviceType, deviceInfo.browser, deviceInfo.os, pageviewData.screenResolution]
        );

        const [result] = await pool.query(
            'INSERT INTO pageviews (page_url, title, referrer, timestamp, session_id, visitorId, user_agent, screen_resolution, language, timezone, connection_type, page_load_time, api_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                pageviewData.url,
                pageviewData.title,
                pageviewData.referrer,
                pageviewData.timestamp,
                sessionId,
                pageviewData.visitorId,
                pageviewData.userAgent,
                pageviewData.screenResolution,
                pageviewData.language,
                pageviewData.timezone,
                pageviewData.connectionType,
                pageviewData.pageLoadTime,
                pageviewData.apiKey
            ]
        );
        return { id: result.insertId, ...pageviewData };
    }

    static async getMetrics(apiKey, startDate, endDate) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as total, COUNT(DISTINCT visitorId) as unique_visitors, COUNT(DISTINCT session_id) as sessions ' +
            'FROM pageviews WHERE api_key = ? AND timestamp BETWEEN ? AND ?',
            [apiKey, startDate, endDate]
        );
        return rows[0];
    }

    static async getHourlyMetrics(apiKey, startDate, endDate) {
        const [rows] = await pool.query(
            'SELECT DATE_FORMAT(timestamp, "%Y-%m-%d %H:00:00") as hour, ' +
            'COUNT(*) as views, COUNT(DISTINCT visitorId) as visitors ' +
            'FROM pageviews ' +
            'WHERE api_key = ? AND timestamp BETWEEN ? AND ? ' +
            'GROUP BY hour ORDER BY hour',
            [apiKey, startDate, endDate]
        );
        return rows;
    }

    static async getDailyMetrics(apiKey, startDate, endDate) {
        const [rows] = await pool.query(
            'SELECT DATE(timestamp) as date, ' +
            'COUNT(*) as views, COUNT(DISTINCT visitorId) as visitors ' +
            'FROM pageviews ' +
            'WHERE api_key = ? AND timestamp BETWEEN ? AND ? ' +
            'GROUP BY date ORDER BY date',
            [apiKey, startDate, endDate]
        );
        return rows;
    }

    static async getTopPages(apiKey, startDate, endDate, limit = 10) {
        const [rows] = await pool.query(
            'SELECT url, title, COUNT(*) as views, COUNT(DISTINCT visitorId) as unique_visitors ' +
            'FROM pageviews ' +
            'WHERE api_key = ? AND timestamp BETWEEN ? AND ? ' +
            'GROUP BY url, title ORDER BY views DESC LIMIT ?',
            [apiKey, startDate, endDate, limit]
        );
        return rows;
    }

    static async getTopReferrers(apiKey, startDate, endDate, limit = 10) {
        const [rows] = await pool.query(
            'SELECT referrer, COUNT(*) as count, COUNT(DISTINCT visitorId) as unique_visitors ' +
            'FROM pageviews ' +
            'WHERE api_key = ? AND timestamp BETWEEN ? AND ? AND referrer IS NOT NULL ' +
            'GROUP BY referrer ORDER BY count DESC LIMIT ?',
            [apiKey, startDate, endDate, limit]
        );
        return rows;
    }
}

module.exports = Pageview;