-- Migration: Add student_interests table for better normalization
-- This allows more efficient searching and prevents the "disappearing" issue by fixing naming mismatches.

CREATE TABLE IF NOT EXISTS student_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    interest VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, interest)
);

-- Migrate existing data from the students table (array field)
INSERT INTO student_interests (student_id, interest)
SELECT id, unnest(interests) 
FROM students 
WHERE interests IS NOT NULL
ON CONFLICT DO NOTHING;

-- Optional: We keep the interests array for now to avoid breaking other parts of the app immediately, 
-- but we will primary use the table for updates in the controller.
