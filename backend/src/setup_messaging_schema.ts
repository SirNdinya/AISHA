import pool from './config/database';

async function setupMessagingSchema() {
    const client = await pool.connect();
    try {
        console.log('Setting up messaging and notification tables...');

        // 1. messages table
        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
                receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                opportunity_id UUID,
                application_id UUID,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. notifications table
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'INFO',
                link VARCHAR(255),
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Messaging schema setup complete.');
        process.exit(0);
    } catch (e) {
        console.error('Schema Setup Error:', e);
        process.exit(1);
    } finally {
        client.release();
    }
}

setupMessagingSchema();
