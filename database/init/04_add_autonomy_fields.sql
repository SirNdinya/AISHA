-- ============================================================================
-- SCHEMA UPDATE FOR COMPANY AUTONOMY
-- ============================================================================

-- Add auto-filtering configuration (JSONB) and scheduling (TIMESTAMP)
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS auto_filter_config JSONB DEFAULT '{}', -- e.g. {"min_skill_index": 80, "verified_only": true}
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
