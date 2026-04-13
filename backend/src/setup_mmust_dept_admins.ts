/**
 * setup_mmust_dept_admins.ts
 * 
 * Creates departmental admin accounts for MMUST (Masinde Muliro University of 
 * Science and Technology) and ensures all departments exist in the departments table.
 * 
 * Departments:
 * - COM: Computer Science
 * - SIT: School of Information Technology
 * - SOE: School of Education
 * 
 * Password for all admins: Claws@1234
 */

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

const DEFAULT_PASSWORD = 'Claws@1234';
const INSTITUTION_ID = 'f8dc46cc-f97c-4f6d-bc43-2b1a2a129d54';

const departments = [
    {
        code: 'COM',
        name: 'Department of Computer Science',
        email: 'admin.cs@mmust.ac.ke',
    },
    {
        code: 'SIT',
        name: 'School of Information Technology',
        email: 'admin.sit@mmust.ac.ke',
    },
    {
        code: 'SOE',
        name: 'School of Education',
        email: 'admin.soe@mmust.ac.ke',
    },
];

async function createOrUpdateUser(email: string, passwordHash: string): Promise<string> {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
        const userId = existing.rows[0].id;
        await pool.query(
            `UPDATE users SET role = 'DEPARTMENT_ADMIN', is_verified = TRUE, 
             password_hash = $1, institution_id = $2
             WHERE id = $3`,
            [passwordHash, INSTITUTION_ID, userId]
        );
        console.log(`  ↺ Updated existing user: ${email}`);
        return userId;
    }

    const userId = crypto.randomUUID();
    await pool.query(
        `INSERT INTO users (id, email, password_hash, role, is_verified, institution_id)
         VALUES ($1, $2, $3, 'DEPARTMENT_ADMIN', TRUE, $4)`,
        [userId, email, passwordHash, INSTITUTION_ID]
    );
    console.log(`  ✓ Created user: ${email}`);
    return userId;
}

async function ensureDepartment(code: string, name: string, userId: string): Promise<string> {
    const existing = await pool.query(
        'SELECT id FROM departments WHERE code = $1 AND institution_id = $2',
        [code, INSTITUTION_ID]
    );

    if (existing.rows.length > 0) {
        const deptId = existing.rows[0].id;
        await pool.query('UPDATE departments SET user_id = $1 WHERE id = $2', [userId, deptId]);
        console.log(`  ↺ Linked admin to existing department: ${name} (${code})`);
        return deptId;
    }

    const deptId = crypto.randomUUID();
    await pool.query(
        `INSERT INTO departments (id, institution_id, code, name, user_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [deptId, INSTITUTION_ID, code, name, userId]
    );
    console.log(`  ✓ Created department: ${name} (${code})`);
    return deptId;
}

async function main() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║        MMUST Departmental Admin Setup                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const instCheck = await pool.query('SELECT id, name FROM institutions WHERE id = $1', [INSTITUTION_ID]);
    if (instCheck.rows.length === 0) {
        console.error('❌ MMUST institution not found! Aborting.');
        await pool.end();
        process.exit(1);
    }
    console.log(`✅ Institution: ${instCheck.rows[0].name}\n`);

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    console.log(`🔐 Password hashed successfully.\n`);

    try {
        await pool.query('BEGIN');

        const results: { dept: string; email: string; deptId: string; userId: string }[] = [];

        for (const dept of departments) {
            console.log(`\n📁 Setting up: ${dept.name}`);
            const userId = await createOrUpdateUser(dept.email, passwordHash);
            const deptId = await ensureDepartment(dept.code, dept.name, userId);
            results.push({ dept: dept.name, email: dept.email, deptId, userId });
        }

        await pool.query('COMMIT');

        console.log('\n\n══════════════════════════════════════════════════════════════');
        console.log('  ✅ ALL DEPARTMENTAL ADMINS CREATED SUCCESSFULLY');
        console.log('══════════════════════════════════════════════════════════════\n');

        console.log('📋 Login Credentials Summary:');
        console.log('─────────────────────────────────────────────────────────────');
        for (const r of results) {
            console.log(`  Department : ${r.dept}`);
            console.log(`  Login Email: ${r.email}`);
            console.log(`  Password   : ${DEFAULT_PASSWORD}`);
            console.log(`  User ID    : ${r.userId}`);
            console.log(`  Dept ID    : ${r.deptId}`);
            console.log('─────────────────────────────────────────────────────────────');
        }

    } catch (e) {
        await pool.query('ROLLBACK');
        console.error('\n❌ Setup Failed:', e);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
