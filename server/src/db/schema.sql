-- Create database if not exists
CREATE DATABASE IF NOT EXISTS blockmetric;
USE blockmetric;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE,
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_api_key (api_key)
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    `key` VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_key (`key`),
    INDEX idx_user_id (user_id)
);

-- Allowed Origins table
CREATE TABLE IF NOT EXISTS allowed_origins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    api_key_id INT NOT NULL,
    origin VARCHAR(255) NOT NULL,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);

-- Analytics Events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    api_key_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    page_url VARCHAR(255) NOT NULL,
    user_agent VARCHAR(255),
    ip_address VARCHAR(45),
    referrer VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resource_type VARCHAR(50),
    resource_url VARCHAR(2048),
    resource_size BIGINT,
    resource_timing JSON,
    visitor_id VARCHAR(255),
    session_id VARCHAR(255),
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
    INDEX idx_api_key_timestamp (api_key_id, timestamp),
    INDEX idx_resource_type (resource_type),
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_session_id (session_id)
);

-- User Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    api_key_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    duration INT,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id)
);

-- Page Views table
CREATE TABLE IF NOT EXISTS pageviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    api_key VARCHAR(255) NOT NULL,
    visitorId VARCHAR(255) NOT NULL,
    page_url VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    referrer VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id INT NOT NULL,
    user_agent VARCHAR(255),
    screen_resolution VARCHAR(50),
    language VARCHAR(50),
    timezone VARCHAR(100),
    connection_type VARCHAR(50),
    page_load_time BIGINT,
    INDEX idx_api_key_timestamp (api_key, timestamp),
    INDEX idx_visitor_id (visitorId),
    INDEX idx_session_id (session_id),
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE
);

-- Device Info table
CREATE TABLE IF NOT EXISTS device_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    device_type VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    screen_resolution VARCHAR(20),
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE
);