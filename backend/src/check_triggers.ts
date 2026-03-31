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

async function checkTriggers() {
    try {
        console.log("Checking triggers on 'opportunities' table...");
        const res = await pool.query(`
            SELECT trigger_name, event_manipulation, action_statement, action_timing
            FROM information_schema.triggers
            WHERE event_object_table = 'opportunities';
        `);
        console.table(res.rows);
    } catch (e: any) {
        console.error(e.message);
    } finally {
        await pool.end();
    }
}

checkTriggers();
