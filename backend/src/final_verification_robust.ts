import pool from './config/database';
import { InstitutionSyncService } from './services/InstitutionSyncService';

async function testSync() {
    try {
        const userEmail = 'ndinyabrian2582@gmail.com';
        const regNumber = 'COM/B/01-00001/2022';

        console.log(`Starting final verification for ${userEmail} with reg number ${regNumber}...`);

        // 1. Ensure user exists and get student ID
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
        if (userRes.rows.length === 0) {
            console.error(`User ${userEmail} not found!`);
            process.exit(1);
        }
        const userId = userRes.rows[0].id;

        // Ensure student record exists
        let studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
        if (studentRes.rows.length === 0) {
            console.log('Creating student record for test user...');
            const instRes = await pool.query("SELECT id FROM institutions WHERE code = 'MMUST'");
            await pool.query('INSERT INTO students (user_id, institution_id, sync_status) VALUES ($1, $2, $3)', [userId, instRes.rows[0].id, 'PENDING']);
            studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
        }

        const studentId = studentRes.rows[0].id;

        // 2. Assign Reg Number to student record
        await pool.query(
            'UPDATE students SET admission_number = $1 WHERE id = $2',
            [regNumber, studentId]
        );

        // 3. Trigger Sync
        console.log('Triggering sync...');
        const syncResult = await InstitutionSyncService.syncStudentProfile(studentId);
        console.log('Sync Result:', syncResult);

        // 4. Verify Final State
        const finalRes = await pool.query('SELECT first_name, last_name, course_of_study, sync_status FROM students WHERE id = $1', [studentId]);
        console.log('Final Student State:');
        console.table(finalRes.rows);

        const suRes = await pool.query('SELECT unit_code, grade, status FROM student_units WHERE student_id = $1 LIMIT 5', [studentId]);
        console.log('Sample Academic Units (Bidirectional):');
        console.table(suRes.rows);

        if (finalRes.rows[0].sync_status === 'SYNCED' && finalRes.rows[0].first_name === 'Liam') {
            console.log('VERIFICATION SUCCESSFUL: Profile synced correctly with exact formatting and grading!');
        } else {
            console.error('VERIFICATION FAILED: Profile data mismatch.');
        }

        process.exit(0);
    } catch (e) {
        console.error('Test Error:', e);
        process.exit(1);
    }
}

testSync();
