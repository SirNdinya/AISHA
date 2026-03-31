import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Company, Opportunity, CreateOpportunityDto } from '../types/company';
import type { Application } from '../types/application';
import CompanyService from '../services/companyService';

interface CompanyState {
    profile: Company | null;
    opportunities: Opportunity[]; // List of company's own postings
    applicants: Application[]; // Current list of applicants being viewed
    analytics: any | null;
    placements: any[];
    isLoading: boolean;
    error: string | null;
}

const initialState: CompanyState = {
    profile: null,
    opportunities: [],
    applicants: [],
    analytics: null,
    placements: [],
    isLoading: false,
    error: null,
};

// Thunks
export const fetchCompanyProfile = createAsyncThunk(
    'company/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            return await CompanyService.getProfile();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
        }
    }
);

export const fetchCompanyOpportunities = createAsyncThunk(
    'company/fetchOpportunities',
    async (_, { rejectWithValue }) => {
        try {
            return await CompanyService.getMyOpportunities();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch opportunities');
        }
    }
);

export const postOpportunity = createAsyncThunk(
    'company/postOpportunity',
    async (data: CreateOpportunityDto, { rejectWithValue }) => {
        try {
            return await CompanyService.createOpportunity(data);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create opportunity');
        }
    }
);

export const updateOpportunityAction = createAsyncThunk(
    'company/updateOpportunity',
    async ({ id, data }: { id: string, data: Partial<CreateOpportunityDto> }, { rejectWithValue }) => {
        try {
            return await CompanyService.updateOpportunity(id, data);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update opportunity');
        }
    }
);

export const deleteOpportunityAction = createAsyncThunk(
    'company/deleteOpportunity',
    async (id: string, { rejectWithValue }) => {
        try {
            await CompanyService.deleteOpportunity(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete opportunity');
        }
    }
);

export const fetchApplicants = createAsyncThunk(
    'company/fetchApplicants',
    async (opportunityId: string, { rejectWithValue }) => {
        try {
            return await CompanyService.getApplicants(opportunityId);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch applicants');
        }
    }
);

export const updateApplicantStatus = createAsyncThunk(
    'company/updateApplicantStatus',
    async ({ id, status }: { id: string, status: string }, { rejectWithValue }) => {
        try {
            return await CompanyService.updateApplicationStatus(id, status);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update status');
        }
    }
);

export const fetchCompanyAnalytics = createAsyncThunk(
    'company/fetchAnalytics',
    async (_, { rejectWithValue }) => {
        try {
            return await CompanyService.getTalentAnalytics();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
        }
    }
);

export const fetchPlacements = createAsyncThunk(
    'company/fetchPlacements',
    async (_, { rejectWithValue }) => {
        try {
            return await CompanyService.getMyPlacements();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch placements');
        }
    }
);

const companySlice = createSlice({
    name: 'company',
    initialState,
    reducers: {
        resetCompanyState: () => initialState,
    },
    extraReducers: (builder) => {
        // Profile
        builder.addCase(fetchCompanyProfile.pending, (state) => { state.isLoading = true; });
        builder.addCase(fetchCompanyProfile.fulfilled, (state, action) => {
            state.isLoading = false;
            state.profile = action.payload;
        });
        builder.addCase(fetchCompanyProfile.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Opportunities
        builder.addCase(fetchCompanyOpportunities.fulfilled, (state, action) => {
            state.opportunities = action.payload;
        });

        // Create Opportunity
        builder.addCase(postOpportunity.fulfilled, (state, action) => {
            state.opportunities.unshift(action.payload); // Add to top
        });

        // Update Opportunity
        builder.addCase(updateOpportunityAction.fulfilled, (state, action) => {
            const index = state.opportunities.findIndex(o => o.id === action.payload.id);
            if (index !== -1) {
                // Ensure we maintain department_name if the backend didn't return it
                state.opportunities[index] = { ...state.opportunities[index], ...action.payload };
            }
        });

        // Delete Opportunity
        builder.addCase(deleteOpportunityAction.fulfilled, (state, action) => {
            state.opportunities = state.opportunities.filter(o => o.id !== action.payload);
        });

        // Applicants
        builder.addCase(fetchApplicants.pending, (state) => { state.isLoading = true; });
        builder.addCase(fetchApplicants.fulfilled, (state, action) => {
            state.isLoading = false;
            state.applicants = action.payload;
        });
        builder.addCase(updateApplicantStatus.fulfilled, (state, action) => {
            // Update local status
            const index = state.applicants.findIndex(a => a.id === action.payload.id);
            if (index !== -1) {
                state.applicants[index] = { ...state.applicants[index], ...action.payload };
            }
        });

        // Analytics
        builder.addCase(fetchCompanyAnalytics.fulfilled, (state, action) => {
            state.analytics = action.payload;
        });

        // Placements
        builder.addCase(fetchPlacements.pending, (state) => { state.isLoading = true; });
        builder.addCase(fetchPlacements.fulfilled, (state, action) => {
            state.isLoading = false;
            state.placements = action.payload;
        });
        builder.addCase(fetchPlacements.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });
    },
});

export const { resetCompanyState } = companySlice.actions;
export default companySlice.reducer;
