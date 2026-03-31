import pool from './config/database';
import { InstitutionSyncService } from './services/InstitutionSyncService';

async function testSync() {
    try {
        const userEmail = 'ndinyabrian2582@gmail.com';
        const regNumber = 'COM/B/01-00001/2022';

        console.log(`Starting final verification for ${userEmail} with reg number ${regNumber}...`);

        // 1. Assign Reg Number to student record
        const studentRes = await pool.query(
            'UPDATE students SET admission_number = $1 WHERE user_id = (SELECT id FROM users WHERE email = $2) RETURNING id',
            [regNumber, userEmail]
        );
        const studentId = studentRes.rows[0].id;

        // 2. Trigger Sync
        console.log('Triggering sync...');
        const syncResult = await InstitutionSyncService.syncStudentProfile(studentId);
        console.log('Sync Result:', syncResult);

        // 3. Verify Final State
        const finalRes = await pool.query('SELECT first_name, last_name, course_of_study, sync_status FROM students WHERE id = $1', [studentId]);
        console.log('Final Student State:');
        console.table(finalRes.rows);

        if (finalRes.rows[0].sync_status === 'SYNCED' && finalRes.rows[0].first_name === 'Liam') {
            console.log('VERIFICATION SUCCESSFUL: Profile synced correctly from inst_mmust schema!');
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
