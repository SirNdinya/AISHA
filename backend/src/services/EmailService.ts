import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

class EmailService {
    private transporter;

    constructor() {
        console.log('[EmailService] Initializing with SMTP:', {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            hasPass: !!process.env.SMTP_PASS,
            from: process.env.EMAIL_FROM
        });

        const isGmail = process.env.SMTP_HOST?.includes('gmail');

        this.transporter = nodemailer.createTransport(isGmail ? {
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            }
        } : {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify connection as soon as service is initialized
        this.transporter.verify((error, success) => {
            if (error) {
                console.error('[EmailService] Transporter Connection Error:', error);
            } else if (process.env.NODE_ENV !== 'test') {
                console.log('[EmailService] Server is ready to take our messages');
            }
        });
    }

    private async sendMail(to: string, subject: string, html: string) {
        console.log(`[EmailService] SMTP_USER currently is: ${process.env.SMTP_USER}`);
        console.log(`[EmailService] Attempting to send email to: ${to} | Subject: ${subject}`);
        try {
            // Gmail often requires 'from' to match the authenticated user
            const from = process.env.SMTP_HOST?.includes('gmail')
                ? process.env.SMTP_USER
                : (process.env.EMAIL_FROM || '"AISHA Platform" <noreply@aisha.ai>');

            const mailOptions = {
                from: from,
                to,
                subject,
                html,
            };

            console.log(`[EmailService] Using FROM address: ${from}`);

            const info = await this.transporter.sendMail(mailOptions);
            console.log('[EmailService] Success! Message sent: %s', info.messageId);
            return info;
        } catch (error: any) {
            console.error('[EmailService] Critical Failure sending email:');
            console.error('  - Error Code:', error.code);
            console.error('  - Response:', error.response);
            console.error('  - Stack:', error.stack);

            if (error.code === 'EAUTH') {
                console.error('  - REASON: SMTP authentication failed. Check your SMTP_USER and SMTP_PASS (App Password if using Gmail).');
            }

            throw new Error(`Email delivery failed: ${error.message}`);
        }
    }

    public async sendVerificationEmail(email: string, token: string) {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
        const subject = 'Verify Your AISHA Account';
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">AISHA</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Verification</p>
                </div>
                <div style="padding: 40px 30px; color: #444444; line-height: 1.6;">
                    <h2 style="color: #2c3e50; margin-top: 0; font-size: 22px;">Welcome to the Future!</h2>
                    <p>Hello there,</p>
                    <p>We're excited to have you join <strong>AISHA</strong> (Advanced Institutional Student Hiring Assistant). To activate your portal and start your journey, please verify your email address.</p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${verificationUrl}" style="background-color: #3498db; color: #ffffff; padding: 16px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);">Verify Your Account</a>
                    </div>
                    
                    <p style="font-size: 13px; color: #888888; text-align: center;">
                        If the button above doesn't work, copy and paste this link:<br>
                        <a href="${verificationUrl}" style="color: #3498db; word-break: break-all;">${verificationUrl}</a>
                    </p>
                </div>
                <div style="background-color: #f9fbfd; padding: 25px; text-align: center; border-top: 1px solid #f0f0f0;">
                    <p style="font-size: 12px; color: #95a5a6; margin: 0;">&copy; ${new Date().getFullYear()} AISHA Intelligence. The smarter way to hire.</p>
                </div>
            </div>
        `;
        return this.sendMail(email, subject, html);
    }

    public async sendPasswordResetEmail(email: string, token: string) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
        const subject = 'Secure Your AISHA Account';
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">AISHA</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Security Update</p>
                </div>
                <div style="padding: 40px 30px; color: #444444; line-height: 1.6;">
                    <h2 style="color: #2c3e50; margin-top: 0; font-size: 22px;">Reset Your Password</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset the password for your AISHA account. If this was you, please click the button below to secure your account.</p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetUrl}" style="background-color: #e74c3c; color: #ffffff; padding: 16px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 10px rgba(231, 76, 60, 0.3);">Reset My Password</a>
                    </div>
                    
                    <p style="font-size: 13px; color: #888888; text-align: center;">
                        This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
                    </p>
                </div>
                <div style="background-color: #f9fbfd; padding: 25px; text-align: center; border-top: 1px solid #f0f0f0;">
                    <p style="font-size: 12px; color: #95a5a6; margin: 0;">&copy; ${new Date().getFullYear()} AISHA Intelligence. Secure & Sustainable.</p>
                </div>
            </div>
        `;
        return this.sendMail(email, subject, html);
    }
}

export const emailService = new EmailService();
export default emailService;
