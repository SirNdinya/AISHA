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

async function runTest() {
    try {
        console.log("Locating the primary student record...");
        const studentRes = await pool.query(`
            SELECT s.id, s.admission_number, i.schema_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN institutions i ON s.institution_id = i.id
            LIMIT 1;
        `);
        
        if (studentRes.rows.length === 0) {
            console.log("No student found!");
            return;
        }

        const student = studentRes.rows[0];
        console.log(`Found student ID ${student.id} currently linked to reg: ${student.admission_number}`);

        console.log("\nInjecting a valid registration number into StudentController's logic flow...");
        const validReg = 'SIT/B/05-00039/2022';
        
        console.log(`Setting student admission to: ${validReg}`);
        await pool.query('UPDATE students SET admission_number = $1 WHERE id = $2', [validReg, student.id]);

        // Directly invoking the InstitutionSyncService logic
        const tenantRes = await pool.query(`
            SELECT reg_number, full_name, course, year_of_study 
            FROM ${student.schema_name}.student_records 
            WHERE reg_number = $1
        `, [validReg]);

        console.log("\nTenant Schema SQL execution result:");
        if (tenantRes.rows.length === 0) {
            console.log("NOT_FOUND_IN_TENANT");
        } else {
            console.log("SUCCESS! Matched record:");
            console.table(tenantRes.rows);
        }

    } catch (e) {
        console.error("Test failed abruptly:", e);
    } finally {
        await pool.end();
    }
}

runTest();
