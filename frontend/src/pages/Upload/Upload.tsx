import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Alert,
  Paper,
  Chip,
  Grid,
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  CheckCircle,
  Error,
  Delete,
  Description,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnackbar } from 'notistack';
import { uploadAPI } from '../../services/api/uploadAPI';
import { RootState, AppDispatch } from '../../store/store';
import {
  setFile,
  setProgress,
  setUploading,
  setError,
  setSuccess,
  resetUpload,
} from '../../store/slices/uploadSlice';

interface FileWithPreview extends File {
  preview?: string;
}

const Upload: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();
  const { currentFile, uploadProgress, uploading, error, success, insights } = useSelector(
    (state: RootState) => state.upload
  );

  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: true,
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      enqueueSnackbar('Please select files to upload', { variant: 'warning' });
      return;
    }

    dispatch(setUploading(true));

    for (const file of files) {
      try {
        dispatch(setFile(file));
        
        const response = await uploadAPI.uploadFile(file, (progress) => {
          dispatch(setProgress(progress));
        });

        if (response.data.success) {
          dispatch(setSuccess(response.data.data));
          enqueueSnackbar(`${file.name} uploaded successfully`, { variant: 'success' });
          
          setUploadHistory((prev) => [
            {
              fileName: file.name,
              recordsProcessed: response.data.data.recordsProcessed,
              uploadDate: new Date(),
              status: 'success',
            },
            ...prev,
          ]);
        }
      } catch (error: any) {
        dispatch(setError(error.message));
        enqueueSnackbar(`Failed to upload ${file.name}: ${error.message}`, {
          variant: 'error',
        });
        
        setUploadHistory((prev) => [
          {
            fileName: file.name,
            uploadDate: new Date(),
            status: 'failed',
            error: error.message,
          },
          ...prev,
        ]);
      }
    }

    dispatch(setUploading(false));
    setFiles([]);
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    dispatch(resetUpload());
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Upload Survey Data
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          {/* Dropzone */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragActive ? 'action.hover' : 'background.default',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <input {...getInputProps()} />
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive
                    ? 'Drop the files here...'
                    : 'Drag & drop files here, or click to select'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported formats: CSV, XLS, XLSX
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Selected Files */}
          {files.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Selected Files ({files.length})</Typography>
                  <Button color="error" onClick={clearAll}>
                    Clear All
                  </Button>
                </Box>
                <List>
                  <AnimatePresence>
                    {files.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ListItem
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => removeFile(index)}
                            >
                              <Delete />
                            </IconButton>
                          }
                        >
                          <ListItemIcon>
                            <InsertDriveFile />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.name}
                            secondary={`${(file.size / 1024).toFixed(2)} KB`}
                          />
                        </ListItem>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </List>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleUpload}
                  disabled={uploading}
                  startIcon={<CloudUpload />}
                  sx={{ mt: 2 }}
                >
                  {uploading ? 'Uploading...' : 'Upload Files'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Upload Progress */}
          {uploading && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="body2" gutterBottom>
                  Uploading {currentFile?.name}...
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" sx={{ mt: 1 }}>
                  {uploadProgress}% Complete
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Success Message with Insights */}
          {success && insights && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upload Successful!
              </Typography>
              {insights.insights && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    Key Insights:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {insights.insights.map((insight, index) => (
                      <li key={index}>
                        <Typography variant="caption">{insight}</Typography>
                      </li>
                    ))}
                  </ul>
                </Box>
              )}
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
        </Grid>

        {/* Upload History */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Uploads
              </Typography>
              {uploadHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No uploads yet
                </Typography>
              ) : (
                <List>
                  {uploadHistory.slice(0, 5).map((upload, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {upload.status === 'success' ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Error color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={upload.fileName}
                        secondary={
                          <>
                            {new Date(upload.uploadDate).toLocaleString()}
                            {upload.recordsProcessed && (
                              <Chip
                                label={`${upload.recordsProcessed} records`}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Upload Instructions
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              1. Select or drag files to the upload area
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              2. Review selected files
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              3. Click "Upload Files" to process
            </Typography>
            <Typography variant="body2" color="text.secondary">
              4. View AI-generated insights after upload
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Upload;
