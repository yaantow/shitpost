-- Add images column to tweets table to store image URLs and metadata
-- This column will store JSON data with image information

ALTER TABLE tweets 
ADD COLUMN images JSONB DEFAULT NULL;

-- Add an index on the images column for better query performance
CREATE INDEX idx_tweets_images ON tweets USING GIN (images);

-- Add a comment to document the structure
COMMENT ON COLUMN tweets.images IS 'JSON array of image objects with id, url, altText, and order fields';

