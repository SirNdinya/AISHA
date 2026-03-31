import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'saps_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'saps_db',
    password: process.env.DB_PASSWORD || 'saps_password',
    port: parseInt(process.env.DB_PORT || '5432'),
});

const defaultPassword = 'password123';

async function createUser(email: string, role: string) {
    const passHash = await bcrypt.hash(defaultPassword, 10);
    const id = crypto.randomUUID();
    await pool.query(
        `INSERT INTO users (id, email, password_hash, role, is_verified) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, is_verified = TRUE
         RETURNING id`,
        [id, email, passHash, role, true]
    );
    const res = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    return res.rows[0].id;
}

async function main() {
    console.log('Creating hierarchical admins for MMUST...');
    try {
        await pool.query('BEGIN');

        // 1. MMUST Institution record
        const instRes = await pool.query("SELECT id FROM institutions WHERE code = 'MMUST'");
        if (instRes.rows.length === 0) throw new Error('MMUST not found');
        const instId = instRes.rows[0].id;

        // 2. Main Admin
        const mainAdminId = await createUser('admin_mmust@mmust.ac.ke', 'INSTITUTION');
        await pool.query('UPDATE institutions SET user_id = $1 WHERE id = $2', [mainAdminId, instId]);
        await pool.query('UPDATE users SET institution_id = $1 WHERE id = $2', [instId, mainAdminId]);
        console.log('Main Admin created and linked to MMUST.');

        // 3. School Coordinator (Computing)
        const schoolRes = await pool.query("SELECT id FROM schools WHERE code = 'SCI' AND institution_id = $1", [instId]);
        if (schoolRes.rows.length > 0) {
            const schoolId = schoolRes.rows[0].id;
            const coordinatorId = await createUser('coordinator_sci@mmust.ac.ke', 'SCHOOL_COORDINATOR');
            await pool.query('UPDATE schools SET user_id = $1 WHERE id = $2', [coordinatorId, schoolId]);
            await pool.query('UPDATE users SET institution_id = $1 WHERE id = $2', [instId, coordinatorId]);
            console.log('School Coordinator created and linked to School of Computing.');
        }

        // 4. Department Admin (Computer Science)
        const deptRes = await pool.query("SELECT id FROM departments WHERE code = 'COM' AND institution_id = $1", [instId]);
        if (deptRes.rows.length > 0) {
            const deptId = deptRes.rows[0].id;
            const deptAdminId = await createUser('admin_com@mmust.ac.ke', 'DEPARTMENT_ADMIN');
            await pool.query('UPDATE departments SET user_id = $1 WHERE id = $2', [deptAdminId, deptId]);
            await pool.query('UPDATE users SET institution_id = $1 WHERE id = $2', [instId, deptAdminId]);
            console.log('Department Admin created and linked to Computer Science Department.');
        }

        await pool.query('COMMIT');
        console.log('Hierarchical admin setup complete.');
    } catch (e) {
        await pool.query('ROLLBACK');
        console.error('Admin Setup Failed:', e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
