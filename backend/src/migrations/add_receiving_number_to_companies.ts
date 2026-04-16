import pool from '../config/database';

const migrate = async () => {
    try {
        console.log('Adding receiving_phone_number and representative_phone to companies table...');
        
        const queries = [
            `ALTER TABLE companies ADD COLUMN IF NOT EXISTS receiving_phone_number VARCHAR(20);`,
            `ALTER TABLE companies ADD COLUMN IF NOT EXISTS representative_phone VARCHAR(20);`
        ];

        for (const query of queries) {
            await pool.query(query);
            console.log(`Executed: ${query}`);
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
