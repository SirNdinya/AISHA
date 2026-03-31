import pool from '../config/database';

export class AutomationService {
    /**
     * Finds and applies to matching opportunities for a student
     */
    /**
     * Finds and applies to matching opportunities for a student
     */
    static async runAutoMatch(studentId: string, userId: string) {
        // Get Student Details
        const studentRes = await pool.query('SELECT id, first_name, auto_apply_enabled FROM students WHERE id = $1', [studentId]);
        if (studentRes.rows.length === 0) return { matches_found: 0, message: 'Student not found' };

        const student = studentRes.rows[0];

        // Ensure we import AIService and NotificationService dynamically if needed to prevent circular dependencies
        const { AIService } = require('./AIService');
        const { NotificationService } = require('./NotificationService');

        console.log(`[AI SERVICE] Triggering Match Protocol for student ${studentId}...`);
        
        // Let the AI perform deep analysis on transcript, career path, etc.
        const matches = await AIService.getMatchIntelligence(studentId);
        
        if (!matches || matches.length === 0) {
            return { matches_found: 0, message: 'No opportunities currently match your strict profile.' };
        }

        const newApps: string[] = [];
        let bestMatch: any = null;

        for (const job of matches) {
            const score = job.score || job.match_score || 0;
            if (!bestMatch || score > (bestMatch.score || bestMatch.match_score || 0)) {
                bestMatch = job;
            }
        }

        if (bestMatch) {
            const totalScore = bestMatch.score || bestMatch.match_score || 0;
            const reasoning = bestMatch.reasoning || "Strong neural alignment with your trajectory.";
            
            // High Confidence Pre-placement / Auto-Apply Protocol (Single Best Match)
            if (totalScore >= 75 && student.auto_apply_enabled) {
                const checkRes = await pool.query('SELECT id FROM applications WHERE student_id = $1 AND opportunity_id = $2', [student.id, bestMatch.opportunity_id || bestMatch.id]);
                if (checkRes.rows.length === 0) {
                    const insertQuery = `
                        INSERT INTO applications (student_id, opportunity_id, match_score, match_reason, status)
                        VALUES ($1, $2, $3, $4, 'PENDING')
                    `;
                    await pool.query(insertQuery, [student.id, bestMatch.opportunity_id || bestMatch.id, totalScore, reasoning]);
                    newApps.push(bestMatch.opportunity_id || bestMatch.id);
                }
            }

            // Send a notification if the top match is high-quality (regardless of auto-apply)
            if (totalScore >= 70) {
                const hasAutoApplied = newApps.length > 0;
                const notificationTitle = hasAutoApplied ? 'Neural Auto-Application' : 'New High-Relevance Match';
                const notificationBody = hasAutoApplied 
                    ? `AISHA has identified your 100% ideal match for ${bestMatch.title || bestMatch.job_title} and automatically placed your application.`
                    : `AISHA identified ${bestMatch.title || bestMatch.job_title} as your #${Math.round(totalScore)}% match node. Check your dashboard.`;
                    
                await NotificationService.createNotification(
                    userId,
                    notificationTitle,
                    notificationBody,
                    'SUCCESS'
                );
            }
        }

        return { matches_found: newApps.length, message: `Auto-applied to ${newApps.length} opportunity. Highest match: ${bestMatch ? Math.round(bestMatch.score || bestMatch.match_score || 0) : 0}%.` };
    }

