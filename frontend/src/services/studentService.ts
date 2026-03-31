import apiClient from './apiClient';
import type { Student, UpdateStudentDto } from '../types/student';
import type { Opportunity } from '../types/company';
import type { Application } from '../types/application';

// Define the API response structure wrapper
interface ApiResponse<T> {
    status: 'success' | 'error';
    data: T;
    message?: string;
}

const StudentService = {
    getProfile: async (): Promise<Student> => {
        const response = await apiClient.get<ApiResponse<Student>>('/students/profile');
        return response.data.data;
    },

    updateProfile: async (data: UpdateStudentDto): Promise<Student> => {
        const response = await apiClient.patch<ApiResponse<Student>>('/students/profile', data);
        return response.data.data;
    },

    syncProfile: async (admissionNumber: string): Promise<Student> => {
        const response = await apiClient.post<ApiResponse<Student>>('/students/sync-profile', {
            admission_number: admissionNumber
        });
        return response.data.data;
    },

    // Example for future: uploads
    uploadCV: async (file: File) => {
        const formData = new FormData();
        formData.append('cv', file);
        const response = await apiClient.post('/students/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    uploadProfilePicture: async (file: File) => {
        const formData = new FormData();
        formData.append('profile_picture', file);
        const response = await apiClient.post('/students/profile-picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    uploadDocument: async (file: File, type: string = 'CERTIFICATION') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        const response = await apiClient.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.data;
    },

    // Opportunity Discovery
    getOpportunities: async (): Promise<Opportunity[]> => {
        // Reuse the public endpoint
        const response = await apiClient.get<ApiResponse<Opportunity[]>>('/opportunities');
        return response.data.data;
    },

    // Application Logic
    applyToOpportunity: async (opportunityId: string): Promise<Application> => {
        const response = await apiClient.post<ApiResponse<Application>>('/applications/apply', { opportunity_id: opportunityId });
        return response.data.data;
    },

    getMyApplications: async (): Promise<Application[]> => {
        const response = await apiClient.get<ApiResponse<Application[]>>('/applications/my-applications');
        return response.data.data;
    },

    // Automation
    runAutoMatch: async (): Promise<{ matches_found: number, message: string }> => {
        // Backend returns a flat object, not wrapped in data for this specific endpoint
        const response = await apiClient.post<any>('/automation/match/run');
        return response.data;
    },

    toggleAutoApply: async (enabled: boolean): Promise<{ auto_apply_enabled: boolean }> => {
        const response = await apiClient.patch<ApiResponse<{ auto_apply_enabled: boolean }>>('/automation/settings/toggle', { enabled });
        return response.data.data;
    },

    // Dashboard Data
    getDashboardStats: async (): Promise<any> => {
        const response = await apiClient.get<ApiResponse<any>>('/students/dashboard-stats');
        return response.data.data;
    },

    getMatchIntelligence: async (): Promise<any[]> => {
        const response = await apiClient.get<ApiResponse<any[]>>('/students/match-intelligence');
        return response.data.data;
    },

    getAutomationLog: async (): Promise<any[]> => {
        const response = await apiClient.get<ApiResponse<any[]>>('/students/automation-log');
        return response.data.data;
    },

    getLearningPath: async (): Promise<any[]> => {
        const response = await apiClient.get<ApiResponse<any[]>>('/students/learning-path');
        return response.data.data;
    },

    downloadPlacementLetter: async (applicationId: string): Promise<Blob> => {
        const response = await apiClient.get(`/documents/placement-letter/${applicationId}`, {
            responseType: 'blob'
        });
        return response.data;
    },

    downloadNITAForm: async (applicationId: string): Promise<Blob> => {
        const response = await apiClient.get(`/documents/nita-form/${applicationId}`, {
            responseType: 'blob'
        });
        return response.data;
    },

    getAcademicRecords: async (): Promise<any[]> => {
        const response = await apiClient.get<ApiResponse<any[]>>('/students/academic-records');
        return response.data.data;
    },

    getTranscriptReport: async (): Promise<any> => {
        const response = await apiClient.get<ApiResponse<any>>('/students/transcript-report');
        return response.data.data;
    },

    generateAIResume: async (studentId: string, prompt: string): Promise<any> => {
        // This calls the ai-services directly or via the main backend proxy
        // Assuming the main backend proxies it or we call ai-services directly
        // For now, assume it's under /students/generate-ai-resume in the main backend 
        // OR we use the specialized ai-services port if configured.
        // Let's assume the main backend provides this endpoint for simplicity in the frontend.
        const response = await apiClient.post<ApiResponse<any>>(`/students/${studentId}/generate-ai-resume`, { prompt });
        return response.data.data;
    },

    downloadTranscriptReport: async (): Promise<void> => {
        const response = await apiClient.get('/students/transcript-report/download', {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'transcript_report.pdf');
        document.body.appendChild(link);
        link.click();

        if (link.parentNode) link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    respondToOffer: async (applicationId: string, decision: 'ACCEPTED' | 'DECLINED', feedback?: string): Promise<any> => {
        const response = await apiClient.post<ApiResponse<any>>(`/applications/${applicationId}/respond-to-offer`, {
            decision,
            feedback
        });
        return response.data.data;
    },

    deleteAccount: async (): Promise<void> => {
        await apiClient.delete('/auth/account');
    },

    getMyDocuments: async (): Promise<any[]> => {
        const response = await apiClient.get<ApiResponse<any[]>>('/documents/mine');
        return response.data.data;
    },

    getAssessments: async (): Promise<any[]> => {
        const response = await apiClient.get<ApiResponse<any[]>>('/assessments');
        return response.data.data;
    },

    deleteDocument: async (id: string): Promise<void> => {
        await apiClient.delete(`/documents/${id}`);
    }
};

export default StudentService;
