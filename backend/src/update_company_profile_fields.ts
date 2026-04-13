import pool from './config/database';

const updateCompanySchema = async () => {
    try {
        console.log('Updating companies table schema for advanced profiles...');

        const queries = [
            `ALTER TABLE companies ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;`,
            `ALTER TABLE companies ADD COLUMN IF NOT EXISTS acceptance_letter_template TEXT;`,
            // Ensure opportunities has the payment fields even if already added by other migrations
            `ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS student_payment_required BOOLEAN DEFAULT FALSE;`,
            `ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS student_payment_amount NUMERIC(10, 2) DEFAULT 0;`
        ];

        for (const query of queries) {
            await pool.query(query);
            console.log(`Executed: ${query.split(' ')[0]} ${query.split(' ')[1]}...`);
        }

        console.log('Company Profile schema updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating company schema:', error);
        process.exit(1);
    }
};

updateCompanySchema();
