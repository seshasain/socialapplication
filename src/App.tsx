import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import PricingPage from './components/PricingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import AccountDeletion from './components/AccountDeletion';
import AccountReactivation from './components/AccountReactivation';
import { AuthProvider } from './context/AuthContext';
import { initGA, initHotjar } from './utils/analytics';
import { cleanupPublishedAndFailedMedia } from './utils/mediaCleanup';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  useEffect(() => {
    // Initialize analytics
    initGA();
    initHotjar();

    // Run media cleanup in the background
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
  }, []);

  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
}