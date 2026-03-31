const axios = require('axios');
const { Client } = require('pg');

const STUDENT_ID = '5e9d3147-a6a2-40ef-aa65-8ec5776fd307';

async function verifySequencing() {
    console.log("--- Starting AI Sequencing Verification ---");

    const client = new Client({
        connectionString: 'postgresql://saps_user:saps_password@localhost:5432/saps_db'
    });

    try {
        await client.connect();

        // 1. Manually trigger a "Sync & Analyze" simulation
        // (Since I can't easily trigger the full multi-tenant sync in CLI)
        console.log("1. Simulating Sync & Analyze Phase...");
        const mockAnalysis = {
            status: "EXCELLENT",
            strengths: ["Advanced Algorithms", "Neural Networks", "System Security"],
            recommendation: "Pursue high-level AI research roles.",
            insights: "Exceptional cognitive architectural capability in distributed systems.",
            detected_clusters: ["AI/ML", "Cybersecurity"]
        };

        await client.query('UPDATE students SET academic_analysis = $1 WHERE id = $2', [JSON.stringify(mockAnalysis), STUDENT_ID]);
        console.log("✅ Phase 1: academic_analysis stored in DB.");

        // 2. Verify AI Service uses this for matching
        console.log("2. Projecting Matching Speed (Phase 3 Simulation)...");
        // We'll hit the AI matching endpoint and check logs or response
        try {
            const start = Date.now();
            const response = await axios.get(`http://localhost:8001/api/matching/recommendations/${STUDENT_ID}`);
            const duration = Date.now() - start;
            
            console.log(`Matching took ${duration}ms.`);
            if (response.data.matches && response.data.matches.length > 0) {
                console.log("✅ Phase 3: Match results retrieved successfully.");
                console.log("Match Reasoning:", response.data.matches[0].reasoning);
                if (response.data.matches[0].reasoning.includes("pre-calculated")) {
                   console.log("✅ Success: Matching used pre-calculated academic analysis!");
                }
            }
        } catch (err) {
            console.error("AI Service Match Error:", err.message);
        }

    } catch (err) {
        console.error("Verification failed:", err.message);
    } finally {
        await client.end();
    }
}

verifySequencing();
