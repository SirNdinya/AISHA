import request from 'supertest';
import app from '../app';
import pool from '../config/database';
import jwt from 'jsonwebtoken';

describe('Multitenancy and Sync Integration Tests', () => {
    let instA: any, instB: any;
    let userAId: string, userBId: string, studentId: string;
    let instAToken: string;

    const unique = Date.now().toString();

    beforeAll(async () => {
        // 1. Create two institutions
        const userARes = await pool.query("INSERT INTO users (email, password_hash, role, is_verified) VALUES ($1, 'pass', 'INSTITUTION', true) RETURNING id", [`admin_a_${unique}@test.com`]);
        const userBRes = await pool.query("INSERT INTO users (email, password_hash, role, is_verified) VALUES ($1, 'pass', 'INSTITUTION', true) RETURNING id", [`admin_b_${unique}@test.com`]);
        userAId = userARes.rows[0].id;
        userBId = userBRes.rows[0].id;

        const instARes = await pool.query("INSERT INTO institutions (user_id, name, code) VALUES ($1, 'Inst A', $2) RETURNING id", [userARes.rows[0].id, `INST-A-${unique}`]);
        const instBRes = await pool.query("INSERT INTO institutions (user_id, name, code) VALUES ($1, 'Inst B', $2) RETURNING id", [userBRes.rows[0].id, `INST-B-${unique}`]);

        instA = instARes.rows[0];
        instB = instBRes.rows[0];

        // 2. Initialize schemas
        await pool.query(`SELECT create_institution_schema($1, 'inst_a_${unique}')`, [instA.id]);
        await pool.query(`SELECT create_institution_schema($1, 'inst_b_${unique}')`, [instB.id]);

        // 3. Get schema names
        const schemaARes = await pool.query("SELECT schema_name FROM institutions WHERE id = $1", [instA.id]);
        instA.schema = schemaARes.rows[0].schema_name;

        // 4. Insert student records into isolated schemas
        await pool.query(`
            INSERT INTO ${instA.schema}.student_records (reg_number, full_name, course, year_of_study)
            VALUES ($1, 'John Doe A', 'Engineering', 3)
        `, [`REG-A-001-${unique}`]);

        // 5. Create student in main system (PENDING SYNC)
        const studentUserRes = await pool.query("INSERT INTO users (email, password_hash, role, is_verified) VALUES ($1, 'pass', 'STUDENT', true) RETURNING id, email, role", [`student_a_${unique}@test.com`]);
        const studentRes = await pool.query(`
            INSERT INTO students (user_id, admission_number, institution_id) 
            VALUES ($1, $2, $3) 
            RETURNING id
        `, [studentUserRes.rows[0].id, `REG-A-001-${unique}`, instA.id]);
        studentId = studentRes.rows[0].id;

        instAToken = jwt.sign(
            { id: userARes.rows[0].id, role: 'INSTITUTION', institution_id: instA.id },
            process.env.JWT_SECRET || 'aisha_secret_key_v1'
        );
    });

    afterAll(async () => {
        const pattern = `%${unique}@test.com`;
        // 1. Delete dependent records for all test-pattern users
        await pool.query("DELETE FROM document_hub WHERE owner_id IN (SELECT id FROM users WHERE email LIKE $1)", [pattern]);
        await pool.query("DELETE FROM students WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)", [pattern]);
        await pool.query("DELETE FROM institutions WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)", [pattern]);
        
        // 2. Drop schemas
        if (instA?.schema) await pool.query("DROP SCHEMA IF EXISTS " + instA.schema + " CASCADE");
        await pool.query(`DROP SCHEMA IF EXISTS inst_b_${unique} CASCADE`);
        
        // 3. Finally delete users
        await pool.query("DELETE FROM users WHERE email LIKE $1", [pattern]);
    });

    it('should maintain strict isolation between institutions', async () => {
        // Institution A should see their student
        const resA = await request(app)
            .get('/api/institutions/students')
            .set('Authorization', `Bearer ${instAToken}`);

        expect(resA.status).toBe(200);
        expect(resA.body.data.some((s: any) => s.reg_number === `REG-A-001-${unique}`)).toBe(true);

        // Verify that REG-A-001 is NOT in public students without sync yet
        const publicRes = await pool.query("SELECT first_name FROM students WHERE id = $1", [studentId]);
        expect(publicRes.rows[0].first_name).toBeNull();
    });

    it('should autonomously sync student profile on demand', async () => {
        // Trigger Sync via Backend Service logic (or route if implemented)
        const { InstitutionSyncService } = require('../services/InstitutionSyncService');
        await InstitutionSyncService.syncStudentProfile(studentId);

        const syncedRes = await pool.query("SELECT first_name, last_name, course_of_study, current_year, sync_status FROM students WHERE id = $1", [studentId]);
        expect(syncedRes.rows[0].first_name).toBe('John');
        expect(syncedRes.rows[0].last_name).toBe('Doe A');
        expect(syncedRes.rows[0].course_of_study).toBe('Engineering');
        expect(syncedRes.rows[0].current_year).toBe(3);
        expect(syncedRes.rows[0].sync_status).toBe('SYNCED');
    });
});
