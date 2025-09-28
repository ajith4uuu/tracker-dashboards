import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info,
  Download,
  Refresh,
  FiberManualRecord,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Timeline,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import type { PROMISDashboard } from '../../types/dashboards';

// PROMIS domain colors based on severity
const DOMAIN_COLORS = {
  pain: '#E91E63',
  fatigue: '#9C27B0',
  anxiety: '#3F51B5',
  physicalFunction: '#00BCD4',
  socialFunction: '#4CAF50',
  depression: '#FF5722',
  sleepDisturbance: '#795548',
  cognitiveFunction: '#607D8B',
};

// Severity band colors
const SEVERITY_COLORS = {
  normal: '#4CAF50',
  mild: '#FFC107',
  moderate: '#FF9800',
  severe: '#F44336',
} as const;

type SeverityKey = keyof typeof SEVERITY_COLORS;

const PROMISDomains: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [patientId, setPatientId] = useState('all');
  const [domain, setDomain] = useState('all');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const { data, isLoading, error, refetch } = useQuery<PROMISDashboard>({
    queryKey: ['promis', patientId, domain, timeRange],
    queryFn: () => dashboardAPI.getPROMISScores({ patientId, domain, timeRange }),
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
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          Failed to load PROMIS domain scores
        </Alert>
      </Box>
    );
  }

  // Get severity band for T-score
  const getSeverityBand = (tScore: number): SeverityKey => {
    if (tScore < 55) return 'normal';
    if (tScore < 60) return 'mild';
    if (tScore < 70) return 'moderate';
    return 'severe';
  };

  // Check if change meets MCID threshold
  const meetsMCID = (change: number, threshold: number = 5): boolean => {
    return Math.abs(change) >= threshold;
  };

  // Prepare radar chart data
  const radarData = data.domains.map(d => ({
    domain: d.name.replace(/([A-Z])/g, ' $1').trim(),
    tScore: d.tScore,
    normMean: 50,
  }));

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            PROMIS Domain Scores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Patient-Reported Outcome Measurement with T-scores and MCID tracking (PubMed Central)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="chart">
              <Timeline />
            </ToggleButton>
            <ToggleButton value="table">
              <BarChartIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} label="Time Range">
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
              <MenuItem value="90d">90 Days</MenuItem>
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

      {/* Key Metrics Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {data.domains.slice(0, 4).map((domain) => (
          <Grid item xs={12} sm={6} md={3} key={domain.name}>
            <Card
              sx={{
                borderTop: 4,
                borderColor: SEVERITY_COLORS[domain.severity],
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography color="text.secondary" variant="subtitle2">
                    {domain.name.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Chip
                    icon={<FiberManualRecord />}
                    label={domain.severity}
                    size="small"
                    sx={{
                      backgroundColor: `${SEVERITY_COLORS[domain.severity]}20`,
                      color: SEVERITY_COLORS[domain.severity],
                    }}
                  />
                </Box>
                
                <Typography variant="h3" sx={{ fontWeight: 600 }}>
                  {domain.tScore}
                  <Typography component="span" variant="subtitle1" color="text.secondary">
                    {' '}±{domain.standardError}
                  </Typography>
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {domain.percentile}th percentile
                  </Typography>
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={domain.percentile}
                  sx={{
                    mt: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: SEVERITY_COLORS[domain.severity],
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Clinically Meaningful Change */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#E8F5E9' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircle sx={{ color: SEVERITY_COLORS.normal }} />
                <Typography variant="h6">Improved</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 600, color: SEVERITY_COLORS.normal }}>
                {data.clinicallyMeaningfulChange.improved.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Domains with MCID improvement
              </Typography>
              <Box sx={{ mt: 2 }}>
                {data.clinicallyMeaningfulChange.improved.map((d, idx) => (
                  <Chip
                    key={idx}
                    label={d}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#FFF3E0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingFlat sx={{ color: SEVERITY_COLORS.mild }} />
                <Typography variant="h6">Stable</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 600, color: SEVERITY_COLORS.mild }}>
                {data.clinicallyMeaningfulChange.stable.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Domains within MCID threshold
              </Typography>
              <Box sx={{ mt: 2 }}>
                {data.clinicallyMeaningfulChange.stable.map((d, idx) => (
                  <Chip
                    key={idx}
                    label={d}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#FFEBEE' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Warning sx={{ color: SEVERITY_COLORS.severe }} />
                <Typography variant="h6">Worsened</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 600, color: SEVERITY_COLORS.severe }}>
                {data.clinicallyMeaningfulChange.worsened.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Domains with MCID deterioration
              </Typography>
              <Box sx={{ mt: 2 }}>
                {data.clinicallyMeaningfulChange.worsened.map((d, idx) => (
                  <Chip
                    key={idx}
                    label={d}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Visualization */}
      <Grid container spacing={3}>
        {/* Radar Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Domain Profile
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis dataKey="domain" />
                <PolarRadiusAxis angle={90} domain={[30, 80]} ticks={[30, 40, 50, 60, 70, 80] as any} />
                <Radar
                  name="Patient T-Score"
                  dataKey="tScore"
                  stroke="#FF69B4"
                  fill="#FF69B4"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Population Mean"
                  dataKey="normMean"
                  stroke="#4A90E2"
                  fill="#4A90E2"
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* T-Score Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              T-Score Distribution with Severity Bands
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.domains}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[30, 80]} ticks={[30, 40, 50, 60, 70, 80]} />
                <ChartTooltip />
                
                {/* Reference areas for severity bands */}
                <ReferenceArea y1={30} y2={55} fill={SEVERITY_COLORS.normal} fillOpacity={0.1} />
                <ReferenceArea y1={55} y2={60} fill={SEVERITY_COLORS.mild} fillOpacity={0.1} />
                <ReferenceArea y1={60} y2={70} fill={SEVERITY_COLORS.moderate} fillOpacity={0.1} />
                <ReferenceArea y1={70} y2={80} fill={SEVERITY_COLORS.severe} fillOpacity={0.1} />
                
                <ReferenceLine y={50} stroke="#666" strokeDasharray="3 3" label="Population Mean" />
                
                <Bar dataKey="tScore" fill="#FF69B4">
                  {data.domains.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity as SeverityKey]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* MCID Bands Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              MCID Analysis by Domain
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Domain</TableCell>
                    <TableCell align="center">Current T-Score</TableCell>
                    <TableCell align="center">Change from Baseline</TableCell>
                    <TableCell align="center">MCID Threshold</TableCell>
                    <TableCell align="center">Within MCID</TableCell>
                    <TableCell align="center">Clinical Significance</TableCell>
                    <TableCell align="center">IRT Information</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(data.mcidBands).map(([domainName, mcid]) => (
                    <TableRow key={domainName}>
                      <TableCell>{domainName}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={mcid.current.toFixed(1)}
                          size="small"
                          sx={{
                            backgroundColor: `${SEVERITY_COLORS[getSeverityBand(mcid.current)]}20`,
                            color: SEVERITY_COLORS[getSeverityBand(mcid.current)] as string,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          {mcid.current - 50 > 0 ? (
                            <TrendingUp sx={{ fontSize: 16, color: 'error.main' }} />
                          ) : (
                            <TrendingDown sx={{ fontSize: 16, color: 'success.main' }} />
                          )}
                          {Math.abs(mcid.current - 50).toFixed(1)}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{mcid.mcidThreshold}</TableCell>
                      <TableCell align="center">
                        {mcid.withinMCID ? (
                          <CheckCircle sx={{ color: 'success.main' }} />
                        ) : (
                          <Warning sx={{ color: 'warning.main' }} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={mcid.withinMCID ? 'No Change' : 'Significant'}
                          size="small"
                          color={mcid.withinMCID ? 'default' : 'primary'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={`Theta: ${data.itemResponseTheory.theta.toFixed(2)}`}>
                          <IconButton size="small">
                            <Info fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Information Alert */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          <AlertTitle>PROMIS Scoring Information</AlertTitle>
          T-scores have a mean of 50 and standard deviation of 10 in the U.S. general population.
          Scores above 50 represent worse symptoms (except Physical/Social Function where higher is better).
          MCID (Minimally Clinically Important Difference) is typically 5 T-score points.
        </Alert>
      </Box>
    </Box>
  );
};

export default PROMISDomains;
