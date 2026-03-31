import pool from './config/database';

const updateSchema = async () => {
    try {
        console.log('Updating payments table schema...');

        const queries = [
            `ALTER TABLE payments ADD COLUMN IF NOT EXISTS merchant_request_id VARCHAR(100);`,
            `ALTER TABLE payments ADD COLUMN IF NOT EXISTS checkout_request_id VARCHAR(100);`,
            `ALTER TABLE payments ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);`,
            `ALTER TABLE payments ADD COLUMN IF NOT EXISTS result_desc VARCHAR(255);`
        ];

        for (const query of queries) {
            await pool.query(query);
        }

        console.log('Schema updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
};

updateSchema();
