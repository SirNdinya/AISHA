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
        const users = await pool.query("SELECT id, email, role FROM users WHERE role = 'COMPANY'");
        console.log("Company Users:", users.rows);

        const companies = await pool.query('SELECT * FROM companies');
        console.log("Companies:", companies.rows);

        const opps = await pool.query('SELECT id, title, company_id FROM opportunities');
        console.log("Opportunities:", opps.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkDb();
