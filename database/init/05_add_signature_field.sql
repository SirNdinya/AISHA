-- ============================================================================
-- SCHEMA UPDATE FOR INSTITUTION AUTONOMY
-- ============================================================================

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS institution_signature TEXT;
