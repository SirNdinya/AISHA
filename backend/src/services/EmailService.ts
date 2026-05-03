import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import path from 'path';

class EmailService {
    private transporter: any = null;
    private gmailClient: any = null;

    constructor() {
        // We will look for these 3 OAuth credentials instead of the old SMTP_PASS
        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;
        const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
        
        // Old SMTP settings (kept for local testing fallback)
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = process.env.SMTP_PORT || '587';
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        // 1. Google API / OAuth2 Mode (Best for Render Free Tier)
        if (clientId && clientSecret && refreshToken) {
            console.log('[EmailService] 🚀 Gmail OAuth2 credentials detected. Using Google API (HTTP Port 443).');
            try {
                const OAuth2 = google.auth.OAuth2;
                const oauth2Client = new OAuth2(
                    clientId,
                    clientSecret,
                    'https://developers.google.com/oauthplayground' // Redirect URL required by Google
                );
                
                oauth2Client.setCredentials({
                    refresh_token: refreshToken
                });
                
                this.gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });
                return; // Skip Nodemailer initialization
            } catch (error: any) {
                console.error('[EmailService] ❌ Failed to initialize Google API client:', error.message);
            }
        }

        // 2. Nodemailer Fallback (For local testing without OAuth)
        console.log('[EmailService] 🛡️ Validating SMTP Configuration (Fallback)...');
        
        if (!smtpHost) {
            console.warn('[EmailService] ⚠️ No SMTP_HOST found and no GMAIL OAuth credentials found.');
            return;
        }

        const isGmail = smtpHost?.toLowerCase().includes('gmail');

        if (isGmail) {
            console.log('[EmailService] 📧 Using GMAIL mode with Port 465 (Implicit SSL, Direct IP)');
            this.transporter = nodemailer.createTransport({
                host: '74.125.142.108', // Direct IPv4 for smtp.gmail.com
                port: 465,         
                secure: true,      
                family: 4,         
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
                tls: {
                    servername: 'smtp.gmail.com'
                },
                connectionTimeout: 10000, 
                greetingTimeout: 10000,   
            } as any);
        } else {
            console.log(`[EmailService] 🌐 Using custom SMTP mode: ${smtpHost}:${smtpPort}`);
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(smtpPort),
                secure: false, 
                family: 4, 
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
                tls: {
                    rejectUnauthorized: false
                }
            } as any);
        }

        this.transporter?.verify((error: Error | null, success: boolean) => {
            if (error) {
                console.error('[EmailService] ❌ Transporter Connection Error:', error.message);
            } else {
                console.log('[EmailService] ✅ SMTP Connection Verified - Ready to send emails');
            }
        });
    }

    private async sendMail(to: string, subject: string, html: string, replyTo?: string) {
        try {
            const from = process.env.SMTP_USER || process.env.EMAIL_FROM || 'aishaadmin@gmail.com';
            
            // IF USING GOOGLE API (OAUTH2)
            if (this.gmailClient) {
                console.log(`[EmailService] Attempting to send email via Google API to: ${to} | Subject: ${subject}`);
                
                // Use MailComposer from nodemailer to create the raw MIME email string safely
                const MailComposer = require('nodemailer/lib/mail-composer');
                const mail = new MailComposer({
                    to: to,
                    from: from,
                    replyTo: replyTo, // Allows clicking 'Reply' to email the person who filled the form
                    subject: subject,
                    html: html,
                    textEncoding: 'base64'
                });

                const mailBuffer = await mail.compile().build();
                
                // Google API requires Base64URL encoding (different from standard Base64)
                const encodedMessage = mailBuffer.toString('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');

                const response = await this.gmailClient.users.messages.send({
                    userId: 'me',
                    requestBody: {
                        raw: encodedMessage,
                    },
                });

                console.log('[EmailService] Success! Message sent via Google API:', response.data.id);
                return response.data;
            }

            // IF USING NODEMAILER FALLBACK (SMTP)
            if (!this.transporter) {
                throw new Error("Email service is not configured. Missing OAuth or SMTP credentials.");
            }

            console.log(`[EmailService] Attempting to send email via SMTP to: ${to} | Subject: ${subject}`);
            const mailOptions = {
                from: from,
                to,
                replyTo, // Allows clicking 'Reply' to email the person who filled the form
                subject,
                html,
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('[EmailService] Success! Message sent via SMTP: %s', info.messageId);
            return info;
            
        } catch (error: any) {
            console.error('[EmailService] Critical Failure sending email:');
            console.error('  - Error Message:', error.message);
            
            // Helpful message if the Refresh Token expires
            if (error.message.includes('invalid_grant')) {
                console.error('  - REASON: Google OAuth Refresh Token is expired or invalid. Please generate a new one.');
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

    public async sendContactEmail(name: string, senderEmail: string, requestSubject: string, message: string) {
        const to = process.env.EMAIL_FROM || process.env.SMTP_USER || 'contact@aisha.io';
        const subject = `[New Contact Message via AISHA Platform]: ${requestSubject}`;
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">AISHA Platform</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px; text-transform: uppercase;">New Contact Form Submission</p>
                </div>
                <div style="padding: 40px 30px; color: #444444; line-height: 1.6;">
                    <h2 style="color: #2c3e50; margin-top: 0; font-size: 20px;">You Have a New Message</h2>
                    <p><strong>From:</strong> ${name} (<a href="mailto:${senderEmail}">${senderEmail}</a>)</p>
                    <p><strong>Subject:</strong> ${requestSubject}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
            </div>
        `;
        return this.sendMail(to, subject, html, senderEmail);
    }
}

export const emailService = new EmailService();
export default emailService;
