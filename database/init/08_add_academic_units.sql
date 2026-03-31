-- ============================================================================
-- SCHEMA UPDATE: REAL ACADEMIC TRACKING
-- ============================================================================

-- Track academic units/courses offered by institutions
CREATE TABLE IF NOT EXISTS academic_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    credits INTEGER DEFAULT 3,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institution_id, code)
);

-- Track student progress in specific units
CREATE TABLE IF NOT EXISTS student_academic_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES academic_units(id) ON DELETE CASCADE,
    semester VARCHAR(50) NOT NULL, -- e.g. "Year 4, Semester 1"
    grade VARCHAR(5), -- Opting for letter grades or marks
    status VARCHAR(20) DEFAULT 'COMPLETED', -- COMPLETED, ONGOING
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, unit_id)
);

-- Add last_login to users if missing (referenced in some logic)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
