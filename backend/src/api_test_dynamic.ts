import axios from 'axios';
import jwt from 'jsonwebtoken';
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

const JWT_SECRET = process.env.JWT_SECRET || 'aisha_secret_key_v1';
const API_URL = 'http://localhost:3000/api/v1';

async function runTest() {
    try {
        console.log("Fetching a valid company user and department...");
        const res = await pool.query(`
            SELECT u.id as user_id, u.email, u.role, c.id as company_id, d.id as dept_id
            FROM users u
            JOIN companies c ON u.id = c.user_id
            JOIN company_departments d ON c.id = d.company_id
            WHERE u.role = 'COMPANY'
            LIMIT 1
        `);

        if (res.rows.length === 0) {
            console.error("No valid test data found in DB!");
            return;
        }

        const { user_id, email, role, dept_id } = res.rows[0];
        console.log(`Testing with user: ${email}, dept: ${dept_id}`);

        console.log("Generating token...");
        const token = jwt.sign({ id: user_id, email, role }, JWT_SECRET, { expiresIn: '1h' });

        const payload = {
            title: "Dynamic Verification Test",
            description: "Programmatic check for 500 errors",
            requirements: "Consistency check",
            location: "Nairobi",
            type: "ATTACHMENT",
            stipend_amount: 10000,
            duration_months: 3,
            application_deadline: "2026-12-31",
            vacancies: 3,
            department_id: dept_id,
            student_payment_required: false,
            student_payment_amount: 0,
            start_date: "2026-06-01"
        };

        console.log("Sending POST request to /opportunities...");
        const response = await axios.post(`${API_URL}/opportunities`, payload, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("Response Status:", response.status);
        if (response.status === 201) {
            console.log("✅ Verification Successful: Opportunity Created successfully.");
        } else {
            console.log("Unexpected status:", response.status);
        }

    } catch (error: any) {
        if (error.response) {
            console.error("❌ API Error:", error.response.status, error.response.data);
        } else {
            console.error("❌ Request Error:", error.message);
        }
    } finally {
        await pool.end();
    }
}

runTest();
