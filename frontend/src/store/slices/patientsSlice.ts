import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Patient {
  patientId: string;
  totalEvents: number;
  firstEvent: Date;
  lastEvent: Date;
  uniqueEvents: number;
  avgSatisfaction: number;
  daysInactive: number;
}

interface PatientsState {
  patients: Patient[];
  selectedPatient: Patient | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: PatientsState = {
  patients: [],
  selectedPatient: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    setPatients: (state, action: PayloadAction<Patient[]>) => {
      state.patients = action.payload;
    },
    setSelectedPatient: (state, action: PayloadAction<Patient | null>) => {
      state.selectedPatient = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPagination: (state, action: PayloadAction<typeof initialState.pagination>) => {
      state.pagination = action.payload;
    },
  },
});

export const {
  setPatients,
  setSelectedPatient,
  setLoading,
  setError,
  setPagination,
} = patientsSlice.actions;

export default patientsSlice.reducer;
