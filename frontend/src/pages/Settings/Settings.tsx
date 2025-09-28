import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Paper,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import Chip from '@mui/material/Chip';
import {
  Save,
  Delete,
  CloudUpload,
  Email,
  Key,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { toggleDarkMode } from '../../store/slices/uiSlice';
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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useSelector((state: RootState) => state.auth);
  const { darkMode } = useSelector((state: RootState) => state.ui);

  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    name: '',
    email: user?.email || '',
    organization: '',
    role: '',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    autoExport: false,
    dataRetention: '90',
    language: 'en',
    timezone: 'America/Toronto',
  });

  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; key: string; created: Date }>>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveProfile = () => {
    // Implementation would save to backend
    enqueueSnackbar('Profile updated successfully', { variant: 'success' });
  };

  const handleSavePreferences = () => {
    // Implementation would save to backend
    enqueueSnackbar('Preferences saved successfully', { variant: 'success' });
  };

  const handleGenerateApiKey = () => {
    const newKey = {
      id: Date.now().toString(),
      name: `API Key ${apiKeys.length + 1}`,
      key: `pk_${Math.random().toString(36).substring(2, 15)}`,
      created: new Date(),
    };
    setApiKeys([...apiKeys, newKey]);
    enqueueSnackbar('API key generated successfully', { variant: 'success' });
  };

  const handleDeleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== id));
    enqueueSnackbar('API key deleted', { variant: 'info' });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Settings
      </Typography>

      <Card>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Profile" />
          <Tab label="Preferences" />
          <Tab label="Security" />
          <Tab label="API Keys" />
          <Tab label="Data Management" />
        </Tabs>

        <CardContent>
          {/* Profile Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  value={profileData.email}
                  disabled
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Organization"
                  value={profileData.organization}
                  onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Role"
                  value={profileData.role}
                  onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                  sx={{ mb: 3 }}
                />
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveProfile}
                >
                  Save Profile
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, backgroundColor: 'background.default' }}>
                  <Typography variant="h6" gutterBottom>
                    Account Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="User ID"
                        secondary={user?.userId || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Account Created"
                        secondary={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Last Login"
                        secondary={user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Preferences Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Notifications
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.emailNotifications}
                      onChange={(e) =>
                        setPreferences({ ...preferences, emailNotifications: e.target.checked })
                      }
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.pushNotifications}
                      onChange={(e) =>
                        setPreferences({ ...preferences, pushNotifications: e.target.checked })
                      }
                    />
                  }
                  label="Push Notifications"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Display
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={() => dispatch(toggleDarkMode())}
                    />
                  }
                  label="Dark Mode"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={preferences.language}
                    label="Language"
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={preferences.timezone}
                    label="Timezone"
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  >
                    <MenuItem value="America/Toronto">Eastern Time</MenuItem>
                    <MenuItem value="America/Chicago">Central Time</MenuItem>
                    <MenuItem value="America/Denver">Mountain Time</MenuItem>
                    <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSavePreferences}
                >
                  Save Preferences
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Your account is secured with email-based OTP authentication
            </Alert>

            <List>
              <ListItem>
                <ListItemText
                  primary="Two-Factor Authentication"
                  secondary="Email OTP is enabled"
                />
                <ListItemSecondaryAction>
                  <Chip label="Active" color="success" size="small" />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Session Timeout"
                  secondary="Auto-logout after 60 minutes of inactivity"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Login History"
                  secondary="View recent login attempts"
                />
                <ListItemSecondaryAction>
                  <Button size="small">View</Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Password & Authentication
            </Typography>
            <Button variant="outlined" startIcon={<Email />} sx={{ mr: 2 }}>
              Change Email
            </Button>
            <Button variant="outlined" startIcon={<Key />}>
              Reset Authentication
            </Button>
          </TabPanel>

          {/* API Keys Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">API Keys</Typography>
              <Button
                variant="contained"
                startIcon={<Key />}
                onClick={handleGenerateApiKey}
              >
                Generate New Key
              </Button>
            </Box>

            {apiKeys.length === 0 ? (
              <Alert severity="info">
                No API keys generated yet. Click "Generate New Key" to create one.
              </Alert>
            ) : (
              <List>
                {apiKeys.map((apiKey) => (
                  <ListItem key={apiKey.id}>
                    <ListItemText
                      primary={apiKey.name}
                      secondary={
                        <>
                          <Typography variant="caption" component="span" sx={{ fontFamily: 'monospace' }}>
                            {apiKey.key}
                          </Typography>
                          <br />
                          Created: {apiKey.created.toLocaleDateString()}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteApiKey(apiKey.id)}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>

          {/* Data Management Tab */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" gutterBottom>
              Data Management
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Data Retention Period</InputLabel>
                  <Select
                    value={preferences.dataRetention}
                    label="Data Retention Period"
                    onChange={(e) => setPreferences({ ...preferences, dataRetention: e.target.value })}
                  >
                    <MenuItem value="30">30 days</MenuItem>
                    <MenuItem value="90">90 days</MenuItem>
                    <MenuItem value="180">180 days</MenuItem>
                    <MenuItem value="365">1 year</MenuItem>
                    <MenuItem value="unlimited">Unlimited</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.autoExport}
                      onChange={(e) =>
                        setPreferences({ ...preferences, autoExport: e.target.checked })
                      }
                    />
                  }
                  label="Automatic Weekly Export"
                  sx={{ mb: 3 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Storage Usage
                  </Typography>
                  <Typography variant="h4">
                    2.3 GB
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    of 10 GB used
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Export & Backup
            </Typography>
            <Button variant="outlined" startIcon={<CloudUpload />} sx={{ mr: 2 }}>
              Export All Data
            </Button>
            <Button variant="outlined" startIcon={<CloudUpload />}>
              Create Backup
            </Button>

            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Data Deletion
              </Typography>
              <Typography variant="body2">
                Permanently delete all your data. This action cannot be undone.
              </Typography>
              <Button color="error" size="small" sx={{ mt: 1 }}>
                Delete All Data
              </Button>
            </Alert>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;
