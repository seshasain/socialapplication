import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import PricingPage from './components/PricingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import AccountDeletion from './components/AccountDeletion';
import AccountReactivation from './components/AccountReactivation';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initGA, initHotjar } from './utils/analytics.tsx';
import { cleanupPublishedAndFailedMedia } from './utils/mediaCleanup';
import ProtectedRoute from './components/ProtectedRoute';
import { AppRoot } from './context/AppStateContext';
import { Toaster } from 'react-hot-toast';
import Overview from './components/dashboard/Overview';
import CalendarView from './components/dashboard/CalendarView';
import Analytics from './components/dashboard/Analytics';
import TeamView from './components/dashboard/context/TeamView';
import SettingsView from './components/dashboard/SettingsView';
import HistoryView from './components/dashboard/HistoryView';
import ExtensionRequest from './components/trial/ExtensionRequest';
import { getSubscriptionType } from "./utils/subscription";
import { NotionIntegration } from './pages/NotionIntegration';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import AppLayout from './components/layout/AppLayout';
import IntegrationsPage from './pages/IntegrationsPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Only initialize analytics if authenticated
    if (isAuthenticated) {
      initGA();
      initHotjar();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Only run cleanup when authenticated and not loading
    if (isAuthenticated && !isLoading) {
      const cleanup = async () => {
        try {
          await cleanupPublishedAndFailedMedia();
        } catch (error) {
          // Log error but don't break the app
          console.error('Background media cleanup failed:', error);
          // Only show toast for non-auth related errors
          if (error instanceof Error && !error.message.includes('No authentication token')) {
            toast.error('Media cleanup failed. Some temporary files may remain.');
          }
        }
      };
      cleanup();
    }
  }, [isAuthenticated, isLoading]);

  // Don't render anything while loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppRoot>
          <Toaster position="top-right" />
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            <Navbar />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/account/reactivate" element={<AccountReactivation />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard/*" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/account/delete" element={
                <ProtectedRoute>
                  <AccountDeletion />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/posts/*" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/team" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/trial/extend" element={
                <ProtectedRoute>
                  <ExtensionRequest />
                </ProtectedRoute>
              } />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
              toastStyle={{
                backgroundColor: '#333',
                color: '#fff',
                borderRadius: '8px',
                padding: '15px',
                fontSize: '16px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
              }}
              bodyStyle={{
                fontWeight: '500',
                fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              }}
            />
          </div>
        </AppRoot>
      </Router>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}