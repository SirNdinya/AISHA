
import pool from './src/config/database';

async function setupPlacements() {
    try {
        console.log('Creating placements table if not exists...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS placements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                application_id UUID REFERENCES applications(id),
                student_id UUID REFERENCES students(id),
                opportunity_id UUID REFERENCES opportunities(id),
                company_id UUID REFERENCES companies(id),
                start_date DATE NOT NULL DEFAULT CURRENT_DATE,
                end_date DATE,
                status VARCHAR(20) DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Placements table ensured.');
        process.exit(0);
    } catch (err) {
        console.error('Error creating placements table:', err);
        process.exit(1);
    }
}

setupPlacements();
