const axios = require('axios');
const { Client } = require('pg');

const BACKEND_URL = 'http://localhost:3000';
const STUDENT_ID = '5e9d3147-a6a2-40ef-aa65-8ec5776fd307'; // Matthew

async function testResetAndPerf() {
    console.log("--- Starting Reset & Performance Verification ---");

    const client = new Client({
        connectionString: 'postgresql://saps_user:saps_password@localhost:5432/saps_db'
    });

    try {
        await client.connect();

        // 1. Setup baseline profile data
        console.log("1. Setting up baseline profile data (skills, interests, career)...");
        await client.query(`
            UPDATE students 
            SET career_path = 'AI Researcher',
                skills = '{"Python", "Neural Networks"}',
                interests = '{"Machine Learning"}',
                admission_number = 'VALID_ID_123'
            WHERE id = $1
        `, [STUDENT_ID]);

        // 2. Simulate Sync with an invalid format to trigger clear
        console.log("2. Simulating sync with INVALID admission number to trigger reset...");
        await client.query(`UPDATE students SET admission_number = 'INVALID_FORMAT!!!' WHERE id = $1`, [STUDENT_ID]);
        
        // This is where clearCachedInstitutionalData would be called in syncStudentProfile
        // Let's call the actual sync process or just check if it was triggered correctly via the controller.
        // Actually, let's hit the sync endpoint if possible, but since it requires institution schema setup,
        // we'll just check if the method works as expected when triggered.
        
        // Let's call the clearCachedInstitutionalData logic manually or hit the backend.
        // Since I've updated the code, I'll restart the backend and hit the sync.
    } catch (err) {
        console.error("Test setup error:", err.message);
    } finally {
        await client.end();
    }
}

async function verifyResetLogic() {
    const client = new Client({
        connectionString: 'postgresql://saps_user:saps_password@localhost:5432/saps_db'
    });
    await client.connect();
    
    console.log("3. Verifying if data was cleared in DB...");
    const res = await client.query('SELECT skills, interests, career_path FROM students WHERE id = $1', [STUDENT_ID]);
    const s = res.rows[0];
    
    if (s.skills.length === 0 && s.interests.length === 0 && s.career_path === null) {
        console.log("✅ Success: Profile was correctly wiped clean.");
    } else {
        console.log("❌ Failure: Profile data still exists.", s);
    }
    await client.end();
}

// We'll run this manually in parts or integrated.
// For now, let's just use the DB check.
testResetAndPerf();
setTimeout(verifyResetLogic, 2000); // Wait for potential async triggers
