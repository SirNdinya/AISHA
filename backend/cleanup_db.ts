import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'saps_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'saps_db',
    password: process.env.DB_PASSWORD || 'saps_password',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function cleanup() {
    try {
        await pool.connect();
        console.log('Connected to PG for cleanup...');

        await pool.query('BEGIN');

        // 1. Delete student related records first (explicitly to avoid foreign key issues if cascade isn't set)
        console.log('Deleting student units and academic records...');
        await pool.query('DELETE FROM student_units');
        await pool.query('DELETE FROM student_academic_records');

        // 2. Delete students based on MMUST dummy emails or all students if this is a test env
        console.log('Deleting students...');
        await pool.query('DELETE FROM students');

        // 3. Delete users with MMUST dummy emails
        console.log('Deleting dummy users...');
        await pool.query(`
            DELETE FROM users 
            WHERE email LIKE '%@student.mmust.ac.ke' 
               OR email LIKE 'admin_%@mmust.ac.ke' 
               OR email LIKE 'coordinator_%@mmust.ac.ke'
               OR email = 'admin_mmust@mmust.ac.ke'
        `);

        // Note: We are KEEPING institutions, schools, and departments as the "University Database"
        // And we are KEEPING the mmust schema data (student_records) for syncing.

        await pool.query('COMMIT');
        console.log('Cleanup successful. Platform side is ready for real registration testing.');
    } catch (e) {
        await pool.query('ROLLBACK');
        console.error('Cleanup failed:', e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

cleanup();
