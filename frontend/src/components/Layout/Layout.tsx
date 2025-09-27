import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  CloudUpload,
  People,
  Analytics,
  Settings,
  Logout,
  Notifications,
  DarkMode,
  LightMode,
  AccountCircle,
  ExpandLess,
  ExpandMore,
  Assessment,
  BarChart,
  Speed,
  Psychology,
  Timeline,
  GroupWork,
  TrendingUp,
  TextFields,
  Engineering,
  HealthAndSafety,
  PersonSearch,
  Map,
  Warning,
  CheckCircle,
  LocalHospital,
  Groups,
  Equalizer,
  Science,
  Scorecard,
  CompareArrows,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar, toggleDarkMode } from '../../store/slices/uiSlice';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Upload Data', icon: <CloudUpload />, path: '/upload' },
  { text: 'Patients', icon: <People />, path: '/patients' },
  { text: 'Analytics', icon: <Analytics />, path: '/analytics' },
  {
    text: 'Survey Dashboards',
    icon: <Assessment />,
    badge: 10,
    subItems: [
      { text: 'Executive Overview', icon: <Speed />, path: '/dashboards/executive-overview', info: 'AHRQ+1' },
      { text: 'Response Quality', icon: <CheckCircle />, path: '/dashboards/response-quality', info: 'AHRQ' },
      { text: 'Engagement Funnel', icon: <BarChart />, path: '/dashboards/engagement-funnel', info: 'AHRQ' },
      { text: 'CAHPS Metrics', icon: <Scorecard />, path: '/dashboards/cahps', info: 'CMS' },
      { text: 'PROMIS Domains', icon: <Psychology />, path: '/dashboards/promis', info: 'PMC' },
      { text: 'Cohort Comparisons', icon: <GroupWork />, path: '/dashboards/cohort-comparison', info: 'PMC' },
      { text: 'Longitudinal Change', icon: <Timeline />, path: '/dashboards/longitudinal', info: 'BMJ' },
      { text: 'Text Insights', icon: <TextFields />, path: '/dashboards/text-insights', info: 'AHRQ' },
      { text: 'Operations & SLA', icon: <Engineering />, path: '/dashboards/operations', info: 'AHRQ' },
      { text: 'Data Health', icon: <HealthAndSafety />, path: '/dashboards/data-health', info: 'Admin' },
    ],
  },
  {
    text: 'Patient Dashboards',
    icon: <LocalHospital />,
    badge: 10,
    subItems: [
      { text: 'Patient 360°', icon: <PersonSearch />, path: '/dashboards/patient-360', info: 'PRO-centric' },
      { text: 'Journey Maps', icon: <Map />, path: '/dashboards/journey-map', info: 'PMC' },
      { text: 'Risk & Alerts', icon: <Warning />, path: '/dashboards/risk-alerting', info: 'PMC' },
      { text: 'Adherence', icon: <CheckCircle />, path: '/dashboards/adherence', info: 'BMJ' },
      { text: 'Symptom Trajectories', icon: <TrendingUp />, path: '/dashboards/symptoms', info: 'PMC' },
      { text: 'Care Team Panel', icon: <Groups />, path: '/dashboards/care-team', info: 'BMJ' },
      { text: 'Equity Lens', icon: <Equalizer />, path: '/dashboards/equity', info: 'CMS' },
      { text: 'Interventions', icon: <Science />, path: '/dashboards/interventions', info: 'ASCO' },
      { text: 'PROMIS Scorecard', icon: <Scorecard />, path: '/dashboards/promis-scorecard', info: 'Advances' },
      { text: 'Experience + Outcomes', icon: <CompareArrows />, path: '/dashboards/experience-outcomes', info: 'AHRQ' },
    ],
  },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { sidebarOpen, darkMode } = useSelector((state: RootState) => state.ui);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [surveyDashboardsOpen, setSurveyDashboardsOpen] = useState(false);
  const [patientDashboardsOpen, setPatientDashboardsOpen] = useState(false);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      dispatch(toggleSidebar());
    }
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #FF69B4 30%, #4A90E2 90%)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          PROgress Tracker
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                selected={!item.subItems && location.pathname === item.path}
                onClick={() => {
                  if (item.text === 'Survey Dashboards') {
                    setSurveyDashboardsOpen(!surveyDashboardsOpen);
                  } else if (item.text === 'Patient Dashboards') {
                    setPatientDashboardsOpen(!patientDashboardsOpen);
                  } else if (!item.subItems && item.path) {
                    handleNavigate(item.path);
                  }
                }}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      location.pathname === item.path
                        ? theme.palette.primary.main
                        : 'inherit',
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="primary">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.text} />
                {item.text === 'Survey Dashboards' && (surveyDashboardsOpen ? <ExpandLess /> : <ExpandMore />)}
                {item.text === 'Patient Dashboards' && (patientDashboardsOpen ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>
            </ListItem>
            {item.subItems && (
              <Collapse 
                in={item.text === 'Survey Dashboards' ? surveyDashboardsOpen : patientDashboardsOpen} 
                timeout="auto" 
                unmountOnExit
              >
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItemButton
                      key={subItem.text}
                      sx={{ pl: 4 }}
                      selected={location.pathname === subItem.path}
                      onClick={() => handleNavigate(subItem.path)}
                    >
                      <ListItemIcon sx={{ minWidth: 35 }}>
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={subItem.text} 
                        secondary={subItem.info}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
          ml: { sm: `${sidebarOpen ? drawerWidth : 0}px` },
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[1],
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => dispatch(toggleSidebar())}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>

          <IconButton
            color="inherit"
            onClick={() => dispatch(toggleDarkMode())}
            sx={{ mx: 1 }}
          >
            {darkMode ? <LightMode /> : <DarkMode />}
          </IconButton>

          <IconButton color="inherit" sx={{ mx: 1 }}>
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton
            onClick={handleProfileMenuOpen}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          {user?.email}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => navigate('/settings')}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={sidebarOpen}
          onClose={() => dispatch(toggleSidebar())}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
          ml: { sm: sidebarOpen ? 0 : `-${drawerWidth}px` },
          mt: 8,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
