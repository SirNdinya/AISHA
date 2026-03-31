-- ============================================================================
-- STUDENT ATTACHMENT PLACEMENT SYSTEM (SAPS) - MAIN SCHEMA
-- Version: 1.0.0
-- Dialect: PostgreSQL
-- ============================================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USER MANAGEMENT (RBAC)
-- ============================================================================
CREATE TYPE user_role AS ENUM ('STUDENT', 'COMPANY', 'INSTITUTION', 'ADMIN', 'DEPARTMENT_ADMIN');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    phone_number VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. INSTITUTIONS
-- ============================================================================
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    schema_name VARCHAR(63) UNIQUE, -- For institutional isolation
    address TEXT,
    contact_person VARCHAR(100),
    is_admin_verified BOOLEAN DEFAULT FALSE, -- Explicitly set by AISHA Admin after email verification
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2.1 DEPARTMENTS
-- ============================================================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Account for the Dept Admin
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}', -- AI/ML metadata for dashboard customization
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institution_id, code)
);

-- ============================================================================
-- 3. COMPANIES
-- ============================================================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    description TEXT,
    location VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    logo_url VARCHAR(255),
    is_blacklisted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. STUDENTS
-- ============================================================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    institution_id UUID REFERENCES institutions(id),
    department_id UUID REFERENCES departments(id),
    course_of_study VARCHAR(255),
    current_year INT,
    skills TEXT[], -- Array of strings
    interests TEXT[],
    cv_url VARCHAR(255),
    profile_picture_url VARCHAR(255),
    preferred_locations TEXT[],
    resume_text TEXT, -- Parsed text for AI matching
    requires_stipend BOOLEAN DEFAULT FALSE,
    min_stipend_amount NUMERIC(10, 2) DEFAULT 0,
    mpesa_number VARCHAR(20),
    auto_apply_enabled BOOLEAN DEFAULT FALSE,
    sync_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SYNCED, FAILED
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. OPPORTUNITIES & PLACEMENTS
-- ============================================================================
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    skills_required TEXT[],
    location VARCHAR(100),
    stipend_amount NUMERIC(10, 2) DEFAULT 0,
    positions_available INTEGER DEFAULT 1,
    deadline TIMESTAMP WITH TIME ZONE,
    auto_accept BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, CLOSED, FILLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id),
    opportunity_id UUID REFERENCES opportunities(id),
    match_score NUMERIC(5, 2), -- 0 to 100
    match_reason TEXT, -- Explanation from AI
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, REVIEW, ACCEPTED, REJECTED
    auto_generated_docs JSONB, -- URLs to NITA, Letters
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. LEARNING MODULE
-- ============================================================================
CREATE TABLE learning_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    platform VARCHAR(50), -- Coursera, Udemy, YouTube
    url VARCHAR(500) NOT NULL,
    skills_covered TEXT[],
    cost_type VARCHAR(20) DEFAULT 'FREE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id),
    resource_id UUID REFERENCES learning_resources(id),
    status VARCHAR(20) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED
    completion_date TIMESTAMP,
    certificate_url VARCHAR(255)
);

-- ============================================================================
-- 7. PAYMENTS (M-PESA)
-- ============================================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES opportunities(id),
    student_id UUID REFERENCES students(id),
    company_id UUID REFERENCES companies(id),
    amount NUMERIC(10, 2) NOT NULL,
    transaction_type VARCHAR(20), -- STIPEND, GRANT
    mpesa_receipt_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. SYSTEM CONFIG & AUDIT
-- ============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Nullable for system actions
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(20) DEFAULT 'INFO', -- INFO, SUCCESS, WARNING, ERROR
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. DOCUMENT HUB & AI VERIFICATION
-- ============================================================================
CREATE TABLE document_hub (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id), -- Student, Institution, or Company
    type VARCHAR(50) NOT NULL, -- NITA_FORM, INSURANCE_COVER, ACADEMIC_CERT, etc.
    file_url VARCHAR(500) NOT NULL,
    metadata JSONB, -- AI-extracted data, form fields
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
    is_auto_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES document_hub(id) ON DELETE CASCADE,
    verified_by_ai BOOLEAN DEFAULT FALSE,
    ai_confidence NUMERIC(5, 2), -- 0 to 100
    verification_details JSONB, -- AI report on validity/accuracy
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDICES for Performance
CREATE INDEX idx_opp_skills ON opportunities USING GIN (skills_required);
CREATE INDEX idx_student_skills ON students USING GIN (skills);
CREATE INDEX idx_apps_student ON applications(student_id);
CREATE INDEX idx_apps_opp ON applications(opportunity_id);

-- ============================================================================
-- 9. MULTI-TENANCY HELPERS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_institution_schema(inst_id UUID, slug VARCHAR) 
RETURNS VOID AS $$
DECLARE
    target_schema_name TEXT := 'inst_' || replace(slug, '-', '_');
BEGIN
    -- 1. Create Schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', target_schema_name);

    -- 2. Create Student Records Table
    EXECUTE format('
        CREATE TABLE %I.student_records (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            reg_number VARCHAR(50) UNIQUE NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE,
            course VARCHAR(255),
            year_of_study INT,
            gpa NUMERIC(3,2),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', target_schema_name);

    -- 3. Create Academic Units
    EXECUTE format('
        CREATE TABLE %I.academic_units (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            unit_code VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            credits INT
        )', target_schema_name);

    -- 4. Create Student Academic Records
    EXECUTE format('
        CREATE TABLE %I.student_academic_records (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            student_id UUID REFERENCES %I.student_records(id),
            unit_id UUID REFERENCES %I.academic_units(id),
            grade VARCHAR(5),
            semester VARCHAR(20),
            academic_year INT,
            status VARCHAR(20) DEFAULT ''COMPLETED'',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', target_schema_name, target_schema_name, target_schema_name);

    -- 5. Update Institution record
    UPDATE public.institutions SET schema_name = target_schema_name WHERE id = inst_id;

    -- 6. Grant Permissions (Optional/Future: Specific role for schema)
END;
$$ LANGUAGE plpgsql;
