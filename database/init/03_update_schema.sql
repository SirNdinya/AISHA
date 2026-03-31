-- ============================================================================
-- SCHEMA UPDATE TO MATCH CONTROLLER LOGIC
-- ============================================================================

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'ATTACHMENT';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 3;
ALTER TABLE opportunities RENAME COLUMN deadline TO application_deadline;
ALTER TABLE opportunities RENAME COLUMN positions_available TO vacancies;
