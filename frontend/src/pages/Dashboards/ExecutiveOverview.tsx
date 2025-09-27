import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info,
  Download,
  Refresh,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import type { ExecutiveOverviewDashboard, DashboardMetric } from '../../types/dashboards';

const COLORS = {
  primary: '#FF69B4',
  secondary: '#4A90E2',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#00BCD4',
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
  target?: number;
  status?: 'success' | 'warning' | 'error';
  info?: string;
}> = ({ title, value, unit, trend, changePercent, target, status, info }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp sx={{ color: status === 'error' ? COLORS.error : COLORS.success }} />;
      case 'down':
        return <TrendingDown sx={{ color: status === 'success' ? COLORS.success : COLORS.error }} />;
      default:
        return <TrendingFlat sx={{ color: COLORS.info }} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return COLORS.success;
      case 'warning':
        return COLORS.warning;
      case 'error':
        return COLORS.error;
      default:
        return COLORS.primary;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ height: '100%', position: 'relative' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {info && (
              <Tooltip title={info}>
                <IconButton size="small">
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          
          <Typography variant="h4" component="div" sx={{ fontWeight: 600, my: 1 }}>
            {value}
            {unit && <Typography component="span" variant="h6" sx={{ ml: 0.5, color: 'text.secondary' }}>
              {unit}
            </Typography>}
          </Typography>

          {target && (
            <LinearProgress
              variant="determinate"
              value={Math.min((Number(value) / target) * 100, 100)}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getStatusColor(),
                },
                my: 1,
              }}
            />
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {trend && getTrendIcon()}
            {changePercent !== undefined && (
              <Chip
                label={`${changePercent > 0 ? '+' : ''}${changePercent}%`}
                size="small"
                sx={{
                  backgroundColor: `${getStatusColor()}20`,
                  color: getStatusColor(),
                  fontWeight: 500,
                }}
              />
            )}
            {target && (
              <Typography variant="caption" color="text.secondary">
                Target: {target}{unit}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ExecutiveOverview: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshInterval, setRefreshInterval] = useState(60000); // 1 minute

  const { data, isLoading, error, refetch } = useQuery<ExecutiveOverviewDashboard>({
    queryKey: ['executive-overview', timeRange],
    queryFn: () => dashboardAPI.getExecutiveOverview(timeRange),
    refetchInterval: refreshInterval,
  });

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, refetch]);

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Failed to load dashboard data</Typography>
      </Box>
    );
  }

  // Calculate derived metrics
  const completionStatus = data.completionRate.current >= data.completionRate.target ? 'success' : 
                           data.completionRate.current >= data.completionRate.target * 0.9 ? 'warning' : 'error';
  
  const satisfactionStatus = data.topBoxSatisfaction.percent >= 75 ? 'success' :
                             data.topBoxSatisfaction.percent >= 50 ? 'warning' : 'error';

  const ahrqComparison = data.ahrqBenchmark.comparison === 'above' ? 'success' :
                         data.ahrqBenchmark.comparison === 'at' ? 'warning' : 'error';

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Executive Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time survey performance metrics with AHRQ benchmarking
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Submissions"
            value={data.submissions.total.toLocaleString()}
            trend={data.submissions.changePercent > 0 ? 'up' : data.submissions.changePercent < 0 ? 'down' : 'stable'}
            changePercent={data.submissions.changePercent}
            info="Total survey submissions received in the selected time period"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Completion Rate"
            value={`${data.completionRate.current}%`}
            target={data.completionRate.target}
            status={completionStatus}
            trend={data.completionRate.trend30Days[data.completionRate.trend30Days.length - 1]?.value > 
                   data.completionRate.trend30Days[0]?.value ? 'up' : 'down'}
            info="Percentage of started surveys that were completed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Median Time to Complete"
            value={data.medianTimeToComplete.minutes}
            unit="min"
            status={data.medianTimeToComplete.minutes <= 15 ? 'success' : 
                    data.medianTimeToComplete.minutes <= 25 ? 'warning' : 'error'}
            info="Median time taken to complete the survey"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Top-Box Satisfaction"
            value={`${data.topBoxSatisfaction.percent}%`}
            status={satisfactionStatus}
            trend={data.topBoxSatisfaction.trend30Days[data.topBoxSatisfaction.trend30Days.length - 1]?.value > 
                   data.topBoxSatisfaction.trend30Days[0]?.value ? 'up' : 'down'}
            info="Percentage rating satisfaction as 9 or 10 out of 10"
          />
        </Grid>
      </Grid>

      {/* AHRQ Benchmark Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6">AHRQ CAHPS Benchmark</Typography>
                  <Chip
                    icon={ahrqComparison === 'success' ? <CheckCircle /> : 
                          ahrqComparison === 'warning' ? <Warning /> : <ErrorIcon />}
                    label={`${data.ahrqBenchmark.percentile}th Percentile`}
                    color={ahrqComparison}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h3" sx={{ fontWeight: 600 }}>
                    {data.ahrqBenchmark.score}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Composite Score
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={data.ahrqBenchmark.percentile}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: ahrqComparison === 'success' ? COLORS.success :
                                      ahrqComparison === 'warning' ? COLORS.warning : COLORS.error,
                    },
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption">0th</Typography>
                  <Typography variant="caption">25th</Typography>
                  <Typography variant="caption">50th</Typography>
                  <Typography variant="caption">75th</Typography>
                  <Typography variant="caption">100th</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trend Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Submission Trend (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.submissions.trend30Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                />
                <YAxis />
                <ChartTooltip 
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={COLORS.primary} 
                  fill={COLORS.primary} 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Satisfaction & NPS Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.topBoxSatisfaction.trend30Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                />
                <YAxis domain={[0, 100]} />
                <ChartTooltip 
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={COLORS.success} 
                  name="Satisfaction %"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="nps" 
                  stroke={COLORS.secondary} 
                  name="NPS Score"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Time to Complete Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.medianTimeToComplete.distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <ChartTooltip />
                <Bar 
                  dataKey="value" 
                  fill={COLORS.secondary}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExecutiveOverview;
