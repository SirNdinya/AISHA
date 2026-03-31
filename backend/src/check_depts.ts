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

async function checkDepartments() {
    try {
        const companies = await pool.query('SELECT id, name FROM companies');
        console.log("Companies:", companies.rows);

        for (const company of companies.rows) {
            const depts = await pool.query('SELECT * FROM company_departments WHERE company_id = $1', [company.id]);
            console.log(`Departments for ${company.name} (${company.id}):`, depts.rows);
        }
    } catch (e: any) {
        console.error(e.message);
    } finally {
        await pool.end();
    }
}

checkDepartments();
