import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  ButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  List,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import {
  Download,
  TrendingUp,
  CompareArrows,
  Timeline,
  PeopleAlt,
  FilterAlt,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  AreaChart,
  Area,
} from 'recharts';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { analyticsAPI } from '../../services/api/analyticsAPI';
import { useSnackbar } from 'notistack';

type ViewType = 'trends' | 'funnel' | 'cohorts' | 'comparison';

const COLORS = ['#FF69B4', '#4A90E2', '#4CAF50', '#FF9800', '#9C27B0'];

const Analytics: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [viewType, setViewType] = useState<ViewType>('trends');
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(30, 'day'),
    end: dayjs(),
  });
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [cohortBy, setCohortBy] = useState('month');

  // Fetch trends data
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-trends', dateRange, selectedMetric],
    queryFn: async () => {
      const response = await analyticsAPI.getTrends({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        metric: selectedMetric !== 'all' ? selectedMetric : undefined,
      });
      return response.data;
    },
    enabled: viewType === 'trends',
  });

  // Fetch funnel data
  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: ['analytics-funnel'],
    queryFn: async () => {
      const response = await analyticsAPI.getFunnelAnalysis({
        events: 'registration,first_survey,second_survey,completion',
      });
      return response.data;
    },
    enabled: viewType === 'funnel',
  });

  // Fetch cohort data
  const { data: cohortData, isLoading: cohortLoading } = useQuery({
    queryKey: ['analytics-cohorts', cohortBy],
    queryFn: async () => {
      const response = await analyticsAPI.getCohortAnalysis({
        cohortBy,
        metric: 'retention',
      });
      return response.data;
    },
    enabled: viewType === 'cohorts',
  });

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await analyticsAPI.exportData({
        format,
        table: 'analytics_results',
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      });

      // Create download link
      const blob = new Blob(
        [format === 'csv' ? response.data : JSON.stringify(response.data)],
        { type: format === 'csv' ? 'text/csv' : 'application/json' }
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-export-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      enqueueSnackbar(`Data exported as ${format.toUpperCase()}`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Export failed', { variant: 'error' });
    }
  };

  const isLoading = trendsLoading || funnelLoading || cohortLoading;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Advanced Analytics
        </Typography>
        <ButtonGroup variant="outlined">
          <Button startIcon={<Download />} onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
          <Button onClick={() => handleExport('json')}>Export JSON</Button>
        </ButtonGroup>
      </Box>

      {/* View Type Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={(e, newView) => newView && setViewType(newView)}
          aria-label="analytics view"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="trends" aria-label="trends">
            <Timeline sx={{ mr: 1 }} />
            Trends
          </ToggleButton>
          <ToggleButton value="funnel" aria-label="funnel">
            <FilterAlt sx={{ mr: 1 }} />
            Funnel
          </ToggleButton>
          <ToggleButton value="cohorts" aria-label="cohorts">
            <PeopleAlt sx={{ mr: 1 }} />
            Cohorts
          </ToggleButton>
          <ToggleButton value="comparison" aria-label="comparison">
            <CompareArrows sx={{ mr: 1 }} />
            Comparison
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Filters */}
        {viewType === 'trends' && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Metric</InputLabel>
              <Select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                label="Metric"
              >
                <MenuItem value="all">All Metrics</MenuItem>
                <MenuItem value="satisfaction">Satisfaction</MenuItem>
                <MenuItem value="completion">Completion Rate</MenuItem>
                <MenuItem value="engagement">Engagement</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {viewType === 'cohorts' && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Cohort By</InputLabel>
            <Select
              value={cohortBy}
              onChange={(e) => setCohortBy(e.target.value)}
              label="Cohort By"
            >
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
            </Select>
          </FormControl>
        )}
      </Paper>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Trends View */}
          {viewType === 'trends' && trendsData && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Patient Activity Trends
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={trendsData.trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="unique_patients"
                          stackId="1"
                          stroke="#FF69B4"
                          fill="#FF69B4"
                        />
                        <Area
                          type="monotone"
                          dataKey="total_events"
                          stackId="1"
                          stroke="#4A90E2"
                          fill="#4A90E2"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Key Insights */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Trend Insights
                  </Typography>
                  <Grid container spacing={2}>
                    {trendsData.insights?.patterns?.map((pattern: string, index: number) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="body2">{pattern}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Funnel View */}
          {viewType === 'funnel' && funnelData && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Conversion Funnel
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={funnelData.funnel}
                        layout="horizontal"
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="event" type="category" />
                        <Tooltip />
                        <Bar dataKey="patients" fill="#FF69B4">
                          <LabelList dataKey="patients" position="right" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Conversion Rates
                    </Typography>
                    <List>
                      {funnelData.conversions?.map((conv: any, index: number) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {conv.from} → {conv.to}
                          </Typography>
                          <Typography variant="h5">
                            {conv.rate}%
                          </Typography>
                        </Box>
                      ))}
                    </List>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Overall Conversion
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {funnelData.overallConversion}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Cohorts View */}
          {viewType === 'cohorts' && cohortData && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cohort Analysis - Retention
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Cohort</TableCell>
                        <TableCell align="right">Day 0</TableCell>
                        <TableCell align="right">Week 1</TableCell>
                        <TableCell align="right">Week 2</TableCell>
                        <TableCell align="right">Month 1</TableCell>
                        <TableCell align="right">After Month</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cohortData.cohorts?.map((cohort: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(cohort.cohort).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">{cohort.day_0}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={cohort.week_1}
                              size="small"
                              color={cohort.week_1 > cohort.day_0 * 0.5 ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={cohort.week_2}
                              size="small"
                              color={cohort.week_2 > cohort.day_0 * 0.3 ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={cohort.month_1}
                              size="small"
                              color={cohort.month_1 > cohort.day_0 * 0.2 ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="right">{cohort.after_month}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Comparison View */}
          {viewType === 'comparison' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Period Comparison
                </Typography>
                <Alert severity="info">
                  Select two date ranges to compare metrics between periods
                </Alert>
                {/* Comparison implementation would go here */}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </Box>
  );
};


export default Analytics;
