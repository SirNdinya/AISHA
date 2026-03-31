import pool from './config/database';

async function setupInstitutionalSchema() {
    const client = await pool.connect();
    try {
        console.log('Initializing inst_mmust schema...');
        await client.query('CREATE SCHEMA IF NOT EXISTS inst_mmust');

        // 1. student_records
        await client.query(`
            CREATE TABLE IF NOT EXISTS inst_mmust.student_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                reg_number VARCHAR(50) UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                course VARCHAR(255) NOT NULL,
                year_of_study INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. academic_units
        await client.query(`
            CREATE TABLE IF NOT EXISTS inst_mmust.academic_units (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                unit_code VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                department_code VARCHAR(20) NOT NULL
            );
        `);

        // 3. student_academic_records (Grades)
        await client.query(`
            CREATE TABLE IF NOT EXISTS inst_mmust.student_academic_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID REFERENCES inst_mmust.student_records(id) ON DELETE CASCADE,
                unit_id UUID REFERENCES inst_mmust.academic_units(id) ON DELETE CASCADE,
                grade VARCHAR(5),
                semester VARCHAR(20),
                academic_year INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Tables created in inst_mmust schema.');

        // 4. Update institutions table
        await client.query(`
            UPDATE institutions 
            SET schema_name = 'inst_mmust' 
            WHERE code = 'MMUST'
        `);
        console.log('Updated MMUST with schema_name: inst_mmust');

        process.exit(0);
    } catch (e) {
        console.error('Schema Setup Error:', e);
        process.exit(1);
    } finally {
        client.release();
    }
}

setupInstitutionalSchema();
