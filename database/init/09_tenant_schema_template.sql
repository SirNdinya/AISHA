-- ============================================================================
-- AISHA - TENANT SCHEMA TEMPLATE
-- This script defines the tables that will exist within each institution's 
-- isolated schema.
-- ============================================================================

-- NOTE: This is a placeholder file used by the backend to generate schemas.
-- Actual schema creation happens via a stored procedure or backend service.

/*
Table Structure for inst_{schema_name}:

1. students: Source of truth for student identity within the institution.
2. academic_units: Courses offered by the institution.
3. student_academic_records: Grades and unit completion status.
4. fee_records: (Optional) For eligibility verification.
*/

-- Example of how the tables will look inside a tenant schema:
-- CREATE TABLE student_records (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     reg_number VARCHAR(50) UNIQUE NOT NULL,
--     full_name VARCHAR(255) NOT NULL,
--     email VARCHAR(255) UNIQUE,
--     course VARCHAR(255),
--     year_of_study INT,
--     is_active BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
