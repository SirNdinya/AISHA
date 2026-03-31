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

async function check() {
    try {
        const publicCount = await pool.query('SELECT COUNT(*) FROM public.student_academic_records WHERE mark IS NOT NULL');
        console.log("Public records with marks:", publicCount.rows[0].count);

        const publicNull = await pool.query('SELECT COUNT(*) FROM public.student_academic_records WHERE mark IS NULL');
        console.log("Public records with NULL marks:", publicNull.rows[0].count);

        try {
            const mmustCount = await pool.query('SELECT COUNT(*) FROM inst_mmust.student_academic_records WHERE mark IS NOT NULL');
            console.log("MMUST records with marks:", mmustCount.rows[0].count);
        } catch (e) {}

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();
