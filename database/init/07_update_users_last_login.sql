-- ============================================================================
-- SCHEMA UPDATE: ADD LAST LOGIN TRACKING
-- ============================================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Also add a column for login attempts for security if it's missing
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lock_until TIMESTAMP WITH TIME ZONE;
