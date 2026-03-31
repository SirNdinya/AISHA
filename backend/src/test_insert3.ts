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

async function runTest3() {
    try {
        console.log("Fetching a valid company ID...");
        const companyRes = await pool.query('SELECT id FROM companies LIMIT 1');
        if (companyRes.rows.length === 0) {
            console.log("No companies found in the database. Cannot test foreign key.");
            return;
        }
        const companyId = companyRes.rows[0].id;

        console.log("Fetching a valid department ID...");
        const deptRes = await pool.query('SELECT id FROM company_departments WHERE company_id = $1 LIMIT 1', [companyId]);
        const departmentId = deptRes.rows.length > 0 ? deptRes.rows[0].id : null;

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

        const values = [
            companyId,
            'Test Title',
            'Test Desc',
            'Test Reqs',
            'Nairobi',
            'ATTACHMENT',
            0,
            3,
            null, // application_deadline
            1, // vacancies
            {}, // auto_filter_config
            null, // scheduled_for
            departmentId,
            false,
            0,
            null // start_date
        ];

        console.log("Executing insert...");
        const result = await pool.query(query, values);
        console.log("Insert successful! ID:", result.rows[0].id);

        // Clean up
        await pool.query('DELETE FROM opportunities WHERE id = $1', [result.rows[0].id]);
        console.log("Cleaned up test opportunity.");

    } catch (e: any) {
        console.error("SQL Error Caught!");
        console.error("Message:", e.message);
        console.error("Detail:", e.detail);
        console.error("Hint:", e.hint);
        console.error("Position:", e.position);
    } finally {
        await pool.end();
    }
}

runTest3();
