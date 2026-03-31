import apiClient from './apiClient';

export interface StudentImportDto {
    full_name: string;
    email: string;
    reg_number: string;
    course: string;
    year_of_study: number;
}

export interface InstitutionOverview {
    total_enrolled: string;
    total_applications: string;
    success_placements: string;
    pending_placements: string;
    department_count: string;
}

export interface DepartmentStat {
    name: string;
    code: string;
    student_count: string;
    placed_count: string;
}

export interface InstitutionStats {
    overview: InstitutionOverview;
    departments: DepartmentStat[];
    schema: string;
    institution_id: string;
}

export interface CreateDepartmentDto {
    institution_id: string;
    name: string;
    code: string;
    description: string;
    email: string;
    password: string;
}

interface ApiResponse<T> {
    status: 'success' | 'error';
    data: T;
}

const InstitutionService = {
    // Bulk Import
    importStudents: async (students: StudentImportDto[], institutionId: string) => {
        const response = await apiClient.post<ApiResponse<any>>('/institutions/import', { students, institution_id: institutionId });
        return response.data;
    },

    // Stats are now pulled from Analytics
    getStats: async (): Promise<InstitutionStats> => {
        const response = await apiClient.get<ApiResponse<InstitutionStats>>(`/institutions/analytics`);
        return response.data.data;
    },

    getAnalytics: async () => {
        const response = await apiClient.get<ApiResponse<InstitutionStats>>('/institutions/analytics');
        return response.data.data;
    },

    createDepartment: async (data: CreateDepartmentDto) => {
        const response = await apiClient.post<ApiResponse<any>>('/institutions/departments', data);
        return response.data;
    },

    getStudents: async (params?: any): Promise<ApiResponse<any[]>> => {
        return apiClient.get('/institution/students', { params });
    },
    getAssessments: async (id: string): Promise<ApiResponse<any[]>> => {
        return apiClient.get(`/placements/${id}/assessments`);
    },
    syncStudents: async (data: any): Promise<ApiResponse<any>> => {
        const response = await apiClient.post<ApiResponse<any>>('/institutions/sync', data);
        return response.data;
    },

    getSyncStatus: async () => {
        const response = await apiClient.get<ApiResponse<any[]>>('/institutions/sync-status');
        return response.data.data;
    },

    getPlacements: async () => {
        const response = await apiClient.get<ApiResponse<any[]>>('/institutions/placements');
        return response.data.data;
    },

    getDocuments: async () => {
        const response = await apiClient.get<ApiResponse<any[]>>('/institutions/documents');
        return response.data.data;
    },

    updateSettings: async (data: { firstName?: string; lastName?: string; institutionName?: string }) => {
        const response = await apiClient.patch<ApiResponse<any>>('/institutions/settings', data);
        return response.data;
    }
};

export default InstitutionService;
