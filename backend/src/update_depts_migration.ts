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
const newDepartments = [
    'Software Engineering',
    'Web Development',
    'Cyber Security',
    'Human Resource',
    'Networking',
    'Finance'
];

async function updateDepartments() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log(`Clearing existing departments for company ${companyId}...`);
        await client.query('DELETE FROM company_departments WHERE company_id = $1', [companyId]);

        console.log(`Inserting new departments...`);
        for (const dept of newDepartments) {
            await client.query(
                'INSERT INTO company_departments (company_id, name) VALUES ($1, $2)',
                [companyId, dept]
            );
        }

        await client.query('COMMIT');
        console.log("Departments updated successfully!");
    } catch (e: any) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

updateDepartments();
