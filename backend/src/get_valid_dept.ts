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

const companyId = 'f6ff36a8-2a5d-4c77-9704-b52efd45a8b7';

async function getDept() {
    try {
        const res = await pool.query('SELECT id, name FROM company_departments WHERE company_id = $1 LIMIT 1', [companyId]);
        console.log(JSON.stringify(res.rows[0], null, 2));
    } catch (e: any) {
        console.error(e.message);
    } finally {
        await pool.end();
    }
}

getDept();
