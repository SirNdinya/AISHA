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

async function runTest2() {
    try {
        const query = `
            INSERT INTO opportunities (
                company_id, title, description, requirements, location, 
                type, stipend_amount, duration_months, 
                application_deadline, vacancies,
                auto_filter_config, scheduled_for,
                department_id,
                student_payment_required, student_payment_amount, start_date
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        `;

        // Using exactly what's parsed manually
        const values = [
            '6ce6b701-d7ec-449e-b8cc-aefbd3b0475b', // company_id
            'Frontend Dev', 'Test desc', 'Test req', 'Nairobi', 
            'ATTACHMENT', 0, 3, 
            null, 1, 
            {}, null, 
            null, // department_id
            false, 0, 
            null // start_date
        ];

        console.log("Running query with payload...");
        await pool.query(query, values);
        console.log("Success!");
    } catch (e: any) {
        console.error("SQL Error Code:", e.code);
        console.error("SQL Error Message:", e.message);
        console.error("SQL Detail:", e.detail);
    } finally {
        await pool.end();
    }
}

runTest2();
