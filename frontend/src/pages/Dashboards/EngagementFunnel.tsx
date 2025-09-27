import React, { useState } from 'react';
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
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingDown,
  Info,
  Download,
  Refresh,
  Warning,
  CheckCircle,
  Cancel,
  Email,
  Visibility,
  TouchApp,
  Done,
} from '@mui/icons-material';
import {
  FunnelChart,
  Funnel,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Sankey,
  Rectangle,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import type { EngagementFunnelDashboard } from '../../types/dashboards';

const COLORS = {
  invited: '#4A90E2',
  opened: '#7B68EE',
  started: '#FF69B4',
  completed: '#4CAF50',
  dropped: '#FF6B6B',
};

const EngagementFunnel: React.FC = () => {
  const [cohort, setCohort] = useState('all');
  const [surveyId, setSurveyId] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');

  const { data, isLoading, error, refetch } = useQuery<EngagementFunnelDashboard>({
    queryKey: ['engagement-funnel', cohort, surveyId, timeRange],
    queryFn: () => dashboardAPI.getEngagementFunnel({ cohort, surveyId, timeRange }),
    refetchInterval: 300000, // 5 minutes
  });

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
        <Alert severity="error">Failed to load engagement funnel data</Alert>
      </Box>
    );
  }

  // Calculate conversion rates
  const conversionRates = {
    inviteToOpen: ((data.funnel.opened / data.funnel.invited) * 100).toFixed(1),
    openToStart: ((data.funnel.started / data.funnel.opened) * 100).toFixed(1),
    startToComplete: ((data.funnel.completed / data.funnel.started) * 100).toFixed(1),
    overall: ((data.funnel.completed / data.funnel.invited) * 100).toFixed(1),
  };

  // Prepare funnel data
  const funnelData = [
    { 
      name: 'Invited', 
      value: data.funnel.invited, 
      fill: COLORS.invited,
      icon: <Email />,
      percentage: 100,
    },
    { 
      name: 'Opened', 
      value: data.funnel.opened, 
      fill: COLORS.opened,
      icon: <Visibility />,
      percentage: (data.funnel.opened / data.funnel.invited) * 100,
    },
    { 
      name: 'Started', 
      value: data.funnel.started, 
      fill: COLORS.started,
      icon: <TouchApp />,
      percentage: (data.funnel.started / data.funnel.invited) * 100,
    },
    { 
      name: 'Completed', 
      value: data.funnel.completed, 
      fill: COLORS.completed,
      icon: <Done />,
      percentage: (data.funnel.completed / data.funnel.invited) * 100,
    },
  ];

  // Custom funnel shape
  const FunnelShape = (props: any) => {
    const { x, y, width, height, fill } = props;
    const path = `
      M ${x},${y}
      L ${x + width},${y}
      L ${x + width * 0.9},${y + height}
      L ${x + width * 0.1},${y + height}
      Z
    `;
    return <path d={path} fill={fill} stroke="none" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Engagement Funnel Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track survey engagement from invitation to completion (AHRQ Standard)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Cohort</InputLabel>
            <Select value={cohort} onChange={(e) => setCohort(e.target.value)} label="Cohort">
              <MenuItem value="all">All Patients</MenuItem>
              <MenuItem value="new">New Patients</MenuItem>
              <MenuItem value="returning">Returning</MenuItem>
              <MenuItem value="treatment">In Treatment</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Survey</InputLabel>
            <Select value={surveyId} onChange={(e) => setSurveyId(e.target.value)} label="Survey">
              <MenuItem value="all">All Surveys</MenuItem>
              <MenuItem value="cahps">CAHPS</MenuItem>
              <MenuItem value="promis">PROMIS</MenuItem>
              <MenuItem value="custom">Custom PRO</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()}>
            Refresh
          </Button>
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Overall Conversion
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600, color: COLORS.completed }}>
                {conversionRates.overall}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Invite → Complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Open Rate
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600, color: COLORS.opened }}>
                {conversionRates.inviteToOpen}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Invite → Open
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Start Rate
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600, color: COLORS.started }}>
                {conversionRates.openToStart}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Open → Start
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completion Rate
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600, color: COLORS.completed }}>
                {conversionRates.startToComplete}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start → Complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Funnel Visualization */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Survey Engagement Funnel
            </Typography>
            <Box sx={{ position: 'relative', height: 400 }}>
              {funnelData.map((stage, index) => {
                const width = 100 - (index * 20);
                const dropOff = index > 0 ? 
                  funnelData[index - 1].value - stage.value : 0;
                const dropOffRate = index > 0 ? 
                  ((dropOff / funnelData[index - 1].value) * 100).toFixed(1) : '0';

                return (
                  <motion.div
                    key={stage.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2,
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${width}%`,
                          height: 60,
                          background: `linear-gradient(90deg, ${stage.fill} 0%, ${stage.fill}dd 100%)`,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          px: 3,
                          position: 'relative',
                          boxShadow: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {stage.icon}
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                            {stage.name}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                            {stage.value.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'white' }}>
                            {stage.percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                      {index > 0 && (
                        <Chip
                          label={`-${dropOffRate}%`}
                          size="small"
                          sx={{
                            position: 'absolute',
                            right: -50,
                            backgroundColor: COLORS.dropped,
                            color: 'white',
                          }}
                        />
                      )}
                    </Box>
                  </motion.div>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Conversion Analysis
            </Typography>
            <Box sx={{ mt: 3 }}>
              {[
                { from: 'Invited', to: 'Opened', rate: conversionRates.inviteToOpen },
                { from: 'Opened', to: 'Started', rate: conversionRates.openToStart },
                { from: 'Started', to: 'Completed', rate: conversionRates.startToComplete },
              ].map((conversion, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {conversion.from} → {conversion.to}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {conversion.rate}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(conversion.rate)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: parseFloat(conversion.rate) > 75 ? COLORS.completed :
                                        parseFloat(conversion.rate) > 50 ? COLORS.started : COLORS.dropped,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Drop-off by Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Drop-off by Survey Section
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Section</TableCell>
                    <TableCell align="right">Started</TableCell>
                    <TableCell align="right">Completed</TableCell>
                    <TableCell align="right">Drop-off Rate</TableCell>
                    <TableCell align="right">Avg. Time (sec)</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.dropOffBySection.map((section) => (
                    <TableRow key={section.section}>
                      <TableCell>{section.section}</TableCell>
                      <TableCell align="right">{section.startedCount.toLocaleString()}</TableCell>
                      <TableCell align="right">{section.completedCount.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${section.dropOffRate.toFixed(1)}%`}
                          size="small"
                          color={section.dropOffRate < 10 ? 'success' : 
                                 section.dropOffRate < 20 ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {Math.round((section.completedCount / section.startedCount) * 120)}
                      </TableCell>
                      <TableCell>
                        {section.dropOffRate < 10 ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : section.dropOffRate < 20 ? (
                          <Warning color="warning" fontSize="small" />
                        ) : (
                          <Cancel color="error" fontSize="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Drop-off Reasons */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Common Drop-off Reasons
            </Typography>
            <Grid container spacing={2}>
              {data.reasonsFlagged.map((reason, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        {reason.reason}
                      </Typography>
                      <Typography variant="h4" sx={{ my: 1 }}>
                        {reason.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Example: "{reason.examples[0]}"
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* AHRQ Benchmark */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          <Typography variant="subtitle2">
            AHRQ Benchmark: Target completion rate ≥85% for CAHPS surveys.
            Current performance: {conversionRates.overall}% overall conversion.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default EngagementFunnel;
