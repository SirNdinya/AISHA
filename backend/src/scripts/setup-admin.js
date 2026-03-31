
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Fix path to .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'saps_user',
    password: process.env.DB_PASSWORD || 'saps_password',
    database: process.env.DB_NAME || 'saps_db',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function setupAdmin() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Remove Dummy Data
        console.log('Removing dummy data...');
        const tables = [
            'messages', 'notifications', 'placements', 'payments', 'applications',
            'student_academic_records', 'student_units', 'student_learning_progress',
            'ai_conversations', 'assessments', 'audit_logs', 'logbook_entries',
            'system_broadcasts', 'learning_resources', 'document_hub',
            'document_verifications', 'opportunities',
            'company_departments', 'company_supervisors', 'departments',
            'institutions', 'schools', 'students', 'companies', 'users'
        ];

        await client.query(`TRUNCATE TABLE ${tables.join(', ')} CASCADE`);

        // 2. Create Admin User
        const email = 'admin@aisha.com';
        const password = 'PHPMyAdmin';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        console.log('Creating admin user...');
        const userRes = await client.query(`
            INSERT INTO users (email, password_hash, role, is_verified, is_active)
            VALUES ($1, $2, 'ADMIN', TRUE, TRUE)
            RETURNING id
        `, [email, passwordHash]);

        const userId = userRes.rows[0].id;
        console.log(`Admin user created with ID: ${userId}`);

        // Check for specific admin table if exists (some systems use a separate profile table)
        // From table list, we don't see an 'admins' table anymore (maybe it was deleted or I missed it)
        // I saw it referenced in my previous thought but it was not in the \dt list.

    } catch (err) {
        console.error('Setup Error:', err);
    } finally {
        await client.end();
    }
}

setupAdmin();
