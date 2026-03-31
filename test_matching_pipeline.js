const axios = require('axios');

async function testMatchPipeline() {
    try {
        console.log("Authenticating test student...");
        const authRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'ndinyabrian2582@gmail.com',
            password: 'password123'
        });
        
        const token = authRes.data.token;
        console.log("Got token:", token.substring(0, 20) + "...");
        
        console.log("Triggering profile sync to run AI matching...");
        const syncRes = await axios.post('http://localhost:3000/api/students/sync-profile', {
            admission_number: 'COM/B/01-00004/2022'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Sync Response:", syncRes.data);
        
        console.log("Checking for autonomous placement matches (AI intelligence)...");
        const matchRes = await axios.get('http://localhost:3000/api/students/match-intelligence', {
             headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Matches:", JSON.stringify(matchRes.data, null, 2));

        console.log("Checking if notification was created...");
        const notifRes = await axios.get('http://localhost:3000/api/notifications', {
             headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Recent Notification:", JSON.stringify(notifRes.data.data?.[0], null, 2));

    } catch (e) {
        if (e.response) {
            console.error("API Error:", e.response.status, e.response.data);
        } else {
            console.error("Error:", e);
        }
    }
}

testMatchPipeline();
