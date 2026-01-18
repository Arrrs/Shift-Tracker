-- Migration: Add trigger to create default categories for new users
-- This ensures that when a new user signs up, they automatically get the mandatory
-- "Other Income" and "Other Expense" categories

-- Create a function that inserts default categories for a new user
CREATE OR REPLACE FUNCTION create_default_categories_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default income category
  INSERT INTO financial_categories (user_id, name, type, icon, color)
  VALUES (NEW.id, 'Other Income', 'income', '💰', '#6366f1')
  ON CONFLICT (user_id, name, type) DO NOTHING;

  -- Insert default expense category
  INSERT INTO financial_categories (user_id, name, type, icon, color)
  VALUES (NEW.id, 'Other Expense', 'expense', '💸', '#64748b')
  ON CONFLICT (user_id, name, type) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users table
-- Note: This requires the extension to be enabled and appropriate permissions
DROP TRIGGER IF EXISTS on_auth_user_created_add_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_add_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories_for_new_user();

-- Also insert default categories for any existing users who don't have them
-- This handles users who signed up after the original migration but before this one
INSERT INTO financial_categories (user_id, name, type, icon, color)
SELECT u.id, 'Other Income', 'income', '💰', '#6366f1'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM financial_categories fc
  WHERE fc.user_id = u.id AND fc.name = 'Other Income' AND fc.type = 'income'
)
ON CONFLICT (user_id, name, type) DO NOTHING;

INSERT INTO financial_categories (user_id, name, type, icon, color)
SELECT u.id, 'Other Expense', 'expense', '💸', '#64748b'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM financial_categories fc
  WHERE fc.user_id = u.id AND fc.name = 'Other Expense' AND fc.type = 'expense'
)
ON CONFLICT (user_id, name, type) DO NOTHING;
