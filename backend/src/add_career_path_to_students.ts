import pool from './config/database';

const addCareerPath = async () => {
    try {
        console.log('Adding career_path column to students table...');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS career_path TEXT;');
        console.log('Successfully added career_path column.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

addCareerPath();
