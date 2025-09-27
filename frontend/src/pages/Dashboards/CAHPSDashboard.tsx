import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  Rating,
  Chip,
  LinearProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  AlertTitle,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Star,
  StarBorder,
  TrendingUp,
  TrendingDown,
  Info,
  Download,
  Refresh,
  ThumbUp,
  ThumbDown,
  SentimentNeutral,
  CheckCircle,
  Warning,
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
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Radar,
  RadarChart,
  PolarGrid,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import type { CAHPSDashboard } from '../../types/dashboards';

const COLORS = {
  provider: '#4A90E2',
  access: '#4CAF50',
  communication: '#FF69B4',
  promoter: '#4CAF50',
  passive: '#FFC107',
  detractor: '#F44336',
  excellent: '#4CAF50',
  good: '#8BC34A',
  fair: '#FFC107',
  poor: '#F44336',
};

const CAHPSDashboardComponent: React.FC = () => {
  const [timeRange, setTimeRange] = useState('90d');
  const [facility, setFacility] = useState('all');
  const [provider, setProvider] = useState('all');

  const { data, isLoading, error, refetch } = useQuery<CAHPSDashboard>({
    queryKey: ['cahps', timeRange, facility, provider],
    queryFn: () => dashboardAPI.getCAHPSMetrics({ timeRange, facility, provider }),
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
          Failed to load CAHPS metrics
        </Alert>
      </Box>
    );
  }

  // Calculate star rating based on CMS methodology
  const getStarRating = (score: number): number => {
    if (score >= 90) return 5;
    if (score >= 80) return 4;
    if (score >= 70) return 3;
    if (score >= 60) return 2;
    return 1;
  };

  // Prepare radar chart data for domains
  const radarData = [
    {
      domain: 'Provider',
      score: data.domains.provider.topBoxPercent,
      benchmark: 85,
    },
    {
      domain: 'Access',
      score: data.domains.access.topBoxPercent,
      benchmark: 82,
    },
    {
      domain: 'Communication',
      score: data.domains.communication.topBoxPercent,
      benchmark: 88,
    },
  ];

  // NPS gauge data
  const npsGaugeData = [
    { name: 'NPS', value: data.npsView.score + 100, fill: '#4A90E2' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            CAHPS Top-Box & Global Ratings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            CMS-compliant patient experience metrics and star ratings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} label="Time Range">
              <MenuItem value="30d">30 Days</MenuItem>
              <MenuItem value="90d">90 Days</MenuItem>
              <MenuItem value="1y">1 Year</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()}>
            Refresh
          </Button>
          <Button variant="outlined" startIcon={<Download />}>
            Export CMS Report
          </Button>
        </Box>
      </Box>

      {/* CMS Star Rating */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'white' }}>
                CMS Star Rating
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Based on CAHPS composite scores
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Rating
                value={data.cmsBenchmark.starRating}
                readOnly
                size="large"
                sx={{
                  '& .MuiRating-iconFilled': { color: '#FFD700' },
                  '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,0.3)' },
                }}
              />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ color: 'white', fontWeight: 600 }}>
                  {data.cmsBenchmark.starRating}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  out of 5 stars
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 600 }}>
                  {data.cmsBenchmark.percentile}
                  <sup style={{ fontSize: '0.5em' }}>th</sup>
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Percentile
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Overall Rating */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Overall Rating
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {data.globalRatings.overallRating}
              </Typography>
              <Rating value={data.globalRatings.overallRating / 2} readOnly precision={0.5} />
              <Typography variant="body2" color="text.secondary">
                Out of 10
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recommend Rating */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Would Recommend
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {data.globalRatings.recommendRating}
              </Typography>
              <Rating value={data.globalRatings.recommendRating / 2} readOnly precision={0.5} />
              <Typography variant="body2" color="text.secondary">
                Out of 10
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* NPS Score */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Net Promoter Score (NPS)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h2" sx={{ fontWeight: 600, color: COLORS.provider }}>
                    {data.npsView.score > 0 ? '+' : ''}{data.npsView.score}
                  </Typography>
                  <Chip
                    label={
                      data.npsView.score > 50 ? 'Excellent' :
                      data.npsView.score > 0 ? 'Good' :
                      data.npsView.score > -50 ? 'Needs Improvement' : 'Critical'
                    }
                    color={
                      data.npsView.score > 50 ? 'success' :
                      data.npsView.score > 0 ? 'primary' :
                      data.npsView.score > -50 ? 'warning' : 'error'
                    }
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ThumbUp sx={{ color: COLORS.promoter }} />
                    <Typography variant="h6">{data.npsView.promoters}%</Typography>
                    <Typography variant="caption">Promoters</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <SentimentNeutral sx={{ color: COLORS.passive }} />
                    <Typography variant="h6">{data.npsView.passives}%</Typography>
                    <Typography variant="caption">Passives</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <ThumbDown sx={{ color: COLORS.detractor }} />
                    <Typography variant="h6">{data.npsView.detractors}%</Typography>
                    <Typography variant="caption">Detractors</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Domain Scores */}
      <Grid container spacing={3}>
        {/* Radar Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              CAHPS Domain Performance
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="domain" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Current Score"
                  dataKey="score"
                  stroke={COLORS.provider}
                  fill={COLORS.provider}
                  fillOpacity={0.6}
                />
                <Radar
                  name="CMS Benchmark"
                  dataKey="benchmark"
                  stroke={COLORS.access}
                  fill={COLORS.access}
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Domain Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top-Box Percentages by Domain
            </Typography>
            
            {/* Provider Domain */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Provider Communication
                </Typography>
                <Chip
                  label={`${data.domains.provider.topBoxPercent}%`}
                  color={data.domains.provider.topBoxPercent >= 85 ? 'success' : 'warning'}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={data.domains.provider.topBoxPercent}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: COLORS.provider,
                  },
                }}
              />
              <Box sx={{ mt: 2 }}>
                {data.domains.provider.items.slice(0, 3).map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {item.question}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {item.topBoxPercent}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Access Domain */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Access to Care
                </Typography>
                <Chip
                  label={`${data.domains.access.topBoxPercent}%`}
                  color={data.domains.access.topBoxPercent >= 82 ? 'success' : 'warning'}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={data.domains.access.topBoxPercent}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: COLORS.access,
                  },
                }}
              />
              <Box sx={{ mt: 2 }}>
                {data.domains.access.items.slice(0, 3).map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {item.question}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {item.topBoxPercent}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Communication Domain */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Staff Communication
                </Typography>
                <Chip
                  label={`${data.domains.communication.topBoxPercent}%`}
                  color={data.domains.communication.topBoxPercent >= 88 ? 'success' : 'warning'}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={data.domains.communication.topBoxPercent}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: COLORS.communication,
                  },
                }}
              />
              <Box sx={{ mt: 2 }}>
                {data.domains.communication.items.slice(0, 3).map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {item.question}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {item.topBoxPercent}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* NPS Breakdown */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              NPS Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { category: 'Detractors (0-6)', value: data.npsView.detractors, fill: COLORS.detractor },
                  { category: 'Passives (7-8)', value: data.npsView.passives, fill: COLORS.passive },
                  { category: 'Promoters (9-10)', value: data.npsView.promoters, fill: COLORS.promoter },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <ChartTooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* CMS Compliance Alert */}
      <Box sx={{ mt: 3 }}>
        <Alert severity={data.cmsBenchmark.starRating >= 4 ? 'success' : 'warning'}>
          <AlertTitle>CMS Star Rating Status</AlertTitle>
          Your facility has a {data.cmsBenchmark.starRating}-star rating, placing you in the {data.cmsBenchmark.percentile}th percentile nationally.
          {data.cmsBenchmark.starRating < 4 && ' Focus on improving provider communication and access to care to achieve 4+ stars.'}
        </Alert>
      </Box>
    </Box>
  );
};

export default CAHPSDashboardComponent;
