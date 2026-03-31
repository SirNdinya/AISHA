import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import InstitutionService, { type StudentImportDto, type InstitutionStats } from '../services/institutionService';

interface InstitutionState {
    stats: InstitutionStats | null;
    isLoading: boolean;
    error: string | null;
    importSuccess: string | null;
    createDeptSuccess: string | null;
}

const initialState: InstitutionState = {
    stats: null,
    isLoading: false,
    error: null,
    importSuccess: null,
    createDeptSuccess: null,
};

// Thunks
export const importStudents = createAsyncThunk(
    'institution/importStudents',
    async ({ students, institutionId }: { students: StudentImportDto[], institutionId: string }, { rejectWithValue }) => {
        try {
            return await InstitutionService.importStudents(students, institutionId);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Import failed');
        }
    }
);

export const fetchInstitutionStats = createAsyncThunk(
    'institution/fetchStats',
    async (institutionId: string, { rejectWithValue }) => {
        try {
            return await InstitutionService.getStats(institutionId);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
        }
    }
);

export const createDepartment = createAsyncThunk(
    'institution/createDepartment',
    async (data: Parameters<typeof InstitutionService.createDepartment>[0], { rejectWithValue }) => {
        try {
            return await InstitutionService.createDepartment(data);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create department');
        }
    }
);

const institutionSlice = createSlice({
    name: 'institution',
    initialState,
    reducers: {
        resetImportState: (state) => { state.importSuccess = null; state.error = null; },
        resetCreateDeptState: (state) => { state.createDeptSuccess = null; state.error = null; }
    },
    extraReducers: (builder) => {
        // Import
        builder.addCase(importStudents.pending, (state) => { state.isLoading = true; state.error = null; state.importSuccess = null; });
        builder.addCase(importStudents.fulfilled, (state) => {
            state.isLoading = false;
            state.importSuccess = 'Students imported successfully';
        });
        builder.addCase(importStudents.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Stats
        builder.addCase(fetchInstitutionStats.fulfilled, (state, action) => {
            state.stats = action.payload;
        });

        // Create Department
        builder.addCase(createDepartment.pending, (state) => { state.isLoading = true; state.error = null; state.createDeptSuccess = null; });
        builder.addCase(createDepartment.fulfilled, (state) => {
            state.isLoading = false;
            state.createDeptSuccess = 'Department created successfully';
        });
        builder.addCase(createDepartment.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });
    },
});

export const { resetImportState, resetCreateDeptState } = institutionSlice.actions;
export default institutionSlice.reducer;