    /**
     * Periodically reviews pending applications and auto-accepts top matches
     */
    static async runAutonomousReview(opportunityId: string) {
        try {
            const axios = require('axios');
            const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';

            const oppRes = await pool.query('SELECT vacancies, auto_accept, title FROM opportunities WHERE id = $1', [opportunityId]);
            if (oppRes.rows.length === 0 || !oppRes.rows[0].auto_accept) return;
            const opp = oppRes.rows[0];

            const acceptedCountRes = await pool.query("SELECT COUNT(*) FROM applications WHERE opportunity_id = $1 AND status = 'ACCEPTED'", [opportunityId]);
            const remainingSlots = (opp.vacancies || 0) - parseInt(acceptedCountRes.rows[0].count);
            if (remainingSlots <= 0) return;

            // Fetch PENDING candidates to review
            const pendingRes = await pool.query(`
                SELECT a.id, a.student_id, s.user_id as student_user_id, s.first_name
                FROM applications a
                JOIN students s ON a.student_id = s.id
                WHERE a.opportunity_id = $1 AND a.status = 'PENDING'
                LIMIT $2
            `, [opportunityId, remainingSlots]);

            for (const app of pendingRes.rows) {
                // AI DEEP REVIEW
                console.log(`[AI SERVICE] Triggering deep review for application ${app.id}...`);
                const aiResult = await axios.post(`${aiServiceUrl}/api/autonomy/review/${app.id}`);
                const { match_score, verification } = aiResult.data;

                // High-Confidence Auto-Accept
                if (match_score >= 80 && verification.recommendation === 'accept') {
                    await pool.query("UPDATE applications SET status = 'OFFERED', updated_at = NOW() WHERE id = $1", [app.id]);

                    const { NotificationService } = require('./NotificationService');
                    const { MessageService } = require('./MessageService');
                    const { RealtimeService } = require('./RealtimeService');

                    // 1. Notify Student of Offer
                    await NotificationService.createNotification(
                        app.student_user_id,
                        'Autonomous Professional Offer!',
                        `After deep AI verification of your academic records, you have received an offer for ${opp.title}. Your matching score was ${Math.round(match_score)}%.`,
                        'SUCCESS'
                    );

                    // 2. AI Automated Message
                    const aiGreeting = `Congratulations ${app.first_name}! AISHA's autonomous engine has verified your academic excellence. Your ${match_score}% match score makes you a top candidate for the ${opp.title} position. Please review the offer!`;

                    const companyUserRes = await pool.query(`
                        SELECT c.user_id FROM companies c
                        JOIN opportunities o ON o.company_id = c.id
                        WHERE o.id = $1
                    `, [opportunityId]);

                    if (companyUserRes.rows.length > 0) {
                        await MessageService.sendMessage(companyUserRes.rows[0].user_id, app.student_user_id, aiGreeting, {
                            oppId: opportunityId,
                            appId: app.id,
                            is_ai: true
                        });
                    }

                    // 3. Notify Institution
                    const studentData = await pool.query('SELECT institution_id FROM students WHERE id = $1', [app.student_id]);
                    if (studentData.rows[0]?.institution_id) {
                        RealtimeService.emitToInstitution(studentData.rows[0].institution_id, 'autonomous_placement_offer', {
                            student_id: app.student_id,
                            opportunity_id: opportunityId,
                            status: 'OFFERED'
                        });
                    }
                } else {
                    console.log(`Autonomous Review: App ${app.id} did not meet AI threshold. (Score: ${match_score})`);
                }
            }
        } catch (error) {
            console.error('Autonomous Review Error:', error);
        }
    }

    /**
     * Checks for OFFERED applications that have passed their offer_expires_at date
     * and sets them to EXPIRED.
     */
    static async expireOldOffers() {
        try {
            const { NotificationService } = require('./NotificationService');

            // Find expired offers
            const expiredRes = await pool.query(`
                SELECT a.id, a.opportunity_id, a.student_id, s.user_id as student_user_id, o.title, c.user_id as company_user_id
                FROM applications a
                JOIN students s ON a.student_id = s.id
                JOIN opportunities o ON a.opportunity_id = o.id
                JOIN companies c ON o.company_id = c.id
                WHERE a.status = 'OFFERED' AND a.offer_expires_at < NOW()
            `);

            for (const app of expiredRes.rows) {
                // Set to DECLINED (or EXPIRED if you prefer, DECLINED fits the enum)
                await pool.query("UPDATE applications SET status = 'DECLINED', updated_at = NOW() WHERE id = $1", [app.id]);

                await NotificationService.createNotification(
                    app.student_user_id,
                    'Offer Expired',
                    `Your offer for ${app.title} has expired as the 48-hour window has passed without acceptance.`,
                    'WARNING'
                );

                await NotificationService.createNotification(
                    app.company_user_id,
                    'Offer Expired',
                    `The offer extended for ${app.title} has expired as the student did not respond in time.`,
                    'INFO'
                );
            }
        } catch (error) {
            console.error('Error expiring old offers:', error);
        }
    }
}
