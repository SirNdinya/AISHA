// Basic Application Interface
export type ApplicationStatus = 'PENDING' | 'REVIEW' | 'ACCEPTED' | 'REJECTED' | 'OFFERED' | 'DECLINED';

export interface Application {
    id: string;
    student_id: string;
    opportunity_id: string;
    match_score: number;
    match_reason?: string;
    status: ApplicationStatus;
    applied_at: string;

    // Joined Fields (for Student List)
    job_title?: string;
    location?: string;
    company_name?: string;
    logo_url?: string;

    // Joined Fields (for Company List)
    first_name?: string;
    last_name?: string;
    course_of_study?: string;
    gpa?: number;
    skills?: string[];
    student_user_id?: string;

    // Additional Joined Fields
    offer_expires_at?: string;
    student_payment_required?: boolean;
    student_payment_amount?: number;
    description?: string;
    requirements?: string | string[];
    requires_stipend?: boolean;
    match_reasoning?: string;
}
