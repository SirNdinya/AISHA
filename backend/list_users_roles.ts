import pool from './src/config/database';

async function listUsers() {
    try {
        const countRes = await pool.query('SELECT COUNT(*) FROM users');
        console.log(`Total Users: ${countRes.rows[0].count}`);

        const usersRes = await pool.query(`
            SELECT u.email, u.role, u.is_verified, u.is_active, 
                   i.name as institution_name
            FROM users u
            LEFT JOIN institutions i ON u.institution_id = i.id
            ORDER BY u.created_at DESC
        `);
        console.log('\nUser List:');
        console.table(usersRes.rows);

        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

listUsers();
