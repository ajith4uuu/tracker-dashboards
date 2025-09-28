import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  PhoneAndroid,
  Computer,
  Tablet,
  Language,
  Timer,
  Download,
  Refresh,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import type { ResponseQualityDashboard } from '../../types/dashboards';

const COLORS = {
  mobile: '#FF69B4',
  desktop: '#4A90E2',
  tablet: '#4CAF50',
  english: '#9C27B0',
  spanish: '#FF9800',
  other: '#00BCD4',
  good: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
};

const ResponseQualityBias: React.FC = () => {
  const [surveyId, setSurveyId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30d');

  const { data, isLoading, error, refetch } = useQuery<ResponseQualityDashboard>({
    queryKey: ['response-quality', surveyId, dateRange],
    queryFn: () => dashboardAPI.getResponseQuality({
      surveyId: surveyId !== 'all' ? surveyId : undefined,
      // Convert dateRange to start/end dates
    }),
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
          Failed to load response quality data
        </Alert>
      </Box>
    );
  }

  // Calculate quality scores
  const overallQualityScore = 100 - (
    data.itemNonresponse.rate * 0.3 +
    data.straightLining.percentOfResponses * 0.4 +
    (data.timePerQuestion.outliers.filter(o => o.flagged).length / data.timePerQuestion.outliers.length) * 0.3 * 100
  );

  const getQualityStatus = (score: number) => {
    if (score >= 90) return { color: 'success', label: 'Excellent', icon: <CheckCircle /> };
    if (score >= 75) return { color: 'warning', label: 'Good', icon: <Warning /> };
    return { color: 'error', label: 'Needs Attention', icon: <ErrorIcon /> };
  };

  const qualityStatus = getQualityStatus(overallQualityScore);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Response Quality & Bias Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AHRQ-compliant data quality monitoring and bias detection
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
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
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Overall Quality Score */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Overall Response Quality Score
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Composite score based on AHRQ quality indicators
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h2" sx={{ fontWeight: 600 }}>
                {overallQualityScore.toFixed(1)}
              </Typography>
              <Chip
                icon={qualityStatus.icon}
                label={qualityStatus.label}
                color={qualityStatus.color as any}
                variant="outlined"
                size="medium"
              />
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={overallQualityScore}
            sx={{
              mt: 2,
              height: 10,
              borderRadius: 5,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: qualityStatus.color === 'success' ? COLORS.good :
                                qualityStatus.color === 'warning' ? COLORS.warning : COLORS.error,
              },
            }}
          />
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Item Non-response */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Item Non-response Analysis</Typography>
                <Chip
                  label={`${data.itemNonresponse.rate.toFixed(1)}%`}
                  color={data.itemNonresponse.rate < 5 ? 'success' : data.itemNonresponse.rate < 10 ? 'warning' : 'error'}
                />
              </Box>
              
              {data.itemNonresponse.rate > 5 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Item non-response exceeds AHRQ recommended threshold of 5%
                </Alert>
              )}

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Question</TableCell>
                      <TableCell align="right">Non-response Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.itemNonresponse.byQuestion.slice(0, 5).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Tooltip title={item.questionText}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {item.questionText}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${item.nonresponseRate.toFixed(1)}%`}
                            size="small"
                            color={item.nonresponseRate < 5 ? 'success' : item.nonresponseRate < 10 ? 'warning' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Straight-lining Detection */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Straight-lining Detection</Typography>
                <Chip
                  label={`${data.straightLining.detectedCount} cases`}
                  color={data.straightLining.percentOfResponses < 2 ? 'success' : 
                         data.straightLining.percentOfResponses < 5 ? 'warning' : 'error'}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Responses with identical answers across multiple questions
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={data.straightLining.percentOfResponses}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: data.straightLining.percentOfResponses < 2 ? COLORS.good :
                                      data.straightLining.percentOfResponses < 5 ? COLORS.warning : COLORS.error,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {data.straightLining.percentOfResponses.toFixed(1)}% of total responses
                </Typography>
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Common Patterns Detected:
              </Typography>
              {data.straightLining.patterns.map((pattern, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{pattern.pattern}</Typography>
                  <Chip label={pattern.count} size="small" />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Time per Question */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Response Time Distribution
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Timer />
              <Box>
                <Typography variant="h4">{data.timePerQuestion.median}s</Typography>
                <Typography variant="body2" color="text.secondary">
                  Median time per question
                </Typography>
              </Box>
            </Box>
            
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.timePerQuestion.distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <ChartTooltip />
                <Bar dataKey="value" fill={COLORS.desktop} />
              </BarChart>
            </ResponsiveContainer>

            {data.timePerQuestion.outliers.filter(o => o.flagged).length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {data.timePerQuestion.outliers.filter(o => o.flagged).length} responses flagged for 
                unusually fast completion times (potential quality issues)
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Device & Language Mix */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Response Demographics
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Device Mix
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Mobile', value: data.deviceMix.mobile },
                        { name: 'Desktop', value: data.deviceMix.desktop },
                        { name: 'Tablet', value: data.deviceMix.tablet },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      <Cell fill={COLORS.mobile} />
                      <Cell fill={COLORS.desktop} />
                      <Cell fill={COLORS.tablet} />
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneAndroid sx={{ fontSize: 16, color: COLORS.mobile }} />
                    <Typography variant="caption">
                      Mobile: {data.deviceMix.mobile}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Computer sx={{ fontSize: 16, color: COLORS.desktop }} />
                    <Typography variant="caption">
                      Desktop: {data.deviceMix.desktop}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tablet sx={{ fontSize: 16, color: COLORS.tablet }} />
                    <Typography variant="caption">
                      Tablet: {data.deviceMix.tablet}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Language Mix
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={Object.entries(data.languageMix).map(([lang, percent]) => ({
                        name: lang,
                        value: percent
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {Object.keys(data.languageMix).map((lang, index) => (
                        <Cell key={index} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {Object.entries(data.languageMix).map(([lang, percent], index) => (
                    <Box key={lang} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Language sx={{ fontSize: 16, color: Object.values(COLORS)[index % Object.values(COLORS).length] }} />
                      <Typography variant="caption">
                        {lang}: {percent}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* AHRQ Compliance Notice */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          <AlertTitle>AHRQ Data Quality Standards</AlertTitle>
          This dashboard follows AHRQ CAHPS guidelines for response quality assessment. 
          Thresholds: Item non-response &lt;5%, Straight-lining &lt;2%, Minimum response time &gt;2 seconds per question.
        </Alert>
      </Box>
    </Box>
  );
};

export default ResponseQualityBias;
