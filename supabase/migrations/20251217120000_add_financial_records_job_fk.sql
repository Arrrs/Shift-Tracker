-- Add foreign key constraint between financial_records and jobs
-- This enables Supabase to use automatic joins for better performance

ALTER TABLE financial_records
ADD CONSTRAINT financial_records_job_id_fkey
FOREIGN KEY (job_id)
REFERENCES jobs(id)
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_financial_records_job_id ON financial_records(job_id);
