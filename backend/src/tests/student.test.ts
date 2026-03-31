import request from 'supertest';
import app from '../app';
import pool from '../config/database';
import jwt from 'jsonwebtoken';

describe('StudentController Integration Tests', () => {
    let testUser: any;
    let testStudent: any;
    let studentToken: string;

    beforeAll(async () => {
        // 1. Create a Test User
        const userRes = await pool.query(`
            INSERT INTO users (email, password_hash, role, is_verified)
            VALUES ($1, $2, 'STUDENT', true)
            RETURNING id, email, role
        `, ['test_student@example.com', 'hashed_pass']);
        testUser = userRes.rows[0];

        // 2. Create a Student Profile
        const studentRes = await pool.query(`
            INSERT INTO students (user_id, first_name, last_name, admission_number, course_of_study)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [testUser.id, 'Test', 'Student', 'SAPS-TEST-001', 'Computer Science']);
        testStudent = studentRes.rows[0];

        // 3. Generate Token
        studentToken = jwt.sign(
            { id: testUser.id, role: testUser.role, email: testUser.email },
            process.env.JWT_SECRET || 'aisha_secret_key_v1',
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        // Cleanup
        await pool.query('DELETE FROM students WHERE user_id = $1', [testUser.id]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    });

    describe('GET /api/students/profile', () => {
        it('should return 401 if no token provided', async () => {
            const res = await request(app).get('/api/students/profile');
            expect(res.status).toBe(401);
        });

        it('should return student profile for authorized student', async () => {
            const res = await request(app)
                .get('/api/students/profile')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.first_name).toBe('Test');
            expect(res.body.data.admission_number).toBe('SAPS-TEST-001');
        });
    });

    describe('PATCH /api/students/profile', () => {
        it('should update student skills and gpa', async () => {
            const updateData = {
                first_name: 'UpdatedName',
                skills: ['Node.js', 'React']
            };

            const res = await request(app)
                .patch('/api/students/profile')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.first_name).toBe('UpdatedName');
        });
    });

    describe('GET /api/students/dashboard-stats', () => {
        it('should return dashboard stats for student', async () => {
            const res = await request(app)
                .get('/api/students/dashboard-stats')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('total_applications');
            expect(res.body.data).toHaveProperty('ai_readiness_score');
        });
    });
});
