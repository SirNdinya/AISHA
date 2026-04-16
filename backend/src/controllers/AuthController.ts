import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database';
import { BaseController } from './BaseController';
import { emailService } from '../services/EmailService';
import { InstitutionSyncService } from '../services/InstitutionSyncService';

export class AuthController extends BaseController {
    constructor() {
        super('users');
    }

    /**
     * Authenticates a user and returns a JWT token.
     */
    login = async (req: Request, res: Response) => {
        const { email, password } = req.body;

        try {
            // 1. Find user by email with context join
            const userQuery = `
                SELECT 
                    u.*,
                    i.is_admin_verified,
                    COALESCE(u.institution_id, i.id, d.institution_id, s.institution_id) as institution_id,
                    COALESCE(s.department_id, d.id) as department_id,
                    (SELECT user_id FROM institutions WHERE id = COALESCE(u.institution_id, i.id, d.institution_id, s.institution_id) LIMIT 1) as institution_admin_id
                FROM users u
                LEFT JOIN institutions i ON u.id = i.user_id AND u.role = 'INSTITUTION'
                LEFT JOIN departments d ON u.id = d.user_id AND u.role = 'DEPARTMENT_ADMIN'
                LEFT JOIN students s ON u.id = s.user_id AND u.role = 'STUDENT'
                WHERE u.email = $1
            `;
            const userResult = await pool.query(userQuery, [email]);

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Email not registered. Please sign up first.'
                });
            }

            const user = userResult.rows[0];

            // 2. Check if verified and active
            if (!user.is_verified) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Please verify your email address before logging in.'
                });
            }

            if (user.role === 'INSTITUTION' && !user.is_admin_verified) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Your account is pending verification by the AISHA administrator. You will be able to log in once approved.'
                });
            }

            if (user.is_active === false) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Account disabled, contact admin..'
                });
            }

            // 2. Verify password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // 3. Generate JWT
            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.role,
                    email: user.email,
                    institution_id: user.institution_id,
                    department_id: user.department_id
                },
                process.env.JWT_SECRET || 'aisha_secret_key_v1',
                { expiresIn: '24h' }
            );

            // 4. Update last login
            await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

            // 5. Response
            res.status(200).json({
                status: 'success',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    institutionId: user.institution_id,
                    departmentId: user.department_id,
                    institutionAdminId: user.institution_admin_id
                }
            });

        } catch (error: any) {
            console.error('Login Error:', error.message);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    /**
     * Registers a new user.
     */
    register = async (req: Request, res: Response) => {
        const { email, password, role } = req.body;

        try {
            // 1. Check if user exists
            const checkQuery = 'SELECT id FROM users WHERE email = $1';
            const checkRes = await pool.query(checkQuery, [email]);
            if (checkRes.rows.length > 0) {
                return res.status(400).json({ message: 'Email already in use' });
            }

            // 2. Validate Institution for Students
            let targetInstitutionId = req.body.institution_id;
            const targetInstitutionName = req.body.institution?.trim();

            if (role === 'STUDENT') {
                if (!targetInstitutionId && targetInstitutionName) {
                    const instRes = await pool.query('SELECT id FROM institutions WHERE name ILIKE $1 LIMIT 1', [`%${targetInstitutionName}%`]);
                    if (instRes.rows.length > 0) {
                        targetInstitutionId = instRes.rows[0].id;
                    }
                }

                if (!targetInstitutionId) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'The university/institution you entered is not registered in our system. Please contact your administrator to register the university first.'
                    });
                }
            }

            // 3. Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 4. Generate verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');

            const createQuery = `
                INSERT INTO users (email, password_hash, role, verification_token, is_verified, institution_id)
                VALUES ($1, $2, $3, $4, FALSE, $5)
                RETURNING id, email, role, institution_id
            `;

            const result = await pool.query(createQuery, [email, hashedPassword, role, verificationToken, targetInstitutionId || null]);
            const userId = result.rows[0].id;

            // 5a. Create Institution Profile
            if (role === 'INSTITUTION') {
                const name = targetInstitutionName || email.split('@')[0] + ' Institution';
                const codeChars = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'INS';
                const randomDigits = Math.floor(1000 + Math.random() * 9000);
                const generatedCode = `${codeChars}-${randomDigits}`;

                const createInstQuery = `
                    INSERT INTO institutions (user_id, name, code)
                    VALUES ($1, $2, $3)
                    RETURNING id
                `;
                const instResult = await pool.query(createInstQuery, [userId, name, generatedCode]);
                await pool.query('UPDATE users SET institution_id = $1 WHERE id = $2', [instResult.rows[0].id, userId]);
            }

            // 5b. Create Company Profile
            if (role === 'COMPANY') {
                const companyName = req.body.name || `Company - ${email.split('@')[0]}`;
                const location = req.body.location || 'Remote/Not Specified';
                const createCompanyQuery = `
                    INSERT INTO companies (user_id, name, location)
                    VALUES ($1, $2, $3) RETURNING id
                `;
                await pool.query(createCompanyQuery, [userId, companyName, location]);
            }

            // 5c. Create Student Profile
            if (role === 'STUDENT') {
                const { admission_number } = req.body;
                const studentInstitutionId = result.rows[0].institution_id;

                if (!admission_number) {
                    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
                    return res.status(400).json({ message: 'Registration number is required.' });
                }

                // 1. Get Schema Name for the selected institution
                const schemaRes = await pool.query('SELECT schema_name FROM institutions WHERE id = $1', [studentInstitutionId]);
                const schemaName = schemaRes.rows[0]?.schema_name;

                // 2. Check if student is pre-loaded in public.students
                const studentCheckQuery = 'SELECT id, user_id FROM students WHERE admission_number = $1 AND institution_id = $2';
                const studentCheckRes = await pool.query(studentCheckQuery, [admission_number, studentInstitutionId]);

                let existingStudentId: string | null = null;
                let existingUserId: string | null = null;

                if (studentCheckRes.rows.length > 0) {
                    existingStudentId = studentCheckRes.rows[0].id;
                    existingUserId = studentCheckRes.rows[0].user_id;
                } else if (schemaName) {
                    // 3. Not in public.students, search the tenant schema (discovery mode)
                    const tenantCheckQuery = `SELECT id, full_name FROM ${schemaName}.student_records WHERE reg_number = $1`;
                    const tenantCheckRes = await pool.query(tenantCheckQuery, [admission_number]);
                    
                    if (tenantCheckRes.rows.length > 0) {
                        const tenantRecord = tenantCheckRes.rows[0];
                        const nameParts = tenantRecord.full_name.split(' ');
                        const fName = nameParts[0] || 'Student';
                        const lName = nameParts.slice(1).join(' ') || '';
                        
                        // Auto-provision student stub in public schema
                        const insertRes = await pool.query(`
                            INSERT INTO students (institution_id, admission_number, first_name, last_name, user_id, last_sync_at)
                            VALUES ($1, $2, $3, $4, $5, NOW())
                            RETURNING id
                        `, [studentInstitutionId, admission_number, fName, lName, userId]);
                        
                        existingStudentId = insertRes.rows[0].id;
                    }
                }

                if (!existingStudentId) {
                    // Registration number not found anywhere in our infrastructure
                    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
                    return res.status(404).json({
                        status: 'error',
                        message: 'Registration number not found in institution records. Please verify it is correct or contact your administrator.'
                    });
                }

                if (existingUserId && existingUserId !== userId) {
                    // Ensure the slot isn't already claimed and active
                    const activeCheck = await pool.query('SELECT last_login FROM users WHERE id = $1', [existingUserId]);
                    if (activeCheck.rows.length > 0 && activeCheck.rows[0].last_login) {
                        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
                        return res.status(403).json({
                            status: 'error',
                            message: 'This registration number has already been claimed by an active account.'
                        });
                    }
                }

                // Link the student record to the new user account
                await pool.query(
                    'UPDATE students SET user_id = $1 WHERE id = $2',
                    [userId, existingStudentId]
                );

                if (admission_number && studentInstitutionId) {
                    process.nextTick(async () => {
                        try {
                            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
                            if (studentRes.rows.length > 0) {
                                await InstitutionSyncService.syncStudentProfile(studentRes.rows[0].id);
                            }
                        } catch (syncErr) {
                            console.error('Initial Profile Sync failed:', syncErr);
                        }
                    });
                }
            }

            // 6. Send verification email
            let emailSent = false;
            let emailError = '';
            try {
                await emailService.sendVerificationEmail(email, verificationToken);
                emailSent = true;
            } catch (err: any) {
                console.error('VERIFICATION EMAIL FAILED:', err.message);
                emailError = err.message;
            }

            res.status(201).json({
                status: 'success',
                message: emailSent
                    ? 'Registration successful. Please check your email to verify your account.'
                    : 'Registration successful, but we could not send the verification email.',
                emailSent,
                emailError,
                data: result.rows[0]
            });

        } catch (error: any) {
            console.error('Registration Error Detailed:', {
                message: error.message,
                stack: error.stack,
                body: req.body
            });
            res.status(500).json({ 
                message: 'Internal Server Error during registration',
                detail: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    /**
     * Verifies a user's email address.
     */
    verifyEmail = async (req: Request, res: Response) => {
        const { token } = req.body;

        try {
            const query = 'SELECT id FROM users WHERE verification_token = $1';
            const result = await pool.query(query, [token]);

            if (result.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid or expired verification token' });
            }

            const userId = result.rows[0].id;
            await pool.query('UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1', [userId]);

            res.status(200).json({
                status: 'success',
                message: 'Email verified successfully. You can now log in.'
            });
        } catch (error: any) {
            console.error('Verify Email Error:', error.message);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    /**
     * Handles forgot password request.
     */
    forgotPassword = async (req: Request, res: Response) => {
        const { email } = req.body;

        try {
            const userQuery = 'SELECT id FROM users WHERE email = $1';
            const userResult = await pool.query(userQuery, [email]);

            if (userResult.rows.length === 0) {
                // Return success even if user not found for security
                return res.status(200).json({
                    status: 'success',
                    message: 'If an account with that email exists, we have sent a reset link.'
                });
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

            await pool.query(
                'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
                [resetToken, resetTokenExpires, email]
            );

            await emailService.sendPasswordResetEmail(email, resetToken);

            res.status(200).json({
                status: 'success',
                message: 'Password reset link sent to your email.'
            });
        } catch (error: any) {
            console.error('Forgot Password Error:', error.message);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    /**
     * Resets a user's password.
     */
    resetPassword = async (req: Request, res: Response) => {
        const { token, password } = req.body;

        try {
            const query = 'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()';
            const result = await pool.query(query, [token]);

            if (result.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid or expired reset token' });
            }

            const userId = result.rows[0].id;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await pool.query(
                'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
                [hashedPassword, userId]
            );

            res.status(200).json({
                status: 'success',
                message: 'Password has been reset successfully. You can now log in.'
            });
        } catch (error: any) {
            console.error('Reset Password Error:', error.message);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    };

    /**
     * Returns the currently authenticated user's status.
     */
    getMe = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.id;
            const result = await pool.query(
                `SELECT u.id, u.email, u.role, u.is_verified, 
                        s.id as student_id, c.id as company_id, i.id as institution_id,
                        i.name as institution_name
                 FROM users u
                 LEFT JOIN students s ON s.user_id = u.id
                 LEFT JOIN companies c ON c.user_id = u.id
                 LEFT JOIN institutions i ON i.user_id = u.id
                 WHERE u.id = $1`,
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({
                status: 'success',
                data: result.rows[0]
            });
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    };
}
