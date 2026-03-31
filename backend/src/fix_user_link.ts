import pool from './config/database';

async function fixUserLink() {
    try {
        const instRes = await pool.query("SELECT id FROM institutions WHERE code = 'MMUST' LIMIT 1");
        if (instRes.rows.length === 0) throw new Error('MMUST not found');
        const instId = instRes.rows[0].id;

        const userEmail = 'ndinyabrian2582@gmail.com';
        await pool.query("UPDATE users SET institution_id = $1 WHERE email = $2", [instId, userEmail]);
        await pool.query("UPDATE students SET institution_id = $1 WHERE user_id = (SELECT id FROM users WHERE email = $2)", [instId, userEmail]);

        console.log(`Successfully linked ${userEmail} to MMUST.`);
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

fixUserLink();
