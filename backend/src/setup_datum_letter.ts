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

async function setupDatumRequirements() {
    try {
        console.log("Looking for Datum Limited Company...");
        const companyRes = await pool.query("SELECT id FROM companies WHERE name = 'Datum Limited Company'");
        
        if (companyRes.rows.length === 0) {
            console.log("Datum Limited Company not found. Run setup_company.ts first if needed.");
            return;
        }

        const companyId = companyRes.rows[0].id;
        console.log("Found Datum Company with ID:", companyId);

        const requirements = `1. Ensure you have a functional laptop configured with standard web development tools.
2. Adhere to the Datum corporate security protocols concerning source code and client data confidentiality.
3. Dress code is strictly business casual except on explicitly announced casual Fridays.
4. Report to the main headquarters on your first day for security badge issuance and onboarding orientation.`;

        const template = `Welcome to Datum Limited Company. By accepting this placement, you agree to abide by our industrial attachment policies, contributing directly to live production environments under supervision. Formal NDA documents must be signed upon arrival.`;

        console.log("Updating acceptance letter requirements and template...");
        await pool.query(`
            UPDATE companies 
            SET acceptance_letter_requirements = $1, 
                acceptance_letter_template = $2
            WHERE id = $3
        `, [requirements, template, companyId]);

        console.log("Successfully updated Datum Limited Company acceptance requirements!");

    } catch (e) {
        console.error("Error setting up Datum requirements:", e);
    } finally {
        await pool.end();
    }
}

setupDatumRequirements();
