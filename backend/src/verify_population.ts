import pool from './config/database';

async function verify() {
    try {
        console.log('Verifying population for MMUST...');

        const schools = await pool.query('SELECT count(*) FROM schools');
        const depts = await pool.query('SELECT count(*) FROM departments');
        const students = await pool.query('SELECT count(*) FROM students');
        const units = await pool.query('SELECT count(*) FROM student_units');

        console.log(`- Schools: ${schools.rows[0].count}`);
        console.log(`- Departments: ${depts.rows[0].count}`);
        console.log(`- Students: ${students.rows[0].count}`);
        console.log(`- Student Units: ${units.rows[0].count}`);

        const sampleStudent = await pool.query(`
            SELECT admission_number, first_name, last_name, current_year 
            FROM students 
            LIMIT 1
        `);
        console.log('Sample Student:', sampleStudent.rows[0]);

        const unitStats = await pool.query(`
            SELECT status, count(*) 
            FROM student_units 
            WHERE student_id = (SELECT id FROM students LIMIT 1)
            GROUP BY status
        `);
        console.log('Unit Statuses for sample student:', unitStats.rows);

        process.exit(0);
    } catch (e) {
        console.error('Verification failed:', e);
        process.exit(1);
    }
}

verify();
