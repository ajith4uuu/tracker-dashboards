import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Chip,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
  Paper,
  Alert,
  AlertTitle,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tab,
  Tabs,
  Badge,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Person,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  TrendingUp,
  TrendingDown,
  Assignment,
  Message,
  Medication,
  LocalHospital,
  Phone,
  Email,
  CalendarToday,
  Assessment,
  Refresh,
  Print,
  Share,
  Edit,
  NotificationsActive,
  FiberManualRecord,
} from '@mui/icons-material';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import type { Patient360Dashboard } from '../../types/dashboards';

const DOMAIN_COLORS = {
  pain: '#FF6B6B',
  fatigue: '#4ECDC4',
  anxiety: '#45B7D1',
  physicalFunction: '#96CEB4',
  socialFunction: '#FFEAA7',
  depression: '#DDA0DD',
  sleep: '#98D8C8',
  cognitiveFunction: '#F7DC6F',
};

const Patient360: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const [showAllNotes, setShowAllNotes] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<Patient360Dashboard>({
    queryKey: ['patient-360', patientId],
    queryFn: () => dashboardAPI.getPatient360(patientId!),
    refetchInterval: 60000, // Refresh every minute
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
          Failed to load patient data
        </Alert>
      </Box>
    );
  }

  // Prepare radar chart data for PRO domains
  const radarData = Object.entries(data.latestScores).map(([domain, score]) => ({
    domain: domain.charAt(0).toUpperCase() + domain.slice(1),
    current: score.value,
    normal: 50, // Normal population mean
    target: 60, // Clinical target
  }));

  // Get critical alerts
  const criticalAlerts = data.alerts.filter(a => a.severity === 'critical');
  const warningAlerts = data.alerts.filter(a => a.severity === 'warning');

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
            <Person fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Patient 360° View
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {patientId} | Last Updated: {new Date().toLocaleString()}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => refetch()}>
            <Refresh />
          </IconButton>
          <IconButton>
            <Print />
          </IconButton>
          <IconButton>
            <Share />
          </IconButton>
          <Button variant="contained" startIcon={<Edit />}>
            Edit Care Plan
          </Button>
        </Box>
      </Box>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {criticalAlerts.map((alert, index) => (
            <Alert 
              key={index} 
              severity="error" 
              sx={{ mb: 1 }}
              action={
                <Button color="inherit" size="small">
                  ACKNOWLEDGE
                </Button>
              }
            >
              <AlertTitle>{alert.type}</AlertTitle>
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* PRO Scores Overview */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current PRO Domain Scores
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="domain" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Current" 
                    dataKey="current" 
                    stroke="#FF69B4" 
                    fill="#FF69B4" 
                    fillOpacity={0.6} 
                  />
                  <Radar 
                    name="Target" 
                    dataKey="target" 
                    stroke="#4A90E2" 
                    fill="#4A90E2" 
                    fillOpacity={0.3} 
                  />
                  <Radar 
                    name="Normal" 
                    dataKey="normal" 
                    stroke="#4CAF50" 
                    fill="#4CAF50" 
                    fillOpacity={0.1} 
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Domain Score Cards */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Domain Score Details
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(data.latestScores).map(([domain, score]) => (
                  <Grid item xs={6} key={domain}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        borderLeft: 4, 
                        borderColor: score.band === 'green' ? 'success.main' : 
                                    score.band === 'amber' ? 'warning.main' : 'error.main'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {domain}
                        </Typography>
                        {score.change !== 0 && (
                          score.change > 0 ? 
                            <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} /> :
                            <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
                        )}
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 600, my: 1 }}>
                        {score.value}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Chip 
                          label={score.band.toUpperCase()} 
                          size="small"
                          color={score.band === 'green' ? 'success' : 
                                 score.band === 'amber' ? 'warning' : 'error'}
                          icon={<FiberManualRecord />}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {score.change > 0 ? '+' : ''}{score.change}%
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Tasks and Notes Section */}
        <Grid item xs={12}>
          <Card>
            <Tabs 
              value={activeTab} 
              onChange={(e, v) => setActiveTab(v)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab 
                label={
                  <Badge badgeContent={data.nextTasks.length} color="primary">
                    Upcoming Tasks
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={data.recentNotes.length} color="secondary">
                    Recent Notes
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={warningAlerts.length} color="warning">
                    Alerts
                  </Badge>
                } 
              />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {/* Tasks Tab */}
              {activeTab === 0 && (
                <List>
                  {data.nextTasks.map((task, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          <Assignment 
                            color={task.priority === 'high' ? 'error' : 
                                  task.priority === 'medium' ? 'warning' : 'action'}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={task.task}
                          secondary={
                            <>
                              Due: {task.dueDate.toLocaleDateString()} | 
                              Priority: <Chip label={task.priority} size="small" /> |
                              {task.assigned && ` Assigned to: ${task.assigned}`}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Button size="small" variant="outlined">
                            Complete
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < data.nextTasks.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}

              {/* Notes Tab */}
              {activeTab === 1 && (
                <Timeline position="alternate">
                  {data.recentNotes.slice(0, showAllNotes ? undefined : 3).map((note, index) => (
                    <TimelineItem key={index}>
                      <TimelineOppositeContent color="text.secondary">
                        {note.date.toLocaleDateString()}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot 
                          color={note.type === 'clinical' ? 'primary' : 
                                 note.type === 'patient' ? 'secondary' : 'grey'}
                        >
                          <Message />
                        </TimelineDot>
                        {index < data.recentNotes.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Paper elevation={3} sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="primary">
                            {note.author} - {note.type}
                          </Typography>
                          <Typography variant="body2">
                            {note.note}
                          </Typography>
                        </Paper>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              )}

              {/* Alerts Tab */}
              {activeTab === 2 && (
                <List>
                  {warningAlerts.map((alert, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          <Warning color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.type}
                          secondary={alert.message}
                        />
                        <ListItemSecondaryAction>
                          <Button size="small" color="warning">
                            Review
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < warningAlerts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item>
                <Button variant="outlined" startIcon={<Phone />}>
                  Call Patient
                </Button>
              </Grid>
              <Grid item>
                <Button variant="outlined" startIcon={<Email />}>
                  Send Message
                </Button>
              </Grid>
              <Grid item>
                <Button variant="outlined" startIcon={<CalendarToday />}>
                  Schedule Appointment
                </Button>
              </Grid>
              <Grid item>
                <Button variant="outlined" startIcon={<Assessment />}>
                  Request PRO Assessment
                </Button>
              </Grid>
              <Grid item>
                <Button variant="outlined" startIcon={<Medication />}>
                  Review Medications
                </Button>
              </Grid>
              <Grid item>
                <Button variant="outlined" startIcon={<LocalHospital />}>
                  Refer to Specialist
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Patient360;
