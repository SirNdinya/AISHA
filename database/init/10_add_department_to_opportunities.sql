-- ============================================================================
-- SCHEMA UPDATE: LINK OPPORTUNITIES TO DEPARTMENTS
-- ============================================================================

ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_opp_department ON opportunities(department_id);
