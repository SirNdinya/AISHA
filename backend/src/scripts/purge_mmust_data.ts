import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'saps_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'saps_db',
    password: process.env.DB_PASSWORD || 'saps_password',
    port: parseInt(process.env.DB_PORT || '5432'),
});

const MMUST_INST_ID = 'f8dc46cc-f97c-4f6d-bc43-2b1a2a129d54';

async function main() {
    console.log(`[PURGE] Starting MMUST Data Cleanup (Institution ID: ${MMUST_INST_ID})`);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Identify MMUST Students
        const studentRes = await client.query('SELECT id FROM students WHERE institution_id = $1', [MMUST_INST_ID]);
        const studentIds = studentRes.rows.map(r => r.id);

        if (studentIds.length === 0) {
            console.log('[PURGE] No students found for MMUST. Proceeding with Opportunity reset only.');
        } else {
            const studentIdList = studentIds.map(id => `'${id}'`).join(',');
            console.log(`[PURGE] Found ${studentIds.length} students. Cleaning up records...`);

            // 2. Delete Dependent Student Data (Order matters for manual deletes, Cascades handle balance)
            // Payments link to students
            await client.query(`DELETE FROM payments WHERE student_id IN (${studentIdList})`);
            
            // Placements link to students and cascade to assessments, logbooks
            await client.query(`DELETE FROM placements WHERE student_id IN (${studentIdList})`);
            
            // Applications link to students
            await client.query(`DELETE FROM applications WHERE student_id IN (${studentIdList})`);
            
            // Platform preferences and progress
            await client.query(`DELETE FROM student_interests WHERE student_id IN (${studentIdList})`);
            await client.query(`DELETE FROM student_learning_progress WHERE student_id IN (${studentIdList})`);
            
            // Document hub links to user_id
            await client.query(`DELETE FROM document_hub WHERE owner_id IN (SELECT user_id FROM students WHERE id IN (${studentIdList}))`);
            
            // Cached academic data
            await client.query(`DELETE FROM student_academic_records WHERE student_id IN (${studentIdList})`);
            await client.query(`DELETE FROM student_units WHERE student_id IN (${studentIdList})`);
            
            console.log('[PURGE] Student-specific records deleted.');
        }

        // 3. Reset ALL Opportunities (Global reset per user request)
        console.log('[PURGE] Resetting all opportunities to original vacancy levels...');
        await client.query('UPDATE opportunities SET positions_available = vacancies');

        await client.query('COMMIT');
        console.log('[PURGE] SUCCESS: Data cleanup and opportunity reset complete.');

    } catch (e: any) {
        await client.query('ROLLBACK');
        console.error('[PURGE] FAILED:', e.message);
    } finally {
        client.release();
        await pool.end();
        process.exit(0);
    }
}

main();
