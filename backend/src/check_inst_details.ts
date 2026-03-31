import pool from './config/database';

async function checkInstDetails() {
    try {
        const res = await pool.query("SELECT id, name, code, schema_name FROM institutions WHERE code = 'MMUST'");
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

checkInstDetails();
