import React, { useState, useEffect } from 'react';
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
  Button,
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Tooltip,
  Tabs,
  Tab,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  Warning,
  Error as ErrorIcon,
  Info,
  CheckCircle,
  NotificationsActive,
  Person,
  TrendingUp,
  TrendingDown,
  LocalHospital,
  Phone,
  Email,
  Message,
  Schedule,
  Flag,
  Visibility,
  VisibilityOff,
  PriorityHigh,
  ArrowUpward,
  ArrowDownward,
  Refresh,
  FilterList,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import type { RiskAlertingDashboard } from '../../types/dashboards';

const ALERT_COLORS = {
  critical: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  success: '#4CAF50',
};

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  pain: '🔥',
  fatigue: '😴',
  anxiety: '😰',
  depression: '😔',
  physicalFunction: '🏃',
  socialFunction: '👥',
};

const RiskAlerting: React.FC = () => {
  const [severity, setSeverity] = useState<'all' | 'critical' | 'warning'>('all');
  const [domain, setDomain] = useState('all');
  const [unacknowledgedOnly, setUnacknowledgedOnly] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [outreachDialogOpen, setOutreachDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, isLoading, error, refetch } = useQuery<RiskAlertingDashboard>({
    queryKey: ['risk-alerting', severity, domain, unacknowledgedOnly],
    queryFn: () => dashboardAPI.getRiskAlerting({ severity, domain, unacknowledgedOnly }),
    refetchInterval: autoRefresh ? 30000 : false, // 30 seconds auto-refresh
  });

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

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
          Failed to load risk alerts
        </Alert>
      </Box>
    );
  }

  const handleAcknowledgeAlert = (alertId: string) => {
    // Handle alert acknowledgment
    console.log('Acknowledging alert:', alertId);
  };

  const handleOpenOutreach = (alert: any) => {
    setSelectedAlert(alert);
    setOutreachDialogOpen(true);
  };

  // Count alerts by severity
  const alertCounts = {
    critical: data.activeAlerts.filter(a => a.threshold > 70).length,
    warning: data.activeAlerts.filter(a => a.threshold > 50 && a.threshold <= 70).length,
    info: data.activeAlerts.filter(a => a.threshold <= 50).length,
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Risk & Alerting Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time patient monitoring with MCID threshold tracking (PubMed Central)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={autoRefresh}
            exclusive
            onChange={(e, v) => setAutoRefresh(v)}
            size="small"
          >
            <ToggleButton value={true}>
              Auto-refresh ON
            </ToggleButton>
            <ToggleButton value={false}>
              Auto-refresh OFF
            </ToggleButton>
          </ToggleButtonGroup>
          <Badge badgeContent={data.activeAlerts.length} color="error">
            <NotificationsActive />
          </Badge>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()}>
            Refresh
          </Button>
          <Button variant="contained" color="error" startIcon={<Flag />}>
            Escalate
          </Button>
        </Box>
      </Box>

      {/* Alert Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderTop: 4, borderColor: ALERT_COLORS.critical }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Critical Alerts
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 600, color: ALERT_COLORS.critical }}>
                    {alertCounts.critical}
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 48, color: ALERT_COLORS.critical, opacity: 0.3 }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Requiring immediate attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ borderTop: 4, borderColor: ALERT_COLORS.warning }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Warning Alerts
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 600, color: ALERT_COLORS.warning }}>
                    {alertCounts.warning}
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 48, color: ALERT_COLORS.warning, opacity: 0.3 }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Monitor closely
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ borderTop: 4, borderColor: ALERT_COLORS.info }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    MCID Violations
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 600, color: ALERT_COLORS.info }}>
                    {data.mcidViolations.length}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 48, color: ALERT_COLORS.info, opacity: 0.3 }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Clinically significant changes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FilterList />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Severity</InputLabel>
            <Select value={severity} onChange={(e) => setSeverity(e.target.value as any)} label="Severity">
              <MenuItem value="all">All Severities</MenuItem>
              <MenuItem value="critical">Critical Only</MenuItem>
              <MenuItem value="warning">Warning & Above</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Domain</InputLabel>
            <Select value={domain} onChange={(e) => setDomain(e.target.value)} label="Domain">
              <MenuItem value="all">All Domains</MenuItem>
              <MenuItem value="pain">Pain</MenuItem>
              <MenuItem value="fatigue">Fatigue</MenuItem>
              <MenuItem value="anxiety">Anxiety</MenuItem>
              <MenuItem value="depression">Depression</MenuItem>
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={unacknowledgedOnly}
            exclusive
            onChange={(e, v) => setUnacknowledgedOnly(v)}
            size="small"
          >
            <ToggleButton value={false}>All</ToggleButton>
            <ToggleButton value={true}>Unacknowledged</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Active Alerts (${data.activeAlerts.length})`} />
          <Tab label={`MCID Violations (${data.mcidViolations.length})`} />
          <Tab label={`Outreach Windows (${data.outreachWindows.length})`} />
        </Tabs>

        {/* Active Alerts Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 2 }}>
            <AnimatePresence>
              {data.activeAlerts.map((alert, index) => (
                <motion.div
                  key={alert.patientId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card sx={{ mb: 2, borderLeft: 4, borderColor: alert.threshold > 70 ? ALERT_COLORS.critical : ALERT_COLORS.warning }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Avatar sx={{ bgcolor: alert.threshold > 70 ? ALERT_COLORS.critical : ALERT_COLORS.warning }}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                Patient #{alert.patientId}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Triggered: {new Date(alert.triggered).toLocaleString()}
                              </Typography>
                            </Box>
                            <Chip
                              icon={<PriorityHigh />}
                              label={alert.threshold > 70 ? 'CRITICAL' : 'WARNING'}
                              color={alert.threshold > 70 ? 'error' : 'warning'}
                              size="small"
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Domain
                              </Typography>
                              <Typography variant="body1">
                                {DOMAIN_ICONS[alert.domain]} {alert.domain}
                              </Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem />
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Current Value
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {alert.currentValue}
                                {alert.currentValue > alert.threshold && (
                                  <ArrowUpward sx={{ fontSize: 16, color: 'error.main', ml: 0.5 }} />
                                )}
                              </Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem />
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Threshold
                              </Typography>
                              <Typography variant="body1">
                                {alert.threshold}
                              </Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem />
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Recommended Action
                              </Typography>
                              <Typography variant="body1" color="primary">
                                {alert.action}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Phone />}
                            onClick={() => handleOpenOutreach(alert)}
                          >
                            Contact
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CheckCircle />}
                            onClick={() => handleAcknowledgeAlert(alert.patientId)}
                          >
                            Acknowledge
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>
        )}

        {/* MCID Violations Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {data.mcidViolations.map((violation) => (
                <Grid item xs={12} md={6} key={violation.patientId}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Patient #{violation.patientId}
                        </Typography>
                        <Chip
                          icon={violation.direction === 'worsened' ? <TrendingUp /> : <TrendingDown />}
                          label={violation.direction}
                          color={violation.direction === 'worsened' ? 'error' : 'success'}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Domain: {violation.domain}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(Math.abs(violation.magnitude) * 10, 100)}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              mt: 1,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: violation.direction === 'worsened' ? ALERT_COLORS.critical : ALERT_COLORS.success,
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {Math.abs(violation.magnitude).toFixed(1)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        MCID threshold exceeded by {Math.abs(violation.magnitude - 5).toFixed(1)} points
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Outreach Windows Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 2 }}>
            <List>
              {data.outreachWindows.map((window, index) => (
                <React.Fragment key={window.patientId}>
                  <ListItem>
                    <ListItemIcon>
                      <Schedule color={window.contacted ? 'disabled' : 'primary'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Patient #${window.patientId}`}
                      secondary={
                        <>
                          {window.reason} | 
                          Window: {new Date(window.windowStart).toLocaleDateString()} - {new Date(window.windowEnd).toLocaleDateString()}
                          {window.contacted && ' | ✓ Contacted'}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      {!window.contacted && (
                        <>
                          <IconButton edge="end" aria-label="call">
                            <Phone />
                          </IconButton>
                          <IconButton edge="end" aria-label="email">
                            <Email />
                          </IconButton>
                          <IconButton edge="end" aria-label="message">
                            <Message />
                          </IconButton>
                        </>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < data.outreachWindows.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </Paper>

      {/* Outreach Dialog */}
      <Dialog open={outreachDialogOpen} onClose={() => setOutreachDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Patient Outreach</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Contacting Patient #{selectedAlert?.patientId} regarding {selectedAlert?.domain} alert
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Outreach Notes"
            variant="outlined"
            sx={{ mt: 2 }}
            placeholder="Document outreach attempt and patient response..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOutreachDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Phone />}>Call Patient</Button>
          <Button variant="contained" startIcon={<Email />}>Send Message</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RiskAlerting;
