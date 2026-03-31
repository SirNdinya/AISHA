// Company Interface matching 'companies' table
export interface Company {
    id: string; // UUID of company record, NOT user_id
    user_id: string;
    name: string;
    description?: string;
    industry?: string;
    website_url?: string;
    logo_url?: string;
    address?: string;
    contact_person_name?: string;
    contact_person_role?: string;
    is_verified: boolean;
    created_at: string;

    // Joined User fields
    email?: string;
    phone_number?: string;
}

export type OpportunityType = 'INTERNSHIP' | 'ATTACHMENT' | 'ENTRY_LEVEL';
export type OpportunityStatus = 'OPEN' | 'CLOSED' | 'DRAFT';

// Opportunity Interface matching 'opportunities' table
export interface Opportunity {
    id: string;
    company_id: string;
    title: string;
    description: string;
    requirements?: string; // stored as text, maybe markdown
    location: string;
    type: OpportunityType;
    stipend_amount?: number;
    duration_months?: number;
    application_deadline?: string;
    vacancies?: number;
    auto_accept: boolean;
    status: OpportunityStatus;
    applicant_count?: number;
    created_at: string;
    department_id?: string;
    student_payment_required: boolean;
    student_payment_amount: number;
    start_date?: string;
    department_name?: string;

    // Optional joined fields for public lists
    company_name?: string;
    logo_url?: string;
}

// DTOs
export interface CreateOpportunityDto {
    title: string;
    description: string;
    requirements?: string;
    location: string;
    type: OpportunityType;
    stipend_amount?: number;
    duration_months?: number;
    application_deadline: string;
    vacancies?: number;
    auto_accept?: boolean;
    department_id?: string;
    student_payment_required?: boolean;
    student_payment_amount?: number;
    start_date?: string;
    department_name?: string;
}
