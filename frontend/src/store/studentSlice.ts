import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Student, UpdateStudentDto } from '../types/student';
import type { Opportunity } from '../types/company';
import type { Application } from '../types/application';
import StudentService from '../services/studentService';

interface StudentState {
    profile: Student | null;
    opportunities: Opportunity[]; // For Discovery
    applications: Application[];  // My Applications
    dashboardStats: any | null;
    matchIntelligence: any[];
    automationLogs: any[];
    learningPath: any[];
    academicRecords: any[];
    isLoading: boolean;
    isAcademicLoading: boolean;
    isMatchingLoading: boolean;
    error: string | null;
    updateSuccess: boolean;
    applySuccess: boolean;
    autoMatchResult: string | null;
}

const initialState: StudentState = {
    profile: null,
    opportunities: [],
    applications: [],
    dashboardStats: null,
    matchIntelligence: [],
    automationLogs: [],
    learningPath: [],
    academicRecords: [],
    isLoading: false,
    isAcademicLoading: false,
    isMatchingLoading: false,
    error: null,
    updateSuccess: false,
    applySuccess: false,
    autoMatchResult: null,
};

// Async Thunks
export const fetchStudentProfile = createAsyncThunk(
    'student/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            return await StudentService.getProfile();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
        }
    }
);

export const updateStudentProfile = createAsyncThunk(
    'student/updateProfile',
    async (data: UpdateStudentDto, { rejectWithValue }) => {
        try {
            return await StudentService.updateProfile(data);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
        }
    }
);

export const fetchOpportunities = createAsyncThunk(
    'student/fetchOpportunities',
    async (_, { rejectWithValue }) => {
        try {
            return await StudentService.getOpportunities();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch jobs');
        }
    }
);

export const applyToJob = createAsyncThunk(
    'student/applyToJob',
    async (id: string, { rejectWithValue }) => {
        try {
            return await StudentService.applyToOpportunity(id);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to apply');
        }
    }
);

export const fetchMyApplications = createAsyncThunk(
    'student/fetchMyApplications',
    async (_, { rejectWithValue }) => {
        try {
            return await StudentService.getMyApplications();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch applications');
        }
    }
);

export const fetchAcademicRecords = createAsyncThunk(
    'student/fetchAcademicRecords',
    async (_, { rejectWithValue }) => {
        try {
            return await StudentService.getAcademicRecords();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch academic records');
        }
    }
);

export const fetchMatchIntelligence = createAsyncThunk(
    'student/fetchMatchIntelligence',
    async (_, { rejectWithValue }) => {
        try {
            return await StudentService.getMatchIntelligence();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch match intelligence');
        }
    }
);

export const fetchDashboardData = createAsyncThunk(
    'student/fetchDashboardData',
    async (_, { rejectWithValue }) => {
        try {
            const [stats, logs, path] = await Promise.all([
                StudentService.getDashboardStats(),
                StudentService.getAutomationLog(),
                StudentService.getLearningPath()
            ]);
            return { stats, logs, path };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard data');
        }
    }
);

