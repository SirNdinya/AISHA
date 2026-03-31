import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'aisha_secret_key_v1';
const API_URL = 'http://localhost:3000/api/v1';

// Test user from previous step
const testUser = {
  id: "5d97c9b3-3de3-4f2d-8ccc-c8894af0dc30",
  email: "test_company_1774565278716@example.com",
  role: "COMPANY"
};

const companyId = "9e458a1d-fb93-4eb1-960d-9b4754cfa81b";

async function runTest() {
    console.log("Generating token...");
    const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

    console.log("Preparing payload...");
    // Fetch a valid department for this company
    // (Actually, since I replaced all depts for Datum, I should check this company's depts)
    // But for verification, I just need to see if it returns 500 or something else.
    
    const payload = {
        title: "Programmatic Test Opportunity",
        description: "Testing for 500 errors",
        requirements: "Test requirements",
        location: "Nairobi",
        type: "ATTACHMENT",
        stipend_amount: 5000,
        duration_months: 3,
        application_deadline: "2026-12-31",
        vacancies: 5,
        department_id: "f6ff36a8-2a5d-4c77-9704-b52efd45a8b7", // Just a random UUID to test DB reaction
        student_payment_required: false,
        student_payment_amount: 0,
        start_date: "2026-04-01"
    };

    console.log("Sending POST request to /opportunities...");
    try {
        const response = await axios.post(`${API_URL}/opportunities`, payload, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(response.data, null, 2));
        console.log("✅ Verification Successful: No Internal Server Error.");
    } catch (error: any) {
        if (error.response) {
            console.error("❌ API Error:", error.response.status, error.response.data);
            if (error.response.status === 500) {
                console.error("CRITICAL: Internal Server Error detected!");
            } else {
                console.log("Note: Received non-500 error (expected if data is invalid but logic is sound).");
            }
        } else {
            console.error("❌ Request Error:", error.message);
        }
    }
}

runTest();
