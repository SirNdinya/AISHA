import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function debug() {
    try {
        console.log("Checking student_academic_records for marks...");
        const res = await pool.query('SELECT id, mark, grade FROM student_academic_records LIMIT 10');
        console.log("Samples:", res.rows);

        console.log("Checking students table schema for profile picture...");
        const schemaRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'students' AND (column_name LIKE '%photo%' OR column_name LIKE '%picture%' OR column_name LIKE '%image%' OR column_name LIKE '%url%')
        `);
        console.log("Profile Columns:", schemaRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

debug();
