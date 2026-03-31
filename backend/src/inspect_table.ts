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

async function inspectTable() {
    try {
        console.log("Inspecting 'opportunities' table columns...");
        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'opportunities'
            ORDER BY ordinal_position;
        `);
        console.table(res.rows);
    } catch (e: any) {
        console.error(e.message);
    } finally {
        await pool.end();
    }
}

inspectTable();
