import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'saps_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'saps_db',
    password: process.env.DB_PASSWORD || 'saps_password',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function setupLeadAdmin() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Searching for MMUST...');
        const instRes = await client.query("SELECT id, name FROM institutions WHERE name ILIKE '%Masinde Muliro%' LIMIT 1");

        if (instRes.rows.length === 0) {
            console.error('MMUST not found. Run populate_mmust.ts first.');
            process.exit(1);
        }

        const mmustId = instRes.rows[0].id;
        console.log(`Found MMUST with ID: ${mmustId}`);

        const leadEmail = 'brianookon@gmail.com';
        const defaultPassword = 'Claws@1234';
        const passHash = await bcrypt.hash(defaultPassword, 10);

        console.log(`Checking if ${leadEmail} exists...`);
        const userRes = await client.query("SELECT id FROM users WHERE email = $1", [leadEmail]);

        let userId;
        if (userRes.rows.length > 0) {
            userId = userRes.rows[0].id;
            console.log(`User ${leadEmail} already exists with ID: ${userId}. Updating role and institution.`);
            await client.query(
                "UPDATE users SET role = 'INSTITUTION', is_verified = TRUE, password_hash = $1 WHERE id = $2",
                [passHash, userId]
            );
        } else {
            console.log(`Creating new user ${leadEmail}...`);
            const insertRes = await client.query(
                "INSERT INTO users (email, password_hash, role, is_verified) VALUES ($1, $2, 'INSTITUTION', TRUE) RETURNING id",
                [leadEmail, passHash]
            );
            userId = insertRes.rows[0].id;
        }

        console.log(`Updating MMUST institution to point to user ${userId}...`);
        await client.query("UPDATE institutions SET user_id = $1 WHERE id = $2", [userId, mmustId]);

        // Also ensure user has institution_id set if that's a column in users
        // Let's check the schema if institution_id exists in users table
        const columnRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'institution_id'");
        if (columnRes.rows.length > 0) {
            console.log("Updating institution_id in users table...");
            await client.query("UPDATE users SET institution_id = $1 WHERE id = $2", [mmustId, userId]);
        }

        await client.query('COMMIT');
        console.log(`Successfully configured ${leadEmail} as MMUST Lead Admin.`);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Failed to setup lead admin.', e);
    } finally {
        client.release();
        await pool.end();
    }
}

setupLeadAdmin();
