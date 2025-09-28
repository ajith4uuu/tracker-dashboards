import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab';
import {
  ArrowBack,
  Assessment,
  EventNote,
  Warning,
  TrendingUp,
  Note,
  Add,
  CheckCircle,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { patientsAPI } from '../../services/api/patientsAPI';
import { useSnackbar } from 'notistack';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PatientDetail: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [tabValue, setTabValue] = useState(0);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Fetch patient journey
  const { data: journeyData, isLoading: journeyLoading } = useQuery({
    queryKey: ['patient-journey', patientId],
    queryFn: async () => {
      const response = await patientsAPI.getPatientJourney(patientId!);
      return response.data;
    },
  });

  // Fetch patient analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['patient-analytics', patientId],
    queryFn: async () => {
      const response = await patientsAPI.getPatientAnalytics(patientId!);
      return response.data;
    },
  });

  // Fetch patient timeline
  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['patient-timeline', patientId],
    queryFn: async () => {
      const response = await patientsAPI.getPatientTimeline(patientId!);
      return response.data;
    },
  });

  // Fetch patient notes
  const { data: notesData, refetch: refetchNotes } = useQuery({
    queryKey: ['patient-notes', patientId],
    queryFn: async () => {
      const response = await patientsAPI.getPatientNotes(patientId!);
      return response.data;
    },
  });

  // Fetch risk assessment
  const { data: riskData } = useQuery({
    queryKey: ['patient-risk', patientId],
    queryFn: async () => {
      const response = await patientsAPI.getPatientRiskAssessment(patientId!);
      return response.data;
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      enqueueSnackbar('Please enter a note', { variant: 'warning' });
      return;
    }

    try {
      await patientsAPI.addPatientNote(patientId!, newNote);
      enqueueSnackbar('Note added successfully', { variant: 'success' });
      setNewNote('');
      setNoteDialogOpen(false);
      refetchNotes();
    } catch (error) {
      enqueueSnackbar('Failed to add note', { variant: 'error' });
    }
  };

  if (journeyLoading || analyticsLoading || timelineLoading) {
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

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'success';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/patients')}
          >
            Back to Patients
          </Button>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {patientId?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Patient {patientId}
          </Typography>
        </Box>
        {riskData && (
          <Chip
            label={`Risk: ${riskData.riskAssessment.level}`}
            color={getRiskColor(riskData.riskAssessment.level)}
            icon={<Warning />}
          />
        )}
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Events
              </Typography>
              <Typography variant="h4">
                {journeyData?.journey?.metrics?.totalEvents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Completion Rate
              </Typography>
              <Typography variant="h4">
                {journeyData?.journey?.metrics?.completionRate?.toFixed(1) || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Engagement Score
              </Typography>
              <Typography variant="h4">
                {journeyData?.journey?.metrics?.engagementScore?.toFixed(0) || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Days Active
              </Typography>
              <Typography variant="h4">
                {analyticsData?.analytics?.metrics?.days_active || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Insights */}
      {journeyData?.journey?.insights && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            AI Insights
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {journeyData.journey.insights.summary}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {journeyData.journey.insights.recommendations?.slice(0, 3).map((rec: string, index: number) => (
              <Chip
                key={index}
                label={rec}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Journey" icon={<EventNote />} />
          <Tab label="Analytics" icon={<Assessment />} />
          <Tab label="Timeline" icon={<TrendingUp />} />
          <Tab label="Notes" icon={<Note />} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Journey Timeline */}
          <Timeline position="alternate">
            {journeyData?.journey?.events?.map((event: any, index: number) => (
              <TimelineItem key={index}>
                <TimelineOppositeContent color="text.secondary">
                  {new Date(event.timestamp).toLocaleString()}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color={event.details?.completed ? 'success' : 'primary'}>
                    {event.details?.completed ? <CheckCircle /> : <EventNote />}
                  </TimelineDot>
                  {index < journeyData.journey.events.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" component="span">
                      {event.eventName}
                    </Typography>
                    {event.details?.satisfaction_score && (
                      <Typography variant="body2">
                        Satisfaction: {event.details.satisfaction_score}/5
                      </Typography>
                    )}
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Analytics Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Typography variant="h6" gutterBottom>
                Metric Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData?.analytics?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="satisfaction" stroke="#8884d8" />
                  <Line type="monotone" dataKey="pain" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="mood" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Typography variant="h6" gutterBottom>
                Average Scores
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Satisfaction"
                    secondary={`${analyticsData?.analytics?.metrics?.avg_satisfaction?.toFixed(1) || 'N/A'}/5`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Pain Level"
                    secondary={`${analyticsData?.analytics?.metrics?.avg_pain?.toFixed(1) || 'N/A'}/10`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Mood Score"
                    secondary={`${analyticsData?.analytics?.metrics?.avg_mood?.toFixed(1) || 'N/A'}/10`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Energy Level"
                    secondary={`${analyticsData?.analytics?.metrics?.avg_energy?.toFixed(1) || 'N/A'}/10`}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Event Timeline */}
          <List>
            {timelineData?.timeline?.map((event: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ListItem>
                  <ListItemIcon>
                    <EventNote />
                  </ListItemIcon>
                  <ListItemText
                    primary={event.eventName}
                    secondary={new Date(event.timestamp).toLocaleString()}
                  />
                  {event.details?.completed && (
                    <Chip label="Completed" size="small" color="success" />
                  )}
                </ListItem>
              </motion.div>
            ))}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Clinical Notes */}
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setNoteDialogOpen(true)}
            >
              Add Note
            </Button>
          </Box>
          <List>
            {notesData?.notes?.map((note: any, index: number) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Note />
                </ListItemIcon>
                <ListItemText
                  primary={note.content}
                  secondary={`${note.author} - ${new Date(note.timestamp).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>
      </Card>

      {/* Add Note Dialog */}
      <Dialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Clinical Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            label="Note"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddNote}>
            Add Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientDetail;
