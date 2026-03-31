import apiClient from './apiClient';
import type { Company, Opportunity, CreateOpportunityDto } from '../types/company';
import type { Application } from '../types/application';

interface ApiResponse<T> {
    status: 'success' | 'error';
    data: T;
    results?: number;
}

const CompanyService = {
    // Profiling
    getProfile: async (): Promise<Company> => {
        const response = await apiClient.get<ApiResponse<Company>>('/companies/profile');
        return response.data.data;
    },

    updateProfile: async (data: Partial<Company>): Promise<Company> => {
        const response = await apiClient.patch<ApiResponse<Company>>('/companies/profile', data);
        return response.data.data;
    },

    // Opportunity Management (Company Side)
    getMyOpportunities: async (): Promise<Opportunity[]> => {
        const response = await apiClient.get<ApiResponse<Opportunity[]>>('/opportunities/my-postings');
        return response.data.data;
    },

    createOpportunity: async (data: CreateOpportunityDto): Promise<Opportunity> => {
        const response = await apiClient.post<ApiResponse<Opportunity>>('/opportunities', data);
        return response.data.data;
    },

    updateOpportunity: async (id: string, data: Partial<CreateOpportunityDto>): Promise<Opportunity> => {
        const response = await apiClient.put<ApiResponse<Opportunity>>(`/opportunities/${id}`, data);
        return response.data.data;
    },

    deleteOpportunity: async (id: string): Promise<void> => {
        await apiClient.delete<ApiResponse<void>>(`/opportunities/${id}`);
    },

    getTalentAnalytics: async (): Promise<any> => {
        const response = await apiClient.get<ApiResponse<any>>('/opportunities/analytics');
        return response.data.data;
    },

    // Applicant Management
    getApplicants: async (opportunityId: string): Promise<Application[]> => {
        const response = await apiClient.get<ApiResponse<Application[]>>(`/applications/job/${opportunityId}`);
        return response.data.data;
    },

    updateApplicationStatus: async (id: string, status: string): Promise<Application> => {
        const response = await apiClient.patch<ApiResponse<Application>>(`/applications/${id}/status`, { status });
        return response.data.data;
    },

    // Public/Student Search
    searchOpportunities: async (): Promise<Opportunity[]> => {
        const response = await apiClient.get<ApiResponse<Opportunity[]>>('/opportunities');
        return response.data.data;
    },

    // Placements & Feedback
    getMyPlacements: async (): Promise<any[]> => {
        const response = await apiClient.get<ApiResponse<any[]>>('/placements/my-placements');
        return response.data.data;
    },

    submitFeedback: async (id: string, feedback: any): Promise<any> => {
        const response = await apiClient.patch<ApiResponse<any>>(`/placements/${id}/feedback`, { feedback });
        return response.data.data;
    },

    generateCertificate: async (id: string): Promise<any> => {
        const response = await apiClient.post<ApiResponse<any>>(`/placements/${id}/certificate`);
        return response.data.data;
    },

    submitAssessment: async (data: any): Promise<any> => {
        const response = await apiClient.post<ApiResponse<any>>('/placements/assessments', data);
        return response.data.data;
    },

    getCompanyDepartments: async (): Promise<any[]> => {
        const response = await apiClient.get<ApiResponse<any[]>>('/companies/departments');
        return response.data.data;
    },

    getSupervisors: async (): Promise<any[]> => {
        const response = await apiClient.get<ApiResponse<any[]>>('/companies/supervisors');
        return response.data.data;
    },

    updatePlacement: async (id: string, data: any): Promise<any> => {
        const response = await apiClient.patch<ApiResponse<any>>(`/placements/${id}`, data);
        return response.data.data;
    }
};

export default CompanyService;
