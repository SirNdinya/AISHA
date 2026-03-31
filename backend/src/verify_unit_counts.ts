import pool from './config/database';

async function verifyCounts() {
    try {
        const userEmail = 'ndinyabrian2582@gmail.com';
        const res = await pool.query('SELECT id FROM students WHERE user_id = (SELECT id FROM users WHERE email = $1)', [userEmail]);
        const studentId = res.rows[0].id;

        const arCount = await pool.query('SELECT COUNT(*) FROM student_academic_records WHERE student_id = $1', [studentId]);
        const suCount = await pool.query('SELECT COUNT(*) FROM student_units WHERE student_id = $1', [studentId]);

        console.log(`Student ID: ${studentId}`);
        console.log(`Academic Records (Completed): ${arCount.rows[0].count}`);
        console.log(`Total Units (Completed + Ongoing): ${suCount.rows[0].count}`);

        if (parseInt(arCount.rows[0].count) >= 28 && parseInt(suCount.rows[0].count) >= 35) {
            console.log('Unit counts verified successfully!');
        } else {
            console.warn('Unit counts do not match expected values.');
        }

        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

verifyCounts();
