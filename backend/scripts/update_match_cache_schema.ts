import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function addCacheColumn() {
    try {
        console.log("Adding ai_match_cache column to students table...");
        await pool.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS ai_match_cache JSONB;
        `);
        console.log("Successfully added ai_match_cache column.");
    } catch (e) {
        console.error("Error migrating table:", e);
    } finally {
        await pool.end();
    }
}

addCacheColumn();
