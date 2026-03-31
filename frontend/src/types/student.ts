// Core User Interface matching the one in authSlice (but centralized here)
export type UserRole = 'STUDENT' | 'COMPANY' | 'INSTITUTION' | 'ADMIN';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    phone_number?: string;
    is_verified: boolean;
    created_at: string;
}

// Student Interface matching 'students' table
export interface Student {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    institution_id?: string; // UUID
    institution_name?: string; // Joined field
    course_of_study?: string;
    skills: string[];
    interests: string[];
    cv_url?: string;
    profile_picture_url?: string;
    resume_text?: string; // Stores JSON content from CV Builder
    requires_stipend: boolean;
    min_stipend_amount: number;
    mpesa_number?: string;
    auto_apply_enabled: boolean;
    preferred_locations?: string[];
    created_at: string;

    // User details joined in getProfile
    email?: string;
    phone_number?: string;

    // Sync status from institution database
    sync_status?: 'SYNCED' | 'FAILED' | 'PENDING' | 'NOT_SYNCED';
    last_sync_at?: string;
    placement_duration?: number;
}

export interface Unit {
    code: string;
    name: string;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface AcademicPerformance {
    units: Unit[];
    trend_data: { x: number, y: number }[];
    current_semester: string;
}

export interface ExternalStatus {
    mpesa: 'VERIFIED' | 'PENDING' | 'FAILED';
    nita: 'APPROVED' | 'PENDING' | 'REJECTED';
    insurance: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
}

export interface DashboardStats {
    active_scanning: boolean;
    acceptance_probability: number[];
    academic_performance: {
        skills_count: number;
        units_completed: number;
        total_units: number;
        current_semester: string;
    };
    external_status: ExternalStatus;
    skill_mapping: { name: string, value: number }[];
    skill_index: number;
}

export interface MatchIntelligence {
    id: string;
    job_title: string;
    company_name: string;
    match_score: number;
    match_reason: string;
    applied_at: string;
    status: string;
}

export interface AutomationLogEntry {
    id: string;
    action: string;
    resource_type: string;
    details: any;
    created_at: string;
}

export interface LearningRecommendation {
    id: string;
    title: string;
    platform: string;
    url: string;
    skills_covered: string[];
    cost_type: 'FREE' | 'PAID';
    status?: 'IN_PROGRESS' | 'COMPLETED';
}

// Interface for Updating Profile (Partial)
export interface UpdateStudentDto {
    first_name?: string;
    last_name?: string;
    admission_number?: string;
    course_of_study?: string;
    skills?: string[];
    interests?: string[];
    resume_text?: string;
    requires_stipend?: boolean;
    min_stipend_amount?: number;
    mpesa_number?: string;
    preferred_locations?: string[];
    placement_duration?: number;
}
