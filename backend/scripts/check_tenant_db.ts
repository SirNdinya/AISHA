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

async function checkDb() {
    try {
        const studentRes = await pool.query(`
            SELECT s.admission_number, LENGTH(s.admission_number) as len
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN institutions i ON u.institution_id = i.id
            LIMIT 1;
        `);
        console.table(studentRes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkDb();
