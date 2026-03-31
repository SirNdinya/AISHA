import pool from './config/database';

async function checkStudentSource() {
    try {
        // 1. Find the schema name for MMUST
        const instRes = await pool.query("SELECT schema_name FROM institutions WHERE code = 'MMUST'");
        const schemaName = instRes.rows[0]?.schema_name;

        if (!schemaName) {
            console.log('No institutional schema found for MMUST');
            process.exit(0);
        }

        console.log(`MMUST Schema: ${schemaName}`);

        // 2. Count records in that schema
        const countRes = await pool.query(`SELECT COUNT(*) FROM ${schemaName}.student_records`);
        console.log(`Total students in ${schemaName}.student_records: ${countRes.rows[0].count}`);

        // 3. Show some sample records
        const sampleRes = await pool.query(`SELECT reg_number, full_name, course FROM ${schemaName}.student_records LIMIT 5`);
        console.log('Sample Records:');
        console.table(sampleRes.rows);

        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

checkStudentSource();
