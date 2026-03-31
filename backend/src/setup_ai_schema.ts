import pool from './config/database';

async function setupAISchema() {
    const client = await pool.connect();
    try {
        console.log('Setting up AI playground tables...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS ai_conversations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
                content TEXT NOT NULL,
                context JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id);
        `);

        console.log('AI schema setup complete.');
        process.exit(0);
    } catch (e) {
        console.error('Schema Setup Error:', e);
        process.exit(1);
    } finally {
        client.release();
    }
}

setupAISchema();
