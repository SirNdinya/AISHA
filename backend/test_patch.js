const fetch = require('node-fetch');

(async () => {
    // 1. First login to get a token
    const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 's.mccall@students.strathmore.edu', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token || loginData.data?.token;
    
    if (!token) {
        console.error('Failed to login:', loginData);
        return;
    }

    // 2. Try patching the profile
    const patchRes = await fetch('http://localhost:3000/api/v1/students/profile', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skills: ['React', 'Node'], career_path: 'Test Path' })
    });
    const text = await patchRes.text();
    console.log('STATUS:', patchRes.status);
    console.log('RESPONSE:', text);
})();
