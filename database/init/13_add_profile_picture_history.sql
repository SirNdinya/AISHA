ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_picture_history JSONB DEFAULT '{}';
