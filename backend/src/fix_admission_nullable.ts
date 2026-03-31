import pool from './config/database';

async function fixSchema() {
    try {
        console.log('Fixing schema: Making admission_number nullable...');
        await pool.query('ALTER TABLE students ALTER COLUMN admission_number DROP NOT NULL');
        console.log('Schema fixed successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Schema fix failed:', e);
        process.exit(1);
    }
}

fixSchema();
