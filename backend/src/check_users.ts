import pool from './config/database';

async function checkUsers() {
    try {
        const res = await pool.query("SELECT id, email, role FROM users WHERE role = 'COMPANY' ORDER BY created_at DESC LIMIT 5");
        console.log('Recent Companies in DB:');
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

checkUsers();
