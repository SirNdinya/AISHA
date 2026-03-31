import pool from './config/database';

async function checkSchema() {
    try {
        const ar = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'student_academic_records'
        `);
        console.log('student_academic_records columns:');
        console.table(ar.rows);

        const su = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'student_units'
        `);
        console.log('student_units columns:');
        console.table(su.rows);

        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

checkSchema();
