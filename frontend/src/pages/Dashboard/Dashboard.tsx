import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  Button,
  ButtonGroup,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
} from '@mui/material';
import {
  People,
  Assessment,
  TrendingUp,
  EventNote,
  Refresh,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { analyticsAPI } from '../../services/api/analyticsAPI';
import { RootState, AppDispatch } from '../../store/store';
import {
  setAnalyticsData,
  setInsights,
  setTimeRange,
} from '../../store/slices/analyticsSlice';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: `${color}20`,
                color: color,
                mr: 2,
              }}
            >
              {icon}
            </Box>
            <Typography color="text.secondary" variant="subtitle2">
              {title}
            </Typography>
          </Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
            {value}
          </Typography>
          {change && (
            <Chip
              label={change}
              size="small"
              color={change.startsWith('+') ? 'success' : 'error'}
              sx={{ fontWeight: 500 }}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { data, insights, timeRange } = useSelector(
    (state: RootState) => state.analytics
  );

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', timeRange],
    queryFn: async () => {
      const response = await analyticsAPI.getDashboard(timeRange);
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  useEffect(() => {
    if (dashboardData) {
      dispatch(setAnalyticsData(dashboardData.data));
      dispatch(setInsights(dashboardData.insights));
    }
  }, [dashboardData, dispatch]);

  const handleTimeRangeChange = (range: typeof timeRange) => {
    dispatch(setTimeRange(range));
  };

  // Chart data
  const lineChartData = {
    labels: data?.patientActivity?.map((d) => 
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ) || [],
    datasets: [
      {
        label: 'Unique Patients',
        data: data?.patientActivity?.map((d) => d.uniquePatients) || [],
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}20`,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Total Events',
        data: data?.patientActivity?.map((d) => d.totalEvents) || [],
        borderColor: theme.palette.secondary.main,
        backgroundColor: `${theme.palette.secondary.main}20`,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const barChartData = {
    labels: data?.eventDistribution?.map((d) => d.eventName) || [],
    datasets: [
      {
        label: 'Event Count',
        data: data?.eventDistribution?.map((d) => d.count) || [],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
        ],
      },
    ],
  };

  const doughnutChartData = {
    labels: data?.completionRates?.map((d) => d.eventName) || [],
    datasets: [
      {
        label: 'Completion Rate',
        data: data?.completionRates?.map((d) => d.completionRate) || [],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.info.main,
        ],
      },
    ],
  };

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
        Failed to load dashboard data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={timeRange === 'day' ? 'contained' : 'outlined'}
              onClick={() => handleTimeRangeChange('day')}
            >
              Day
            </Button>
            <Button
              variant={timeRange === 'week' ? 'contained' : 'outlined'}
              onClick={() => handleTimeRangeChange('week')}
            >
              Week
            </Button>
            <Button
              variant={timeRange === 'month' ? 'contained' : 'outlined'}
              onClick={() => handleTimeRangeChange('month')}
            >
              Month
            </Button>
            <Button
              variant={timeRange === 'year' ? 'contained' : 'outlined'}
              onClick={() => handleTimeRangeChange('year')}
            >
              Year
            </Button>
          </ButtonGroup>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={data?.totalPatients || 0}
            icon={<People />}
            color={theme.palette.primary.main}
            change="+12%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Events"
            value={data?.totalEvents || 0}
            icon={<EventNote />}
            color={theme.palette.secondary.main}
            change="+8%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Completion"
            value={`${Math.round(
              ((data?.completionRates?.reduce((acc, curr) => acc + (curr?.completionRate ?? 0), 0)) ?? 0) /
              ((data?.completionRates?.length ?? 0) || 1)
            )}%`}
            icon={<Assessment />}
            color={theme.palette.success.main}
            change="+5%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Today"
            value={data?.patientActivity?.[0]?.uniquePatients || 0}
            icon={<TrendingUp />}
            color={theme.palette.warning.main}
            change="-2%"
          />
        </Grid>
      </Grid>

      {/* AI Insights */}
      {insights && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            AI Insights
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {insights.summary}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {insights.keyPoints?.slice(0, 3).map((point, index) => (
              <Chip
                key={index}
                label={point}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Patient Activity Trend
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Completion Rates
            </Typography>
            <Box sx={{ height: 300 }}>
              <Doughnut
                data={doughnutChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Event Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
