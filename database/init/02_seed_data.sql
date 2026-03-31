-- ============================================================================
-- SEED DATA FOR SAPS
-- ============================================================================

-- 1. USERS
-- Password is 'password123' (properly hashed with bcrypt)
INSERT INTO users (id, email, password_hash, role, is_verified, phone_number) VALUES
('u1000000-0000-0000-0000-000000000001', 'student@test.com', '$2b$10$NPodhVvNXHqAzjR33NKWZOEmz99/53xkeD7fwaaaIAbKPq.fcIQim', 'STUDENT', TRUE, '+254700000001'),
('u1000000-0000-0000-0000-000000000002', 'admin@test.com', '$2b$10$NPodhVvNXHqAzjR33NKWZOEmz99/53xkeD7fwaaaIAbKPq.fcIQim', 'ADMIN', TRUE, '+254700000002'),
('u1000000-0000-0000-0000-000000000003', 'company@test.com', '$2b$10$NPodhVvNXHqAzjR33NKWZOEmz99/53xkeD7fwaaaIAbKPq.fcIQim', 'COMPANY', TRUE, '+254700000003'),
('u1000000-0000-0000-0000-000000000004', 'institution@test.com', '$2b$10$NPodhVvNXHqAzjR33NKWZOEmz99/53xkeD7fwaaaIAbKPq.fcIQim', 'INSTITUTION', TRUE, '+254700000004');

-- 2. INSTITUTIONS
INSERT INTO institutions (id, user_id, name, code, address, contact_person) VALUES
('i1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000004', 'University of Nairobi', 'UON-001', 'University Way, Nairobi', 'Registrar Academic');

-- 3. COMPANIES
INSERT INTO companies (id, user_id, name, description, industry, location, website) VALUES
('c1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000003', 'KCB Group', 'Leading financial institution in East Africa.', 'Finance', 'Nairobi, CBD', 'https://kcbgroup.com');

-- 4. STUDENTS
INSERT INTO students (id, user_id, first_name, last_name, admission_number, institution_id, course_of_study, skills, auto_apply_enabled) VALUES
('s1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000001', 'John', 'Doe', 'P15/1234/2022', 'i1000000-0000-0000-0000-000000000001', 'Computer Science', ARRAY['Python', 'React', 'SQL'], TRUE);

-- 5. OPPORTUNITIES
INSERT INTO opportunities (id, company_id, title, description, skills_required, location, stipend_amount, status) VALUES
('o1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Software Engineering Intern', 'Join our digital transformation team. You will work on backend systems and API integrations.', ARRAY['Java', 'Spring Boot', 'SQL'], 'Nairobi HQ', 15000.00, 'OPEN'),
('o1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Data Analysis Attaché', 'Support our data science team in analyzing customer trends.', ARRAY['Python', 'Excel', 'Tableau'], 'Nairobi HQ', 10000.00, 'OPEN');
