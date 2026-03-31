import { Pool } from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'saps_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'saps_db',
    password: process.env.DB_PASSWORD || 'saps_password',
    port: parseInt(process.env.DB_PORT || '5432'),
});

const schoolsToCreate = [
    { name: 'School of Computing and Informatics', code: 'SCI' },
    { name: 'School of Education', code: 'SOE' },
    { name: 'School of Engineering', code: 'SENG' },
];

const departmentsToCreate = [
    { name: 'Computer Science', code: 'COM', school: 'SCI' },
    { name: 'Information Technology', code: 'SIT', school: 'SCI' },
    { name: 'Cyber Security', code: 'CYB', school: 'SCI' },
    { name: 'Artificial Intelligence', code: 'AI', school: 'SCI' },
    { name: 'Education', code: 'SOE', school: 'SOE' },
    { name: 'Electrical Engineering', code: 'EEE', school: 'SENG' },
];

async function main() {
    try {
        await pool.connect();
        await pool.query('BEGIN');

        console.log('Ensuring MMUST exists...');

        // 1. Check if MMUST exists
        const mmustCheck = await pool.query("SELECT id FROM institutions WHERE code = 'MMUST'");
        let instId;

        if (mmustCheck.rows.length === 0) {
            instId = crypto.randomUUID();
            await pool.query(
                `INSERT INTO institutions (id, name, code, contact_person)
                 VALUES ($1, $2, $3, $4)`,
                [instId, 'Masinde Muliro University of Science and Technology', 'MMUST', 'Main Admin']
            );
            console.log('Created MMUST Institution.');
        } else {
            instId = mmustCheck.rows[0].id;
            console.log('MMUST already exists.');
        }

        // 2. Create Schools
        const schoolIdMap: Record<string, string> = {};
        for (const school of schoolsToCreate) {
            const sCheck = await pool.query("SELECT id FROM schools WHERE code = $1 AND institution_id = $2", [school.code, instId]);
            let sId;
            if (sCheck.rows.length === 0) {
                sId = crypto.randomUUID();
                await pool.query(
                    `INSERT INTO schools (id, institution_id, name, code, description)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [sId, instId, school.name, school.code, `School of ${school.name}`]
                );
                console.log(`Created School: ${school.name}`);
            } else {
                sId = sCheck.rows[0].id;
            }
            schoolIdMap[school.code] = sId;
        }

        // 3. Create Departments
        for (const dept of departmentsToCreate) {
            const dCheck = await pool.query("SELECT id FROM departments WHERE code = $1 AND institution_id = $2", [dept.code, instId]);
            if (dCheck.rows.length === 0) {
                const dId = crypto.randomUUID();
                const schoolId = schoolIdMap[dept.school];
                await pool.query(
                    `INSERT INTO departments (id, institution_id, school_id, name, code, description)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [dId, instId, schoolId, dept.name, dept.code, `Department of ${dept.name}`]
                );
                console.log(`Created Department: ${dept.name}`);
            }
        }

        await pool.query('COMMIT');
        console.log('Infrastructure population complete.');
    } catch (e) {
        await pool.query('ROLLBACK');
        console.error('Error:', e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
