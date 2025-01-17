import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import PricingPage from './components/PricingPage';
import { AuthProvider } from './context/AuthContext';
import { initGA, initHotjar } from './utils/analytics';
import { cleanupPublishedAndFailedMedia } from './utils/mediaCleanup';

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
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/pricing" element={<PricingPage />} />
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
