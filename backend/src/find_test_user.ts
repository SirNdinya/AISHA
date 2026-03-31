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

async function findUser() {
    try {
        const res = await pool.query(`
            SELECT u.id as user_id, u.email, u.role, c.id as company_id 
            FROM users u
            JOIN companies c ON u.id = c.user_id
            WHERE u.role = 'COMPANY'
            LIMIT 1
        `);
        console.log(JSON.stringify(res.rows[0], null, 2));
    } catch (e: any) {
        console.error(e.message);
    } finally {
        await pool.end();
    }
}

findUser();
