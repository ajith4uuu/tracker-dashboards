import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import { RootState } from './store/store';
import { checkAuth } from './store/slices/authSlice';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';

// Layout
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';

// Pages
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Upload from './pages/Upload/Upload';
import Patients from './pages/Patients/Patients';
import PatientDetail from './pages/Patients/PatientDetail';
import Analytics from './pages/Analytics/Analytics';
import Settings from './pages/Settings/Settings';

// Lazy load dashboard components for better performance
const ExecutiveOverview = lazy(() => import('./pages/Dashboards/ExecutiveOverview'));
const ResponseQualityBias = lazy(() => import('./pages/Dashboards/ResponseQualityBias'));
const EngagementFunnel = lazy(() => import('./pages/Dashboards/EngagementFunnel'));
const CAHPSDashboard = lazy(() => import('./pages/Dashboards/CAHPSDashboard'));
const PROMISDomains = lazy(() => import('./pages/Dashboards/PROMISDomains'));
const CohortComparisons = lazy(() => import('./pages/Dashboards/CohortComparisons'));
const LongitudinalChange = lazy(() => import('./pages/Dashboards/LongitudinalChange'));
const TextInsights = lazy(() => import('./pages/Dashboards/TextInsights'));
const OperationsSLA = lazy(() => import('./pages/Dashboards/OperationsSLA'));
const DataHealth = lazy(() => import('./pages/Dashboards/DataHealth'));

// Patient-focused Dashboards
const Patient360 = lazy(() => import('./pages/Dashboards/Patient360'));
const PatientJourneyMap = lazy(() => import('./pages/Dashboards/PatientJourneyMap'));
const RiskAlerting = lazy(() => import('./pages/Dashboards/RiskAlerting'));
const AdherenceActivity = lazy(() => import('./pages/Dashboards/AdherenceActivity'));
const SymptomTrajectories = lazy(() => import('./pages/Dashboards/SymptomTrajectories'));
const CareTeamPanel = lazy(() => import('./pages/Dashboards/CareTeamPanel'));
const EquityLens = lazy(() => import('./pages/Dashboards/EquityLens'));
const InterventionOutcomes = lazy(() => import('./pages/Dashboards/InterventionOutcomes'));
const PROMISScorecard = lazy(() => import('./pages/Dashboards/PROMISScorecard'));
const ExperienceOutcomes = lazy(() => import('./pages/Dashboards/ExperienceOutcomes'));


function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Check authentication status on app load
    dispatch(checkAuth() as any);
  }, [dispatch]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            } 
          />

          {/* Private Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/patients/:patientId" element={<PatientDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              
              {/* Survey-focused Dashboards */}
              <Route path="/dashboards/executive-overview" element={
                <Suspense fallback={<LoadingScreen />}><ExecutiveOverview /></Suspense>
              } />
              <Route path="/dashboards/response-quality" element={
                <Suspense fallback={<LoadingScreen />}><ResponseQualityBias /></Suspense>
              } />
              <Route path="/dashboards/engagement-funnel" element={
                <Suspense fallback={<LoadingScreen />}><EngagementFunnel /></Suspense>
              } />
              <Route path="/dashboards/cahps" element={
                <Suspense fallback={<LoadingScreen />}><CAHPSDashboard /></Suspense>
              } />
              <Route path="/dashboards/promis" element={
                <Suspense fallback={<LoadingScreen />}><PROMISDomains /></Suspense>
              } />
              <Route path="/dashboards/cohort-comparison" element={
                <Suspense fallback={<LoadingScreen />}><CohortComparisons /></Suspense>
              } />
              <Route path="/dashboards/longitudinal" element={
                <Suspense fallback={<LoadingScreen />}><LongitudinalChange /></Suspense>
              } />
              <Route path="/dashboards/text-insights" element={
                <Suspense fallback={<LoadingScreen />}><TextInsights /></Suspense>
              } />
              <Route path="/dashboards/operations" element={
                <Suspense fallback={<LoadingScreen />}><OperationsSLA /></Suspense>
              } />
              <Route path="/dashboards/data-health" element={
                <Suspense fallback={<LoadingScreen />}><DataHealth /></Suspense>
              } />
              
              {/* Patient-focused Dashboards */}
              <Route path="/dashboards/patient-360" element={
                <Suspense fallback={<LoadingScreen />}><Patient360 /></Suspense>
              } />
              <Route path="/dashboards/patient-360/:patientId" element={
                <Suspense fallback={<LoadingScreen />}><Patient360 /></Suspense>
              } />
              <Route path="/dashboards/journey-map" element={
                <Suspense fallback={<LoadingScreen />}><PatientJourneyMap /></Suspense>
              } />
              <Route path="/dashboards/journey-map/:patientId" element={
                <Suspense fallback={<LoadingScreen />}><PatientJourneyMap /></Suspense>
              } />
              <Route path="/dashboards/risk-alerting" element={
                <Suspense fallback={<LoadingScreen />}><RiskAlerting /></Suspense>
              } />
              <Route path="/dashboards/adherence" element={
                <Suspense fallback={<LoadingScreen />}><AdherenceActivity /></Suspense>
              } />
              <Route path="/dashboards/symptoms" element={
                <Suspense fallback={<LoadingScreen />}><SymptomTrajectories /></Suspense>
              } />
              <Route path="/dashboards/care-team" element={
                <Suspense fallback={<LoadingScreen />}><CareTeamPanel /></Suspense>
              } />
              <Route path="/dashboards/equity" element={
                <Suspense fallback={<LoadingScreen />}><EquityLens /></Suspense>
              } />
              <Route path="/dashboards/interventions" element={
                <Suspense fallback={<LoadingScreen />}><InterventionOutcomes /></Suspense>
              } />
              <Route path="/dashboards/promis-scorecard" element={
                <Suspense fallback={<LoadingScreen />}><PROMISScorecard /></Suspense>
              } />
              <Route path="/dashboards/experience-outcomes" element={
                <Suspense fallback={<LoadingScreen />}><ExperienceOutcomes /></Suspense>
              } />
            </Route>
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </Box>
  );
}

export default App;
