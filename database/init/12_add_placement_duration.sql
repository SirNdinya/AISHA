-- Migration: Add placement_duration to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS placement_duration INT DEFAULT 3;
