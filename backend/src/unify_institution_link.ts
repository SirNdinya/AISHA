import pool from './config/database';

async function unifyInstitutionLink() {
    try {
        console.log('Adding institution_id to users table...');

        // Check if column exists first
        const checkCol = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'institution_id'
        `);

        if (checkCol.rows.length === 0) {
            await pool.query('ALTER TABLE users ADD COLUMN institution_id UUID REFERENCES institutions(id)');
            console.log('Added institution_id column to users.');
        } else {
            console.log('institution_id column already exists.');
        }

        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

unifyInstitutionLink();
