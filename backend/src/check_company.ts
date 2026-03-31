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
        const companies = await pool.query('SELECT id, name FROM companies LIMIT 1');
        console.log("Companies:", companies.rows);

        const depts = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'departments'
            );
        `);
        console.log("Departments table exists:", depts.rows[0].exists);

        if (depts.rows[0].exists) {
            const allDepts = await pool.query('SELECT * FROM departments LIMIT 5');
            console.log("Departments:", allDepts.rows);
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkDb();
