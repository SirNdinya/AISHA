import pool from '../config/database';

async function migrate() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS weekly_logbook_entries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            placement_id UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
            week_number INTEGER NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            monday_description TEXT,
            tuesday_description TEXT,
            wednesday_description TEXT,
            thursday_description TEXT,
            friday_description TEXT,
            saturday_description TEXT,
            weekly_summary TEXT,
            student_signature_date TIMESTAMP,
            industry_supervisor_comments TEXT,
            industry_supervisor_signature_date TIMESTAMP,
            university_supervisor_comments TEXT,
            university_supervisor_signature_date TIMESTAMP,
            status VARCHAR(50) DEFAULT 'DRAFT',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(placement_id, week_number)
        );
    `;

    try {
        await pool.query(createTableQuery);
        console.log("Migration successful: Created weekly_logbook_entries table.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
