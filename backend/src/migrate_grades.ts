import pool from './config/database';

async function migrateSchema() {
    try {
        console.log('Altering grade column types to VARCHAR(20)...');
        await pool.query('ALTER TABLE inst_mmust.student_academic_records ALTER COLUMN grade TYPE VARCHAR(20)');
        await pool.query('ALTER TABLE student_academic_records ALTER COLUMN grade TYPE VARCHAR(20)');
        await pool.query('ALTER TABLE student_units ALTER COLUMN grade TYPE VARCHAR(20)');
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Migration Failed:', e);
        process.exit(1);
    }
}

migrateSchema();
