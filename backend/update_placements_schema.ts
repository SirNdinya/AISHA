
import pool from './src/config/database';

async function updatePlacementsSchema() {
    try {
        console.log('Updating placements table schema...');
        await pool.query(`
            ALTER TABLE placements 
            ADD COLUMN IF NOT EXISTS feedback JSONB DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS certificate_url VARCHAR(255) DEFAULT NULL;
        `);
        console.log('Placements table schema updated.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating placements table schema:', err);
        process.exit(1);
    }
}

updatePlacementsSchema();
