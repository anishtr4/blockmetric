-- Add timestamp columns to pageviews table
ALTER TABLE pageviews
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
MODIFY COLUMN session_id VARCHAR(36) NOT NULL,
DROP FOREIGN KEY pageviews_ibfk_1;

-- Create indexes for better query performance
CREATE INDEX idx_session_id ON pageviews(session_id);