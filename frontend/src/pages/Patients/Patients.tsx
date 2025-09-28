import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Search,
  FilterList,
  PersonAdd,
  TrendingUp,
  TrendingDown,
  RemoveRedEye,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { patientsAPI } from '../../services/api/patientsAPI';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { setSelectedPatient } from '../../store/slices/patientsSlice';

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortModel, setSortModel] = useState<any>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', paginationModel.page, paginationModel.pageSize, searchQuery, sortModel],
    queryFn: async () => {
      const response = await patientsAPI.getPatients({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: searchQuery,
        sortBy: sortModel[0]?.field,
        sortOrder: sortModel[0]?.sort,
      });
      return response.data;
    },
  });

  const handleViewPatient = (patient: any) => {
    dispatch(setSelectedPatient(patient));
    navigate(`/patients/${patient.patientId}`);
  };

  const columns: GridColDef[] = [
    {
      field: 'patientId',
      headerName: 'Patient ID',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 30, height: 30, mr: 1, bgcolor: 'primary.main' }}>
            {params.value.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'totalEvents',
      headerName: 'Total Events',
      width: 120,
      type: 'number',
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} size="small" color="primary" />
      ),
    },
    {
      field: 'uniqueEvents',
      headerName: 'Unique Events',
      width: 130,
      type: 'number',
    },
    {
      field: 'lastEvent',
      headerName: 'Last Activity',
      width: 180,
      renderCell: (params: GridRenderCellParams) => {
        const date = new Date(params.value);
        const daysAgo = Math.floor(
          (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
        );
        return (
          <Box>
            <Typography variant="body2">
              {date.toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'avgSatisfaction',
      headerName: 'Avg Satisfaction',
      width: 140,
      type: 'number',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value || 0;
        const color = value >= 4 ? 'success' : value >= 2.5 ? 'warning' : 'error';
        return (
          <Chip
            label={`${value.toFixed(1)}/5`}
            size="small"
            color={color}
            icon={value >= 3 ? <TrendingUp /> : <TrendingDown />}
          />
        );
      },
    },
    {
      field: 'daysInactive',
      headerName: 'Days Inactive',
      width: 120,
      type: 'number',
      renderCell: (params: GridRenderCellParams) => {
        const days = params.value;
        const color = days > 30 ? 'error' : days > 14 ? 'warning' : 'success';
        return <Chip label={`${days}d`} size="small" color={color} />;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size="small"
          startIcon={<RemoveRedEye />}
          onClick={() => handleViewPatient(params.row)}
        >
          View
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load patients. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Patients
        </Typography>
        <Button variant="contained" startIcon={<PersonAdd />}>
          Add Patient
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small">
                    <FilterList />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <DataGrid
              rows={data?.patients || []}
              columns={columns}
              getRowId={(row) => row.patientId}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            autoHeight
            disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer',
                  backgroundColor: 'action.hover',
                },
              }}
              onRowClick={(params) => handleViewPatient(params.row)}
            />
          </motion.div>
        </Box>
      </Card>
    </Box>
  );
};

export default Patients;
