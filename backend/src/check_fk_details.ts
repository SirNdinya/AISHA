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

async function checkFK() {
    try {
        console.log("Checking foreign keys for 'opportunities' table...");
        const res = await pool.query(`
            SELECT
                conname AS constraint_name,
                pg_get_constraintdef(c.oid) AS constraint_definition
            FROM
                pg_constraint c
            JOIN
                pg_namespace n ON n.oid = c.connamespace
            WHERE
                contype = 'f' AND conrelid = 'opportunities'::regclass;
        `);
        console.table(res.rows);
    } catch (e: any) {
        console.error(e.message);
    } finally {
        await pool.end();
    }
}

checkFK();
