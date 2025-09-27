import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UploadState {
  currentFile: File | null;
  uploadProgress: number;
  uploading: boolean;
  error: string | null;
  success: boolean;
  insights: {
    insights: string[];
    recommendations: string[];
  } | null;
}

const initialState: UploadState = {
  currentFile: null,
  uploadProgress: 0,
  uploading: false,
  error: null,
  success: false,
  insights: null,
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    setFile: (state, action: PayloadAction<File | null>) => {
      state.currentFile = action.payload;
      state.error = null;
      state.success = false;
    },
    setProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    setUploading: (state, action: PayloadAction<boolean>) => {
      state.uploading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.uploading = false;
    },
    setSuccess: (state, action: PayloadAction<any>) => {
      state.success = true;
      state.uploading = false;
      state.insights = action.payload;
    },
    resetUpload: (state) => {
      state.currentFile = null;
      state.uploadProgress = 0;
      state.uploading = false;
      state.error = null;
      state.success = false;
      state.insights = null;
    },
  },
});

export const {
  setFile,
  setProgress,
  setUploading,
  setError,
  setSuccess,
  resetUpload,
} = uploadSlice.actions;

export default uploadSlice.reducer;
