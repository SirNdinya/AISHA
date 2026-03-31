import pool from './config/database';

const setupCompanySystemSchema = async () => {
    try {
        console.log('Setting up advanced Company System schema...');

        const queries = [
            // 1. Company Departments
            `CREATE TABLE IF NOT EXISTS company_departments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,

            // 2. Company Supervisors
            `CREATE TABLE IF NOT EXISTS company_supervisors (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
                department_id UUID REFERENCES company_departments(id) ON DELETE SET NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,

            // 3. Assessments Coordination
            `CREATE TABLE IF NOT EXISTS assessments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                placement_id UUID REFERENCES placements(id) ON DELETE CASCADE,
                institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
                company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
                proposed_date TIMESTAMP WITH TIME ZONE NOT NULL,
                confirmed_date TIMESTAMP WITH TIME ZONE,
                status VARCHAR(50) DEFAULT 'PROPOSED', -- PROPOSED, CONFIRMED, REJECTED, COMPLETED
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,

            // 4. Add offer_expires_at to applications (Idempotent)
            `DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'offer_expires_at') THEN
                    ALTER TABLE applications ADD COLUMN offer_expires_at TIMESTAMP WITH TIME ZONE;
                END IF;
            END $$;`
        ];

        for (const query of queries) {
            await pool.query(query);
            console.log('Executed query successfully.');
        }

        console.log('Company System Schema setup complete.');
    } catch (error) {
        console.error('Error setting up Company System schema:', error);
    } finally {
        await pool.end();
    }
};

setupCompanySystemSchema();
