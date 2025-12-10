-- Update default currency from UAH to USD in jobs table
ALTER TABLE jobs
  ALTER COLUMN currency SET DEFAULT 'USD';

-- Update default currency in user_settings table
ALTER TABLE user_settings
  ALTER COLUMN default_currency SET DEFAULT 'USD';

-- Optional: Update existing rows (if you want)
UPDATE jobs SET currency = 'USD' WHERE currency = 'UAH';
UPDATE user_settings SET default_currency = 'USD' WHERE default_currency = 'UAH';
