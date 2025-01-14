import React from 'react';
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

export default function App() {
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
            theme="dark" // Dark theme for a sleek, modern look
            toastStyle={{
              backgroundColor: '#333', // Dark background for toasts
              color: '#fff', // White text for contrast
              borderRadius: '8px', // Rounded corners
              padding: '15px', // Extra padding for better readability
              fontSize: '16px', // Readable font size
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' // Soft shadow for depth
            }}
            bodyStyle={{
              fontWeight: '500', // Slightly bold text
              fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', // Clean font
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}