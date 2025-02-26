const pool = require('../db/config');
const { v4: uuidv4 } = require('uuid');

class ApiKey {
    static async create({ name, userId }) {
        const key = uuidv4();
        const [result] = await pool.query(
            'INSERT INTO api_keys (`key`, name, user_id) VALUES (?, ?, ?)',
            [key, name, userId]
        );
        return { id: result.insertId, key, name, userId };
    }

    static async findByKey(key) {
        const [rows] = await pool.query(
            'SELECT ak.*, GROUP_CONCAT(ao.origin) as allowed_origins FROM api_keys ak ' +
            'LEFT JOIN allowed_origins ao ON ak.id = ao.api_key_id ' +
            'WHERE ak.key = ? GROUP BY ak.id',
            [key]
        );
        if (rows[0]) {
            rows[0].allowedOrigins = rows[0].allowed_origins ? rows[0].allowed_origins.split(',') : [];
            delete rows[0].allowed_origins;
        }
        return rows[0];
    }

    static async findByUserId(userId) {
        const [rows] = await pool.query(
            'SELECT ak.*, GROUP_CONCAT(ao.origin) as allowed_origins FROM api_keys ak ' +
            'LEFT JOIN allowed_origins ao ON ak.id = ao.api_key_id ' +
            'WHERE ak.user_id = ? GROUP BY ak.id',
            [userId]
        );
        return rows.map(row => ({
            ...row,
            allowedOrigins: row.allowed_origins ? row.allowed_origins.split(',') : [],
            userId: row.user_id
        }));
    }

    static async updateAllowedOrigins(apiKeyId, origins) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Delete existing origins
            await connection.query('DELETE FROM allowed_origins WHERE api_key_id = ?', [apiKeyId]);

            // Insert new origins
            if (origins && origins.length > 0) {
                const values = origins.map(origin => [apiKeyId, origin]);
                await connection.query(
                    'INSERT INTO allowed_origins (api_key_id, origin) VALUES ?',
                    [values]
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async delete(id) {
        await pool.query('DELETE FROM api_keys WHERE id = ?', [id]);
    }
}

module.exports = ApiKey;