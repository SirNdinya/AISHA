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

async function fixForeignKey() {
    try {
        console.log("Fixing the department foreign key on opportunities...");
        
        // Drop the old constraint if it exists. Postgres names them by default as tablename_columnname_fkey
        await pool.query(`
            ALTER TABLE opportunities 
            DROP CONSTRAINT IF EXISTS opportunities_department_id_fkey;
        `);
        
        // Add the correct constraint pointing to company_departments
        await pool.query(`
            ALTER TABLE opportunities 
            ADD CONSTRAINT opportunities_company_department_id_fkey 
            FOREIGN KEY (department_id) 
            REFERENCES company_departments(id) 
            ON DELETE SET NULL;
        `);

        console.log("Foreign key constraint updated successfully!");
    } catch (e: any) {
        console.error("Migration failed:");
        console.error(e.message);
    } finally {
        await pool.end();
    }
}

fixForeignKey();
