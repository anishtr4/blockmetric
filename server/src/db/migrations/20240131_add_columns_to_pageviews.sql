-- Add missing columns to pageviews table
ALTER TABLE pageviews

ADD COLUMN last_visit VARCHAR(45);




-- Create index for better query performance
CREATE INDEX idx_visitor_id ON pageviews(last_visit);