const studentSlice = createSlice({
    name: 'student',
    initialState,
    reducers: {
        clearStudentErrors: (state) => {
            state.error = null;
            state.updateSuccess = false;
        },
        resetStudentState: () => initialState,
        resetAutoMatchState: (state) => { state.autoMatchResult = null; },
        clearInstitutionalData: (state) => {
            state.academicRecords = [];
            state.learningPath = [];
            state.dashboardStats = null;
            state.matchIntelligence = [];
            if (state.profile) {
                state.profile.first_name = '';
                state.profile.last_name = '';
                state.profile.course_of_study = '';
                state.profile.skills = [];
                state.profile.interests = [];
            }
        },
        clearMatchData: (state) => {
            state.matchIntelligence = [];
            state.academicRecords = [];
            state.dashboardStats = null;
            state.isMatchingLoading = true;
            state.isAcademicLoading = true;
        }
    },
    extraReducers: (builder) => {
        // Fetch Profile
        builder.addCase(fetchStudentProfile.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchStudentProfile.fulfilled, (state, action: PayloadAction<Student>) => {
            state.isLoading = false;
            state.profile = action.payload;
        });
        builder.addCase(fetchStudentProfile.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Update Profile
        builder.addCase(updateStudentProfile.pending, (state) => {
            state.isLoading = true;
            state.error = null;
            state.updateSuccess = false;
        });
        builder.addCase(updateStudentProfile.fulfilled, (state, action: PayloadAction<Student>) => {
            state.isLoading = false;
            state.profile = action.payload;
            state.updateSuccess = true;
        });
        builder.addCase(updateStudentProfile.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Opportunities
        builder.addCase(fetchOpportunities.fulfilled, (state, action) => {
            state.opportunities = action.payload || [];
        });

        // Applications
        builder.addCase(fetchMyApplications.fulfilled, (state, action) => {
            state.applications = action.payload || [];
        });

        // Apply Logic
        builder.addCase(applyToJob.pending, (state) => { state.isLoading = true; state.applySuccess = false; });
        builder.addCase(applyToJob.fulfilled, (state) => {
            state.isLoading = false;
            state.applySuccess = true;
            // Ideally refetch pending applications or push to list, but refetch is safer
        });
        builder.addCase(applyToJob.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Auto Match
        builder.addCase(runAutoMatch.pending, (state) => { state.isLoading = true; state.autoMatchResult = null; });
        builder.addCase(runAutoMatch.fulfilled, (state, action) => {
            state.isLoading = false;
            state.autoMatchResult = action.payload.message;
        });

        // Toggle Settings (Just update profile locally for speed)
        builder.addCase(toggleAutoApply.fulfilled, (state, action) => {
            if (state.profile) {
                state.profile.auto_apply_enabled = action.payload.auto_apply_enabled;
            }
        });

        // Dashboard Data
        builder.addCase(fetchDashboardData.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchDashboardData.fulfilled, (state, action) => {
            state.isLoading = false;
            state.dashboardStats = action.payload.stats;
            state.automationLogs = action.payload.logs;
            state.learningPath = action.payload.path;
        });
        builder.addCase(fetchDashboardData.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Academic Records
        builder.addCase(fetchAcademicRecords.pending, (state) => {
            state.isAcademicLoading = true;
        });
        builder.addCase(fetchAcademicRecords.fulfilled, (state, action) => {
            state.isAcademicLoading = false;
            state.academicRecords = action.payload || [];
        });
        builder.addCase(fetchAcademicRecords.rejected, (state) => {
            state.isAcademicLoading = false;
        });

        // Match Intelligence
        builder.addCase(fetchMatchIntelligence.pending, (state) => {
            state.isMatchingLoading = true;
        });
        builder.addCase(fetchMatchIntelligence.fulfilled, (state, action) => {
            state.isMatchingLoading = false;
            state.matchIntelligence = action.payload || [];
        });
        builder.addCase(fetchMatchIntelligence.rejected, (state) => {
            state.isMatchingLoading = false;
        });
    },
});

export const runAutoMatch = createAsyncThunk(
    'student/runAutoMatch',
    async (_, { rejectWithValue }) => {
        try {
            return await StudentService.runAutoMatch();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Auto-match failed');
        }
    }
);

export const toggleAutoApply = createAsyncThunk(
    'student/toggleAutoApply',
    async (enabled: boolean, { rejectWithValue }) => {
        try {
            return await StudentService.toggleAutoApply(enabled);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to toggle settings');
        }
    }
);

export const {
    clearStudentErrors,
    resetStudentState,
    resetAutoMatchState,
    clearInstitutionalData,
    clearMatchData
} = studentSlice.actions;
export default studentSlice.reducer;
