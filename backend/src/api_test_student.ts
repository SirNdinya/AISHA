import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_to_a_secure_random_string_in_production';
const API_URL = 'http://127.0.0.1:3000/api/v1';

const testUser = {
  id: "444ef451-e885-4204-86e4-e819be9365f1",
  email: "ndinyabrian2582@gmail.com",
  role: "STUDENT"
};

async function runTest() {
    const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
    const payload = {
        skills: ["React", "Express"],
        career_path: "Software Engineer"
    };
    try {
        const response = await axios.patch(`${API_URL}/students/profile`, payload, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("Response Status:", response.status);
        console.log("✅ Verification Successful: No Internal Server Error.");
    } catch (error: any) {
        console.error("❌ API Error:", error.message, error.response?.data);
    }
}

runTest();
