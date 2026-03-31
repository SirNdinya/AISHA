import pool from './config/database';

async function checkInstitutions() {
    try {
        const res = await pool.query('SELECT id, name FROM institutions');
        console.log('Institutions in DB:');
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

checkInstitutions();
