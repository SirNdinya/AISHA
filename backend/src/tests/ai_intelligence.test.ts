import pool from '../config/database';
import { DocumentIntelligenceService } from '../services/DocumentIntelligenceService';

describe('Document Intelligence Service Tests', () => {
    let testInst: any, testStudent: any, testDoc: any;

    beforeAll(async () => {
        // Setup Institution and Student
        const userRes = await pool.query("INSERT INTO users (email, password_hash, role, is_verified) VALUES ('ai_test_user@test.com', 'pass', 'INSTITUTION', true) RETURNING id");
        const instRes = await pool.query("INSERT INTO institutions (user_id, name, code) VALUES ($1, 'AI Test Inst', 'AI-TEST') RETURNING id", [userRes.rows[0].id]);
        testInst = instRes.rows[0];

        const studentUserRes = await pool.query("INSERT INTO users (email, password_hash, role, is_verified) VALUES ('ai_student@test.com', 'pass', 'STUDENT', true) RETURNING id");
        const studentRes = await pool.query(`
            INSERT INTO students (user_id, first_name, last_name, admission_number, institution_id, course_of_study, current_year)
            VALUES ($1, 'AI', 'Student', 'AI-REG-001', $2, 'AI Ethics', 4)
            RETURNING id
        `, [studentUserRes.rows[0].id, testInst.id]);
        testStudent = studentRes.rows[0];

        // Create a document in hub
        const docRes = await pool.query(`
            INSERT INTO document_hub (owner_id, type, file_url, status, digital_signature)
            VALUES ($1, 'NITA_FORM', 'https://example.com/nita.pdf', 'PENDING', 'AISHA_SOVEREIGN_V3_TEST_SIG')
            RETURNING id
        `, [studentUserRes.rows[0].id]);
        testDoc = docRes.rows[0];
    });

    afterAll(async () => {
        await pool.query("DELETE FROM document_hub WHERE id = $1", [testDoc.id]);
        await pool.query("DELETE FROM students WHERE id = $1", [testStudent.id]);
        await pool.query("DELETE FROM institutions WHERE id = $1", [testInst.id]);
        await pool.query("DELETE FROM users WHERE email LIKE 'ai_%@test.com'");
    });

    it('should auto-fill document metadata from student profile', async () => {
        await DocumentIntelligenceService.autoFillForm(testDoc.id, testStudent.id);

        const updatedDoc = await pool.query("SELECT metadata, status, is_auto_generated FROM document_hub WHERE id = $1", [testDoc.id]);
        expect(updatedDoc.rows[0].status).toBe('VERIFIED');
        expect(updatedDoc.rows[0].is_auto_generated).toBe(true);
        expect(updatedDoc.rows[0].metadata.personal_info.full_name).toBe('AI Student');
        expect(updatedDoc.rows[0].metadata.academic_info.course).toBe('AI Ethics');
    });

    it('should verify document and create verification report', async () => {
        const result = await DocumentIntelligenceService.verifyDocument(testDoc.id, 'https://example.com/upload.pdf');

        expect(result.is_valid).toBe(true);
        expect(result.confidence).toBe(0.99);

        const verRes = await pool.query("SELECT * FROM document_verifications WHERE document_id = $1", [testDoc.id]);
        expect(verRes.rows.length).toBe(1);
        expect(verRes.rows[0].verified_by_ai).toBe(true);
        expect(Number(verRes.rows[0].ai_confidence)).toBe(99);
    });
});
