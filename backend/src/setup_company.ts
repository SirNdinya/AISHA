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

async function setupCompany() {
    try {
        const users = await pool.query("SELECT id FROM users WHERE role = 'COMPANY' LIMIT 1");
        if (users.rows.length === 0) {
            console.log("No company user found.");
            return;
        }
        const userId = users.rows[0].id;
        console.log("Found company user_id:", userId);

        let companyRes = await pool.query('SELECT id FROM companies WHERE user_id = $1', [userId]);
        let companyId;
        
        if (companyRes.rows.length === 0) {
            console.log("Inserting Datum Limited Company...");
            const insertComp = await pool.query(`
                INSERT INTO companies (user_id, name, location)
                VALUES ($1, 'Datum Limited Company', 'Nairobi')
                RETURNING id
            `, [userId]);
            companyId = insertComp.rows[0].id;
        } else {
            console.log("Updating name to Datum Limited Company...");
            companyId = companyRes.rows[0].id;
            await pool.query("UPDATE companies SET name = 'Datum Limited Company' WHERE id = $1", [companyId]);
        }
        console.log("Company ID:", companyId);

        // Delete existing departments for clean slate
        await pool.query('DELETE FROM company_departments WHERE company_id = $1', [companyId]);

        const depts = [
            'Front end team',
            'backend',
            'security',
            'human resource',
            'public relation'
        ];

        console.log("Inserting departments...");
        for (const dept of depts) {
            await pool.query(`
                INSERT INTO company_departments (company_id, name, created_at)
                VALUES ($1, $2, NOW())
            `, [companyId, dept]);
        }

        console.log("Setup complete!");

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

setupCompany();
