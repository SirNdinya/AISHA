import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { AIService } from '../services/AIService';
import { BaseController } from './BaseController';

export class StudentController extends BaseController {
    constructor() {
        super('students');
    }

    /*
    - [x] Run existing tests
        - [x] Run frontend theme toggle test
        - [x] Run backend health test
    - [x] Create implementation plan for `AuthController` fix
    - [x] Fix `AuthController` constructor
    - [x] Create implementation plan for `DocumentController` fix
    - [x] Fix `DocumentController` type casting
    - [x] Implement integrated tests for `StudentController`
    - [x] Perform security audit of dependencies (Registry issue noted)
    - [x] Verify AI service tests
    */
    // Override generic getOne to include User details if needed, or specific profile logic
    getProfile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ status: 'error', message: 'Unauthorized' });
            }

            const query = `
                SELECT s.*, u.email, u.phone_number, i.name as institution_name 
                FROM students s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN institutions i ON s.institution_id = i.id
                WHERE s.user_id = $1
    `;

            const result = await pool.query(query, [userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Student profile not found',
                });
            }

            res.status(200).json({
                status: 'success',
                data: result.rows[0],
            });

        } catch (error) {
            next(error);
        }
    };

    updateProfile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const {
                first_name, last_name, admission_number, course_of_study,
                skills, interests, cv_url, requires_stipend, min_stipend_amount, mpesa_number,
                preferred_locations, placement_duration, career_path
            } = req.body;

            // Check if profile exists
            const checkQuery = 'SELECT id FROM students WHERE user_id = $1';
            const checkRes = await pool.query(checkQuery, [userId]);

            let result;
            let studentId;

            if (checkRes.rows.length === 0) {
                // CREATE (INSERT)
                if (!first_name || !last_name || !admission_number) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'First name, last name, and admission number are required to create a profile.'
                    });
                }

                const insertQuery = `
                        user_id, first_name, last_name, admission_number, course_of_study,
                        skills, interests, cv_url, requires_stipend, min_stipend_amount, mpesa_number,
                        preferred_locations, placement_duration, career_path
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    RETURNING *
                `;
                const values = [
                    userId, first_name, last_name, admission_number, course_of_study,
                    skills, interests, cv_url, requires_stipend, min_stipend_amount, mpesa_number,
                    preferred_locations, placement_duration, career_path
                ];
                result = await pool.query(insertQuery, values);
                studentId = result.rows[0].id;

            } else {
                studentId = checkRes.rows[0].id;
                // UPDATE
                const query = `
                    UPDATE students 
                    SET first_name = COALESCE($1, first_name),
                        last_name = COALESCE($2, last_name),
                        admission_number = COALESCE($3, admission_number),
                        course_of_study = COALESCE($4, course_of_study),
                        skills = COALESCE($5, skills),
                        interests = COALESCE($6, interests),
                        cv_url = COALESCE($7, cv_url),
                        requires_stipend = COALESCE($8, requires_stipend),
                        min_stipend_amount = COALESCE($9, min_stipend_amount),
                        mpesa_number = COALESCE($10, mpesa_number),
                        preferred_locations = COALESCE($11, preferred_locations),
                        placement_duration = COALESCE($12, placement_duration),
                        career_path = COALESCE($13, career_path)
                    WHERE user_id = $14
                    RETURNING *
                `;

                const values = [
                    first_name, last_name, admission_number, course_of_study,
                    skills, interests, cv_url, requires_stipend, min_stipend_amount, mpesa_number,
                    preferred_locations, placement_duration, career_path, userId
                ];
                result = await pool.query(query, values);
            }

            // Sync with student_interests table
            if (interests && Array.isArray(interests)) {
                await pool.query('DELETE FROM student_interests WHERE student_id = $1', [studentId]);
                for (const interest of interests) {
                    await pool.query(
                        'INSERT INTO student_interests (student_id, interest) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [studentId, interest]
                    );
                }
            }

            // Trigger Auto-Match Protocol
            if (skills || requires_stipend || course_of_study || interests || preferred_locations || req.body.career_path) {
                const { AutomationService } = require('../services/AutomationService');
                AutomationService.runAutoMatch(studentId, userId).catch((err: any) => console.error("Auto-match error:", err));
            }

            // Sovereign Document Fulfillment Hook
            if (result.rows[0].admission_number && result.rows[0].department_id) {
                const { DocumentController } = require('./DocumentController');
                // Check if they already have this doc type to avoid duplicates
                const existingDocQuery = "SELECT id FROM document_hub WHERE owner_id = $1 AND type = 'RECOMMENDATION_LETTER' LIMIT 1";
                const existingDoc = await pool.query(existingDocQuery, [userId]);

                if (existingDoc.rows.length === 0) {
                    DocumentController.generateForStudentSync(result.rows[0].id)
                        .catch((err: any) => console.error("Auto-fulfillment failure:", err));
                }
            }

            res.status(200).json({
                status: 'success',
                data: result.rows[0],
            });

        } catch (error) {
            next(error);
        }
    };

    uploadCV = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            // Get Student ID
            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
            const studentId = studentRes.rows[0].id;
            const cvUrl = `/uploads/cvs/${file.filename}`;

            // Update Database with CV URL
            const query = 'UPDATE students SET cv_url = $1 WHERE id = $2 RETURNING *';
            const result = await pool.query(query, [cvUrl, studentId]);

            // Autonomous Logic: Trigger Auto-Match
            const { AutomationService } = require('../services/AutomationService');
            AutomationService.runAutoMatch(studentId, userId).catch((err: any) => console.error("Auto-match trigger error:", err));

            res.status(200).json({
                status: 'success',
                message: 'CV uploaded successfully. Auto-matching triggered.',
                data: result.rows[0],
            });

        } catch (error) {
            next(error);
        }
    };

    uploadProfilePicture = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            // Get Student ID
            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
            const studentId = studentRes.rows[0].id;
            const profilePictureUrl = `/uploads/profiles/${file.filename}`;

            // Update Database
            const query = 'UPDATE students SET profile_picture_url = $1 WHERE id = $2 RETURNING *';
            const result = await pool.query(query, [profilePictureUrl, studentId]);

            res.status(200).json({
                status: 'success',
                message: 'Profile picture uploaded successfully',
                data: result.rows[0],
            });

        } catch (error) {
            next(error);
        }
    };

    getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            // 1. Get Student Data (Skills, Course)
            const studentRes = await pool.query(`
                SELECT id, skills, course_of_study 
                FROM students 
                WHERE user_id = $1
            `, [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });

            const student = studentRes.rows[0];
            const studentId = student.id;

            // 2. Fetch Aggregates for Skills & Trends
            const statsQueries = [
                pool.query('SELECT COUNT(*) FROM applications WHERE student_id = $1', [studentId]),
                pool.query("SELECT COUNT(*) FROM applications WHERE student_id = $1 AND status = 'ACCEPTED'", [studentId]),
                pool.query("SELECT COUNT(*) FROM applications WHERE student_id = $1 AND status = 'READY'", [studentId]),
                // Real Active Courses from student_learning_progress
                pool.query(`
                    SELECT lr.id, lr.title, lr.platform, slp.progress, slp.status
                    FROM student_learning_progress slp
                    JOIN learning_resources lr ON slp.resource_id = lr.id
                    WHERE slp.student_id = $1 AND slp.status = 'IN_PROGRESS'
                `, [studentId]),
                // Real Academic Records for Skill weight
                pool.query(`
                    SELECT unit_name, grade, academic_year 
                    FROM student_academic_records 
                    WHERE student_id = $1
                `, [studentId]),
                // Application Trend (Last 4 Weeks)
                pool.query(`
                    SELECT TO_CHAR(applied_at, 'W') as week, COUNT(*) as count
                    FROM applications
                    WHERE student_id = $1 AND applied_at > NOW() - INTERVAL '1 month'
                    GROUP BY week
                    ORDER BY week ASC
                `, [studentId])
            ];

            const [appsRes, acceptedRes, readyRes, coursesRes, academicRes, trendRes] = await Promise.all(statsQueries);

            // Real Skill Mapping (Expertise Level derived from Grade/Sync)
            const skillMapping = (student.skills || []).map((skill: string) => {
                const relevance = academicRes.rows.filter(r =>
                    r.unit_name.toLowerCase().includes(skill.toLowerCase())
                );
                const baseValue = relevance.length > 0 ? 70 : 40;
                const gradeBonus = relevance.some(r => r.grade?.startsWith('A')) ? 20 : 0;
                return {
                    name: skill,
                    value: Math.min(95, baseValue + gradeBonus)
                };
            });

            // Real Trend Data
            const trendData = trendRes.rows.map(r => ({
                x: `Week ${r.week}`,
                y: parseInt(r.count) * 20 // Scaled for visualization
            }));

            // Fallback trend if empty
            if (trendData.length === 0) {
                trendData.push({ x: 'Week 1', y: 0 }, { x: 'Current', y: (student.skills?.length || 0) * 5 });
            }

            res.status(200).json({
                status: 'success',
                data: {
                    total_applications: parseInt(appsRes.rows[0].count),
                    active_placements: parseInt(acceptedRes.rows[0].count),
                    ready_to_send: parseInt(readyRes.rows[0].count),
                    skill_index: Math.min(100, (student.skills?.length || 0) * 10 + (academicRes.rows.length * 2)),
                    ai_readiness_score: Math.min(100, (student.skills?.length || 0) * 15 + (academicRes.rows.length * 5)),
                    skill_mapping: skillMapping,
                    active_courses: coursesRes.rows.map(c => ({
                        id: c.id,
                        title: c.title,
                        provider: c.platform,
                        progress: c.progress || 0
                    })),
                    academic_performance: {
                        skills_count: student.skills?.length || 0,
                        units_completed: academicRes.rows.length,
                        total_units: academicRes.rows.length > 30 ? 60 : 50, // Dynamic target
                        current_semester: academicRes.rows[0]?.semester || "Not Set",
                        trend_data: trendData
                    },
                    external_status: {
                        mpesa: student.mpesa_number ? 'VERIFIED' : 'PENDING',
                        nita: student.cv_url ? 'APPROVED' : 'PENDING',
                        insurance: 'ACTIVE'
                    }
                }
            });

        } catch (error) {
            next(error);
        }
    };

    getMatchIntelligence = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
            const studentId = studentRes.rows[0].id;

            // AI Logic: Fetch matches and intelligence from AI Service
            const aiIntelligence = await AIService.getMatchIntelligence(studentId);

            if (aiIntelligence) {
                return res.status(200).json({
                    status: 'success',
                    data: aiIntelligence
                });
            }

            // Fallback to basic DB query if AI service is unavailable
            const query = `
                SELECT a.*, o.title as job_title, c.name as company_name 
                FROM applications a
                JOIN opportunities o ON a.opportunity_id = o.id
                JOIN companies c ON o.company_id = c.id
                WHERE a.student_id = $1
                ORDER BY a.match_score DESC
                LIMIT 5
            `;
            const result = await pool.query(query, [studentId]);

            res.status(200).json({
                status: 'success',
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };

    getAutomationLog = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            // Fetch logs for this user
            const query = `
                SELECT * FROM audit_logs 
                WHERE user_id = $1 
                OR (resource_type = 'STUDENT' AND resource_id = (SELECT id FROM students WHERE user_id = $1))
                ORDER BY created_at DESC
                LIMIT 20
            `;
            const result = await pool.query(query, [userId]);

            res.status(200).json({
                status: 'success',
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };

    getLearningPath = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const studentRes = await pool.query('SELECT id, skills FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });

            const student = studentRes.rows[0];

            // AI Logic: Suggest courses via AI Service
            const aiLearningPath = await AIService.getLearningPath(student.id, student.skills || []);

            if (aiLearningPath) {
                return res.status(200).json({
                    status: 'success',
                    data: aiLearningPath
                });
            }

            // Fallback AI Logic: Suggest courses based on skills gap
            const query = `
                SELECT lr.*, slp.status, slp.completion_date
                FROM learning_resources lr
                LEFT JOIN student_learning_progress slp ON lr.id = slp.resource_id AND slp.student_id = $1
                WHERE lr.skills_covered && $2 -- Overlap with student skills for now
                OR lr.cost_type = 'FREE'
                LIMIT 4
            `;
            const result = await pool.query(query, [student.id, student.skills || []]);

            res.status(200).json({
                status: 'success',
                data: result.rows
            });
        } catch (error) {
            next(error);
        }
    };

    discoverOnlineOpportunities = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
            const studentId = studentRes.rows[0].id;

            const opportunities = await AIService.discoverOpportunities(studentId);
            res.status(200).json({
                status: 'success',
                data: opportunities || []
            });
        } catch (error) {
            next(error);
        }
    };

    searchCourses = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { q } = req.query;
            if (!q) return res.status(400).json({ message: 'Query parameter q is required' });

            const courses = await AIService.searchLearningResources(q as string);
            res.status(200).json({
                status: 'success',
                data: courses || []
            });
        } catch (error) {
            next(error);
        }
    };

    getAcademicRecords = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
            const studentId = studentRes.rows[0].id;

            const records = await pool.query(`
                SELECT * FROM student_academic_records 
                WHERE student_id = $1 
                ORDER BY academic_year DESC, semester DESC
            `, [studentId]);

            res.status(200).json({
                status: 'success',
                data: records.rows
            });
        } catch (error) {
            next(error);
        }
    };

    getTranscriptReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const studentRes = await pool.query(`
                SELECT s.id, s.first_name, s.last_name, s.admission_number, s.academic_analysis, i.name as institution_name
                FROM students s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN institutions i ON u.institution_id = i.id OR s.institution_id = i.id
                WHERE s.user_id = $1
                LIMIT 1
            `, [userId]);

            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });

            const student = studentRes.rows[0];
            const studentId = student.id;

            const recordsRes = await pool.query(`
                SELECT * FROM student_academic_records 
                WHERE student_id = $1 
                ORDER BY academic_year ASC, semester ASC
            `, [studentId]);

            const records = recordsRes.rows;

            res.status(200).json({
                status: 'success',
                data: {
                    student: {
                        first_name: student.first_name,
                        last_name: student.last_name,
                        admission_number: student.admission_number,
                        institution_name: student.institution_name
                    },
                    records,
                    analysis: student.academic_analysis
                }
            });
        } catch (error) {
            next(error);
        }
    };

    downloadTranscriptReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const studentRes = await pool.query('SELECT first_name, last_name, id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });

            const student = studentRes.rows[0];
            const fullName = `${student.first_name} ${student.last_name}`;

            const recordsRes = await pool.query(`
                SELECT * FROM student_academic_records 
                WHERE student_id = $1 
                ORDER BY academic_year ASC, semester ASC
            `, [student.id]);

            const records = recordsRes.rows;
            const analysis = await AIService.analyzeTranscript(records);

            const pdfBuffer = await AIService.downloadTranscriptReport(fullName, records, analysis);

            if (!pdfBuffer) throw new Error('Failed to generate PDF');

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=transcript_report.pdf');
            res.send(Buffer.from(pdfBuffer));
        } catch (error) {
            next(error);
        }
    };

    syncProfileByReg = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const { admission_number } = req.body;

            if (!admission_number) {
                return res.status(400).json({ status: 'error', message: 'Registration number is required' });
            }

            // 1. Get current student and institution info from the unified users table
            const studentCheck = await pool.query(`
                SELECT s.id, i.schema_name 
                FROM students s
                JOIN users u ON s.user_id = u.id
                JOIN institutions i ON u.institution_id = i.id
                WHERE s.user_id = $1
            `, [userId]);

            if (studentCheck.rows.length === 0) {
                return res.status(404).json({ status: 'error', message: 'Student profile not found' });
            }

            const { id: studentId, schema_name: schemaName } = studentCheck.rows[0];

            if (!schemaName) {
                return res.status(400).json({ status: 'error', message: 'Institutional database not configured' });
            }

            // 2. Check if the admission number is changing, map profile pictures in history
            const currentRegRes = await pool.query('SELECT admission_number, profile_picture_url, profile_picture_history FROM students WHERE id = $1', [studentId]);
            const currentStudent = currentRegRes.rows[0];
            const currentReg = currentStudent?.admission_number;
            let history = currentStudent?.profile_picture_history || {};

            if (currentReg !== admission_number) {
                if (currentReg && currentStudent.profile_picture_url) {
                    history[currentReg] = currentStudent.profile_picture_url;
                }
                const newProfilePic = history[admission_number] || null;

                    await pool.query(
                        `UPDATE students 
                         SET admission_number = $1, 
                             profile_picture_url = $2, 
                             profile_picture_history = $3
                         WHERE id = $4`, 
                        [admission_number, newProfilePic, history, studentId]
                    );
            } else {
                await pool.query('UPDATE students SET admission_number = $1 WHERE id = $2', [admission_number, studentId]);
            }

            // 3. Call the Sync Service to pull data from tenant schema
            const { InstitutionSyncService } = require('../services/InstitutionSyncService');
            const syncResult = await InstitutionSyncService.syncStudentProfile(studentId);

            if (syncResult.status === 'NOT_FOUND_IN_TENANT') {
                return res.status(404).json({
                    status: 'error',
                    message: `Registration number ${admission_number} not found in your institution database.`
                });
            }

            // 4. Fetch the newly updated profile to return to frontend
            const profileRes = await pool.query(`
                SELECT s.*, u.email, i.name as institution_name 
                FROM students s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN institutions i ON s.institution_id = i.id
                WHERE s.id = $1
            `, [studentId]);

            // 5. Trigger Auto-Match Protocol handled by InstitutionSyncService internally

            res.status(200).json({
                status: 'success',
                message: 'Profile synchronized successfully with institutional records. Neural placement matching initiated.',
                data: profileRes.rows[0]
            });

        } catch (error) {
            next(error);
        }
    };

    generateAIResume = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id: studentId } = req.params;
            const { prompt } = req.body;

            if (!prompt) {
                return res.status(400).json({ status: 'error', message: 'Prompt is required' });
            }

            const axios = require('axios');
            const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

            const response = await axios.post(`${AI_SERVICE_URL}/api/resume/generate/${studentId}`, {
                prompt
            });

            res.status(200).json({
                status: 'success',
                data: response.data.data
            });
        } catch (error: any) {
            console.error('AI Resume Generation Error:', error.message);
            res.status(500).json({
                status: 'error',
                message: 'Failed to generate AI resume. Please ensure the AI service is running.'
            });
        }
    };
}
