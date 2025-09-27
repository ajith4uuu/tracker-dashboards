import apiClient from './apiClient';

export const uploadAPI = {
  uploadFile: (file: File, onUploadProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post('/api/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      },
    });
  },

  uploadMultipleFiles: (
    files: File[],
    onUploadProgress?: (progress: number) => void
  ) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    return apiClient.post('/api/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      },
    });
  },

  getUploadHistory: () => {
    return apiClient.get('/api/upload/history');
  },
};
