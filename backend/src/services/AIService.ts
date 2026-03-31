import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

export class AIService {
    /**
     * Get learning path recommendations for a student from the AI Service.
     */
    static async getLearningPath(studentId: string, skills: string[]) {
        try {
            const response = await axios.get(`${AI_SERVICE_URL}/api/learning/recommendations/${studentId}`);
            return response.data;
        } catch (error: any) {
            console.error('AI Service Learning Path Error:', error.message);
            return null; // Fallback to local logic if needed
        }
    }

    /**
     * Get matching intelligence for student applications.
     */
    static async getMatchIntelligence(studentId: string) {
        try {
            const response = await axios.get(`${AI_SERVICE_URL}/api/matching/recommendations/${studentId}`);
            return response.data.matches;
        } catch (error: any) {
            console.error('AI Service Matching Intelligence Error:', error.message);
            return null;
        }
    }

    /**
     * Discover online opportunities for a student.
     */
    static async discoverOpportunities(studentId: string) {
        try {
            const response = await axios.get(`${AI_SERVICE_URL}/api/autonomy/discover/${studentId}`);
            return response.data;
        } catch (error: any) {
            console.error('AI Service Discovery Error:', error.message);
            return null;
        }
    }

    /**
     * Search for learning resources based on a query.
     */
    static async searchLearningResources(query: string) {
        try {
            const response = await axios.get(`${AI_SERVICE_URL}/api/learning/search?q=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error: any) {
            console.error('AI Service Learning Search Error:', error.message);
            return null;
        }
    }

    /**
     * AI-Driven Profile Generation
     * Derives recommended skills and interest tags from a course of study.
     */
    static async generateInitialProfile(course: string) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/api/autonomy/generate-profile`, {
                course: course
            });
            return response.data.data; // Expected { skills: string[], tags: string[] }
        } catch (error: any) {
            console.error('AI Profile Generation Error:', error.message);
            // Professional fallback based on keywords
            const lowerCourse = course.toLowerCase();
            if (lowerCourse.includes('computer') || lowerCourse.includes('software') || lowerCourse.includes('coding')) {
                return {
                    skills: ['Python', 'Software Engineering', 'SQL', 'Algorithms', 'Data Structures'],
                    tags: ['Software Development', 'SaaS', 'Fintech', 'AI/ML']
                };
            } else if (lowerCourse.includes('information technology') || lowerCourse.includes('it') || lowerCourse.includes('network')) {
                return {
                    skills: ['Networking', 'Cybersecurity', 'Cloud Computing (AWS/Azure)', 'System Administration', 'Database Admin'],
                    tags: ['IT Infrastructure', 'Cloud Services', 'Information Security', 'Network Eng']
                };
            } else if (lowerCourse.includes('education') || lowerCourse.includes('pedagogy') || lowerCourse.includes('teaching')) {
                return {
                    skills: ['Curriculum Design', 'Educational Psychology', 'Instructional Leadership', 'Assessment Strategies', 'Classroom Management'],
                    tags: ['Higher Education', 'E-Learning', 'K-12 Instruction', 'EduTech']
                };
            }
            return {
                skills: ['Communication', 'Critical Thinking', 'Problem Solving', 'Teamwork'],
                tags: ['General Industry', 'Professional Services']
            };
        }
    }

    /**
     * Analyze student academic performance.
     */
    static async analyzeTranscript(records: any[]) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/api/learning/analyze-transcript`, {
                records: records
            });
            return response.data.data;
        } catch (error: any) {
            console.error('AI Transcript Analysis Error:', error.message);
            return null;
        }
    }

    /**
     * Download transcript analysis report as PDF.
     */
    static async downloadTranscriptReport(studentName: string, records: any[], analysis: any) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/api/learning/download-transcript`, {
                student_name: studentName,
                records: records,
                analysis: analysis
            }, { responseType: 'arraybuffer' });
            return response.data;
        } catch (error: any) {
            console.error('AI Transcript Download Error:', error.message);
            return null;
        }
    }
    /**
     * Chat with AISHA Assistant
     */
    static async chat(userId: string, message: string, history: any[] = []) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/api/chat`, {
                user_id: userId,
                message: message,
                history: history
            });
            return response.data;
        } catch (error: any) {
            console.error('AI Chat Error:', error.message);
            // Fallback response
            return {
                content: "I'm currently having trouble connecting to my core brain, but I'm here to help with AISHA platform navigation in the meantime!",
                role: 'assistant'
            };
        }
    }
}
