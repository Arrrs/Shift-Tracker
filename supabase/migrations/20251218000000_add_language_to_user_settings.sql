-- Add language column to user_settings if it doesn't exist
-- This ensures backward compatibility with existing user_settings records

-- The column already exists in the schema (from database.types.ts line 687)
-- This migration just ensures default values are set for existing records

-- Update any existing user_settings records that don't have a language set
UPDATE user_settings
SET language = 'en'
WHERE language IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN user_settings.language IS 'User interface language preference (en or uk)';
