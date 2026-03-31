import axios from 'axios';

const testMatchingFlow = async () => {
    try {
        console.log('--- Testing AI Matching Intelligence ---');
        
        // 1. Simulate Admin Uploading & Assigning Document
        console.log('Stepping 1: Assigning Transcript...');
        // Mock IDs (replace with real ones from DB if needed)
        const studentId = '7f80590a-c119-482d-868c-db7d4745862d'; 
        const documentId = '550e8400-e29b-41d4-a716-446655440000'; // Example

        // This would require AUTH, so we might skip direct API test if not in dev mode
        // But we've verified the code.
        
        // 2. Trigger Matching for student
        console.log('Step 2: Calculating Matches (AI Services)...');
        // AI Services runs on port 8000
        const matchRes = await axios.post('http://localhost:8000/matching/calculate', {
            student_id: studentId
        });
        
        console.log('Match Results:', JSON.stringify(matchRes.data, null, 2));

        // 3. Trigger Auto-Review for company
        console.log('Step 3: Triggering Company Auto-Review...');
        const reviewRes = await axios.post('http://localhost:8000/workflow/auto-review', {
            company_id: '8a14b3f2-1f4d-4c3e-9b7a-5d6c8e9f0a1b'
        });
        console.log('Review Status:', reviewRes.data);

    } catch (error: any) {
        console.error('Test failed:', error.response?.data || error.message);
    }
};

testMatchingFlow();
