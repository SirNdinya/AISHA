import pool from './config/database';

async function fixNotificationsType() {
    const client = await pool.connect();
    try {
        console.log('Adding "type" column to notifications table...');
        await client.query(`
            ALTER TABLE notifications 
            ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'INFO';
        `);
        console.log('Column added successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Migration Error:', e);
        process.exit(1);
    } finally {
        client.release();
    }
}

fixNotificationsType();
