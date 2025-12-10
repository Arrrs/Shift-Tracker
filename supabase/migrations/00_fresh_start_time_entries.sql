-- CLEAN START: Drop existing tables
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS shift_templates CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;

-- ============================================
-- CORE TABLE 1: JOBS
-- ============================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,

  -- Pay structure
  pay_type TEXT NOT NULL CHECK (pay_type IN ('hourly', 'daily', 'monthly', 'salary')),
  hourly_rate DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  monthly_salary DECIMAL(10,2),

  -- Currency
  currency TEXT DEFAULT 'USD',
  currency_symbol TEXT DEFAULT '$',

  -- Benefits (for day-offs)
  pto_days_per_year INTEGER DEFAULT 0,
  sick_days_per_year INTEGER DEFAULT 0,
  personal_days_per_year INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Optional: Salary history for audit trail
  salary_history JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_jobs_user ON jobs(user_id);
CREATE INDEX idx_jobs_active ON jobs(is_active) WHERE is_active = true;

-- ============================================
-- CORE TABLE 2: SHIFT_TEMPLATES
-- ============================================
CREATE TABLE shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  -- Template info
  name TEXT NOT NULL,
  short_code TEXT,  -- Quick select: "M", "E", "N"
  color TEXT,

  -- Pre-fill values
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  expected_hours DECIMAL(4,2) NOT NULL,

  -- Optional defaults
  default_custom_rate DECIMAL(10,2),
  default_holiday_multiplier DECIMAL(3,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_job ON shift_templates(job_id);

-- ============================================
-- CORE TABLE 3: TIME_ENTRIES
-- ============================================
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Type discriminator
  entry_type TEXT NOT NULL CHECK (entry_type IN ('work_shift', 'day_off')),

  -- Work shift fields (NULL for day-offs)
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  template_id UUID REFERENCES shift_templates(id) ON DELETE SET NULL,
  start_time TIME,
  end_time TIME,
  scheduled_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2) NOT NULL,
  is_overnight BOOLEAN DEFAULT false,

  -- Day-off fields (NULL for work shifts)
  day_off_type TEXT CHECK (day_off_type IN ('pto', 'sick', 'personal', 'unpaid', 'bereavement', 'maternity', 'paternity', 'jury_duty')),
  is_full_day BOOLEAN,

  -- Common fields
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT work_shift_requires_times CHECK (
    entry_type = 'day_off' OR (start_time IS NOT NULL AND end_time IS NOT NULL)
  ),
  CONSTRAINT day_off_requires_type CHECK (
    entry_type = 'work_shift' OR day_off_type IS NOT NULL
  )
);

CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, date DESC);
CREATE INDEX idx_time_entries_job ON time_entries(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX idx_time_entries_type ON time_entries(entry_type);

-- ============================================
-- CORE TABLE 4: INCOME_RECORDS
-- ============================================
CREATE TABLE income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Source
  source_type TEXT NOT NULL CHECK (source_type IN ('job_shift', 'job_salary', 'bonus', 'freelance', 'other')),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE SET NULL,

  -- Money
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Calculation metadata (for transparency)
  calculation_basis JSONB,  -- {hours, rate, multiplier, formula}

  is_manual BOOLEAN DEFAULT false,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_income_user_date ON income_records(user_id, date DESC);
CREATE INDEX idx_income_job ON income_records(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX idx_income_time_entry ON income_records(time_entry_id) WHERE time_entry_id IS NOT NULL;

-- ============================================
-- CORE TABLE 5: EXPENSE_CATEGORIES
-- ============================================
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  icon TEXT,  -- Emoji or icon name
  color TEXT DEFAULT '#EF4444',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expense_categories_user ON expense_categories(user_id);

-- Default categories
INSERT INTO expense_categories (user_id, name, icon, color)
SELECT
  id,
  category.name,
  category.icon,
  category.color
FROM auth.users
CROSS JOIN (
  VALUES
    ('Rent/Mortgage', '🏠', '#3B82F6'),
    ('Utilities', '💡', '#F59E0B'),
    ('Groceries', '🛒', '#10B981'),
    ('Transportation', '🚗', '#8B5CF6'),
    ('Healthcare', '🏥', '#EF4444'),
    ('Entertainment', '🎬', '#EC4899'),
    ('Other', '📝', '#6B7280')
) AS category(name, icon, color)
ON CONFLICT DO NOTHING;

-- ============================================
-- CORE TABLE 6: EXPENSE_RECORDS
-- ============================================
CREATE TABLE expense_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,

  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expense_user_date ON expense_records(user_id, date DESC);
CREATE INDEX idx_expense_category ON expense_records(category_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_records ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Users can manage own jobs" ON jobs
  FOR ALL USING (auth.uid() = user_id);

-- Templates policies
CREATE POLICY "Users can manage own templates" ON shift_templates
  FOR ALL USING (auth.uid() = user_id);

-- Time entries policies
CREATE POLICY "Users can manage own time entries" ON time_entries
  FOR ALL USING (auth.uid() = user_id);

-- Income policies
CREATE POLICY "Users can manage own income" ON income_records
  FOR ALL USING (auth.uid() = user_id);

-- Expense categories policies
CREATE POLICY "Users can manage own expense categories" ON expense_categories
  FOR ALL USING (auth.uid() = user_id);

-- Expense records policies
CREATE POLICY "Users can manage own expenses" ON expense_records
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_templates_updated_at BEFORE UPDATE ON shift_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_records_updated_at BEFORE UPDATE ON income_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_records_updated_at BEFORE UPDATE ON expense_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-GENERATE INCOME FOR HOURLY/DAILY SHIFTS
-- ============================================

CREATE OR REPLACE FUNCTION auto_generate_income_for_shift()
RETURNS TRIGGER AS $$
DECLARE
  v_job RECORD;
  v_calculated_amount DECIMAL(10,2);
  v_calculation_basis JSONB;
BEGIN
  -- Only process completed work shifts with a job
  IF NEW.entry_type != 'work_shift' OR NEW.status != 'completed' OR NEW.job_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get job details
  SELECT * INTO v_job FROM jobs WHERE id = NEW.job_id;

  -- Only auto-generate for hourly/daily jobs (not monthly/salary)
  IF v_job.pay_type NOT IN ('hourly', 'daily') THEN
    RETURN NEW;
  END IF;

  -- Calculate amount
  IF v_job.pay_type = 'hourly' THEN
    v_calculated_amount := NEW.actual_hours * v_job.hourly_rate;
    v_calculation_basis := jsonb_build_object(
      'hours', NEW.actual_hours,
      'rate', v_job.hourly_rate,
      'formula', NEW.actual_hours || 'h × $' || v_job.hourly_rate
    );
  ELSIF v_job.pay_type = 'daily' THEN
    v_calculated_amount := v_job.daily_rate;
    v_calculation_basis := jsonb_build_object(
      'rate', v_job.daily_rate,
      'formula', 'Daily rate: $' || v_job.daily_rate
    );
  END IF;

  -- Create income record
  INSERT INTO income_records (
    user_id,
    date,
    source_type,
    job_id,
    time_entry_id,
    amount,
    currency,
    calculation_basis,
    is_manual
  ) VALUES (
    NEW.user_id,
    NEW.date,
    'job_shift',
    NEW.job_id,
    NEW.id,
    v_calculated_amount,
    v_job.currency,
    v_calculation_basis,
    false
  )
  ON CONFLICT DO NOTHING;  -- Prevent duplicates if trigger runs twice

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_income_on_shift_complete
  AFTER INSERT OR UPDATE ON time_entries
  FOR EACH ROW
  WHEN (NEW.entry_type = 'work_shift' AND NEW.status = 'completed')
  EXECUTE FUNCTION auto_generate_income_for_shift();

COMMENT ON TRIGGER auto_income_on_shift_complete ON time_entries IS
  'Automatically creates income record when hourly/daily shift is marked completed';
