-- =====================================================
-- SHIFT TRACKER - DATABASE SCHEMA
-- Created: 2024-12-03
-- All tables with Row Level Security enabled
-- =====================================================

-- =====================================================
-- TABLE: jobs
-- Stores user's employers/jobs
-- =====================================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'UAH',
  hourly_rate DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  pay_type TEXT CHECK (pay_type IN ('hourly', 'daily')),
  overtime_config JSONB DEFAULT '{"type": "multiplier", "value": 1.5}'::jsonb,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: shift_templates
-- Reusable shift patterns per job
-- =====================================================
CREATE TABLE shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_code TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  expected_hours DECIMAL(4,2) NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: shifts
-- Actual work shifts (core data!)
-- =====================================================
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  template_id UUID REFERENCES shift_templates(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  actual_hours DECIMAL(5,2),
  regular_hours DECIMAL(5,2),
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  undertime_hours DECIMAL(5,2) DEFAULT 0,
  is_holiday BOOLEAN DEFAULT false,
  holiday_multiplier DECIMAL(3,2),
  status TEXT CHECK (status IN ('planned', 'in_progress', 'completed')) DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date, start_time)
);

-- =====================================================
-- TABLE: shift_adjustments
-- Penalties and bonuses per shift
-- =====================================================
CREATE TABLE shift_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('penalty', 'bonus')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  calculation_type TEXT CHECK (calculation_type IN ('fixed', 'percentage')) DEFAULT 'fixed',
  percentage_of TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: salary_periods
-- Define salary calculation periods
-- =====================================================
CREATE TABLE salary_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'closed')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: user_settings
-- User preferences and dashboard layout
-- =====================================================
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  clock_style TEXT DEFAULT 'digital',
  default_currency TEXT DEFAULT 'UAH',
  language TEXT DEFAULT 'en',
  notification_prefs JSONB DEFAULT '{}'::jsonb,
  dashboard_layout JSONB DEFAULT '{"showClock": true, "showCountdown": true, "showCounter": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: currency_rates (Optional - for conversion)
-- =====================================================
CREATE TABLE currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(10,6) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only see/modify their own data
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs" ON jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Shift templates policies
CREATE POLICY "Users can view own shift_templates" ON shift_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shift_templates" ON shift_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shift_templates" ON shift_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shift_templates" ON shift_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Shifts policies
CREATE POLICY "Users can view own shifts" ON shifts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shifts" ON shifts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shifts" ON shifts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shifts" ON shifts
  FOR DELETE USING (auth.uid() = user_id);

-- Shift adjustments policies (via shift ownership)
CREATE POLICY "Users can view own shift_adjustments" ON shift_adjustments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shifts WHERE shifts.id = shift_adjustments.shift_id AND shifts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own shift_adjustments" ON shift_adjustments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shifts WHERE shifts.id = shift_adjustments.shift_id AND shifts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own shift_adjustments" ON shift_adjustments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM shifts WHERE shifts.id = shift_adjustments.shift_id AND shifts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own shift_adjustments" ON shift_adjustments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM shifts WHERE shifts.id = shift_adjustments.shift_id AND shifts.user_id = auth.uid()
    )
  );

-- Salary periods policies
CREATE POLICY "Users can view own salary_periods" ON salary_periods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own salary_periods" ON salary_periods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary_periods" ON salary_periods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary_periods" ON salary_periods
  FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own user_settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Currency rates - public read access
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view currency_rates" ON currency_rates
  FOR SELECT USING (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- Auto-update updated_at timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_templates_updated_at BEFORE UPDATE ON shift_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_shift_templates_user_id ON shift_templates(user_id);
CREATE INDEX idx_shift_templates_job_id ON shift_templates(job_id);
CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_shifts_job_id ON shifts(job_id);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shift_adjustments_shift_id ON shift_adjustments(shift_id);
CREATE INDEX idx_salary_periods_user_id ON salary_periods(user_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- =====================================================
-- DONE!
-- All tables created with Row Level Security
-- =====================================================
