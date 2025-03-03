const pool = require('../db/config');
const bcrypt = require('bcryptjs');

class User {
    static async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByApiKey(apiKey) {
        const [rows] = await pool.query('SELECT * FROM users WHERE api_key = ?', [apiKey]);
        return rows[0];
    }

    static async create({ name, email, password }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );
        return { id: result.insertId, name, email };
    }

    static async updateResetToken(email, resetToken, expiry) {
        await pool.query(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
            [resetToken, expiry, email]
        );
    }

    static async findByResetToken(token) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
            [token]
        );
        return rows[0];
    }

    static async updatePassword(userId, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
            [hashedPassword, userId]
        );
    }

    static async setApiKey(userId, apiKey) {
        await pool.query('UPDATE users SET api_key = ? WHERE id = ?', [apiKey, userId]);
    }
}

module.exports = User;