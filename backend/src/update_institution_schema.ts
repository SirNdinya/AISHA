import pool from './config/database';

const updateSchema = async () => {
    const client = await pool.connect();
    try {
        console.log('Updating institution schema to support Schools...');

        // 0. Add SCHOOL_COORDINATOR to user_role enum
        // Note: ALTER TYPE ADD VALUE cannot run in a transaction in many PG versions
        try {
            await client.query("ALTER TYPE user_role ADD VALUE 'SCHOOL_COORDINATOR'");
            console.log("Added 'SCHOOL_COORDINATOR' to user_role enum.");
        } catch (e: any) {
            if (e.code === '42710') {
                console.log("'SCHOOL_COORDINATOR' already exists in enum.");
            } else {
                console.warn("Could not add 'SCHOOL_COORDINATOR' to enum:", e.message);
            }
        }

        await client.query('BEGIN');

        // 1. Create schools table
        await client.query(`
            CREATE TABLE IF NOT EXISTS schools (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50) NOT NULL,
                description TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created schools table.');

        // 2. Add school_id to departments
        await client.query(`
            ALTER TABLE departments 
            ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
        `);
        console.log('Added school_id to departments table.');

        // 3. Add school_id to students for easier filtering
        await client.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
        `);
        console.log('Added school_id to students table.');

        // 4. Ensure SCHOOL_COORDINATOR role exists (handled by application logic typically, but let's check users table)
        // Note: PostgreSQL ENUMs are tricky to update if already exist. We assume application handles validation.

        await client.query('COMMIT');
        console.log('Schema update completed successfully.');
        process.exit(0);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating schema:', error);
        process.exit(1);
    } finally {
        client.release();
    }
};

updateSchema();
