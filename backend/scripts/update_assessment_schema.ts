
import pool from '../src/config/database';

async function updateAssessmentSchema() {
    try {
        console.log('Updating database for Assessment System...');

        // 1. Update Opportunities with department_id
        await pool.query(`
            ALTER TABLE opportunities 
            ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
        `);

        // 2. Create Assessments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assessments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                placement_id UUID REFERENCES placements(id) ON DELETE CASCADE,
                assessor_id UUID REFERENCES users(id),
                assessor_type VARCHAR(20) NOT NULL, -- 'COMPANY', 'INSTITUTION'
                assessment_date DATE NOT NULL,
                comments TEXT,
                strengths TEXT,
                weaknesses TEXT,
                recommendations TEXT,
                digital_signature TEXT, -- Name/Title of signer
                is_signed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Create Logbook Entries table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS logbook_entries (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                placement_id UUID REFERENCES placements(id) ON DELETE CASCADE,
                student_id UUID REFERENCES students(id),
                entry_date DATE NOT NULL,
                activity_description TEXT NOT NULL,
                challenges TEXT,
                supervisor_comment TEXT,
                supervisor_id UUID REFERENCES users(id),
                status VARCHAR(20) DEFAULT 'SUBMITTED', -- PENDING, VERIFIED
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Assessment tables created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating assessment schema:', err);
        process.exit(1);
    }
}

updateAssessmentSchema();
