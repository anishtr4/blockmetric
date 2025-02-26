const pool = require('../db/config');

class Event {
    static async create(eventData) {
        // First, ensure we have a valid user session
        const [sessionResult] = await pool.query(
            'SELECT id FROM user_sessions WHERE session_id = ? AND api_key_id = (SELECT id FROM api_keys WHERE `key` = ?)',
            [eventData.sessionId, eventData.apiKey]
        );

        let sessionId;
        if (sessionResult.length > 0) {
            sessionId = sessionResult[0].id;
        } else {
            // Create new session if none exists
            const [newSession] = await pool.query(
                'INSERT INTO user_sessions (api_key_id, session_id) SELECT id, ? FROM api_keys WHERE `key` = ?',
                [eventData.sessionId, eventData.apiKey]
            );
            sessionId = newSession.insertId;
        }

        // Insert the event data
        const [result] = await pool.query(
            'INSERT INTO analytics_events (event_type, page_url, timestamp, session_id, user_agent, ip_address, ' +
            'referrer, resource_type, resource_url, resource_size, resource_timing, visitor_id, api_key_id) ' +
            'SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, id FROM api_keys WHERE `key` = ?',
            [
                eventData.eventName,
                eventData.url,
                eventData.timestamp ? new Date(eventData.timestamp).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' '),
                eventData.sessionId,
                eventData.userAgent || null,
                eventData.ipAddress || null,
                eventData.referrer || null,
                eventData.resourceType || null,
                eventData.resourceUrl || null,
                eventData.resourceSize || null,
                eventData.resourceTiming ? JSON.stringify(eventData.resourceTiming) : null,
                eventData.visitorId || null,
                eventData.apiKey
            ]
        );

        return { id: result.insertId, ...eventData };
    }

    static async getMetrics(apiKey, startDate, endDate) {
        const [rows] = await pool.query(
            'SELECT event_type, COUNT(*) as count ' +
            'FROM analytics_events ae ' +
            'JOIN api_keys ak ON ae.api_key_id = ak.id ' +
            'WHERE ak.`key` = ? AND ae.timestamp BETWEEN ? AND ? ' +
            'GROUP BY event_type',
            [apiKey, startDate, endDate]
        );
        return rows;
    }

    static async getPerformanceMetrics(apiKey, startDate, endDate) {
        const [rows] = await pool.query(
            'SELECT event_type, AVG(CAST(JSON_EXTRACT(resource_timing, "$.duration") AS DECIMAL)) as average_value ' +
            'FROM analytics_events ae ' +
            'JOIN api_keys ak ON ae.api_key_id = ak.id ' +
            'WHERE ak.`key` = ? AND ae.timestamp BETWEEN ? AND ? ' +
            'AND event_type = "performance_metric" ' +
            'GROUP BY event_type',
            [apiKey, startDate, endDate]
        );
        return rows;
    }

    static async getResourceTimings(apiKey, startDate, endDate) {
        const [rows] = await pool.query(
            'SELECT resource_type, AVG(CAST(JSON_EXTRACT(resource_timing, "$.duration") AS DECIMAL)) as average_duration ' +
            'FROM analytics_events ae ' +
            'JOIN api_keys ak ON ae.api_key_id = ak.id ' +
            'WHERE ak.`key` = ? AND ae.timestamp BETWEEN ? AND ? ' +
            'AND resource_type IS NOT NULL ' +
            'GROUP BY resource_type',
            [apiKey, startDate, endDate]
        );
        return rows;
    }
}

module.exports = Event;