-- Add countdown_settings column to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS countdown_settings JSONB DEFAULT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN user_settings.countdown_settings IS 'JSON object storing countdown page settings including display preferences, clock style, auto-detect settings, etc.';
