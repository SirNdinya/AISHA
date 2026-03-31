const axios = require('axios');

async function verifyAI() {
    const AI_SERVICE_URL = 'http://localhost:8001';
    const STUDENT_ID = '5e9d3147-a6a2-40ef-aa65-8ec5776fd307';
    
    try {
        console.log(`Hitting AI service for student: ${STUDENT_ID}`);
        const response = await axios.get(`${AI_SERVICE_URL}/api/matching/recommendations/${STUDENT_ID}`);
        
        console.log("Response Status:", response.status);
        console.log("Matches Found:", response.data.matches?.length || 0);
        
        if (response.data.matches && response.data.matches.length > 0) {
            console.log("Top Match:", JSON.stringify(response.data.matches[0], null, 2));
        } else {
            console.log("No matches returned.");
        }
    } catch (e) {
        console.error("Error hitting AI service:", e.message);
        if (e.response) {
            console.log("Backend Error Body:", e.response.data);
        }
    }
}

verifyAI();
