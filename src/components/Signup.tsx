import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, AlertCircle, Check, X, Eye, EyeOff, Clock } from 'lucide-react';
import zxcvbn from 'zxcvbn';
import { PLANS, SocialPlatform } from '../types/plans';
import { motion } from 'framer-motion';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordScore, setPasswordScore] = useState(0);
  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get reCAPTCHA site key from environment variable
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      console.error('reCAPTCHA site key not found');
      return;
    }

    // Load reCAPTCHA v3 script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    document.body.appendChild(script);

    // Add style to hide badge
    const style = document.createElement('style');
    style.innerHTML = '.grecaptcha-badge { visibility: hidden !important; }';
    document.head.appendChild(style);

    return () => {
      // Cleanup script and style when component unmounts
      if (script.parentNode) script.parentNode.removeChild(script);
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, [RECAPTCHA_SITE_KEY]);

  React.useEffect(() => {
    // Check for plan in URL parameters
    const params = new URLSearchParams(window.location.search);
    const selectedPlan = params.get('plan');
    if (selectedPlan) {
      setRedirectUrl(`/dashboard/billing?plan=${selectedPlan}`);
    } else {
      setRedirectUrl('/dashboard');
    }
  }, []);

  const getPasswordStrength = (score: number) => {
    switch (score) {
      case 0:
        return { label: 'Very Weak', color: 'text-red-600' };
      case 1:
        return { label: 'Weak', color: 'text-orange-600' };
      case 2:
        return { label: 'Fair', color: 'text-yellow-600' };
      case 3:
        return { label: 'Good', color: 'text-green-500' };
      case 4:
        return { label: 'Strong', color: 'text-green-600' };
      default:
        return { label: 'Very Weak', color: 'text-red-600' };
    }
  };

  const validatePassword = (password: string) => {
    const result = zxcvbn(password);
    setPasswordScore(result.score);
    return result.score >= 3;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    validatePassword(password);
  };

  const executeRecaptcha = async () => {
    try {
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
        action: 'signup'
      });
      return token;
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      throw new Error('Failed to verify reCAPTCHA');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate password strength
      if (!validatePassword(formData.password)) {
        throw new Error('Please choose a stronger password');
      }

      // Get reCAPTCHA token
      const captchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
        action: 'signup'
      });

      // Call signup function from AuthContext with the correct interface
      const response = await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        redirectUrl: redirectUrl,
        captchaToken
      });
      
      // Navigate to the redirect URL from the response or dashboard
      const redirectTo = response.redirectUrl || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithGoogle();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Contains numbers', met: /\d/.test(formData.password) },
    { label: 'Contains uppercase', met: /[A-Z]/.test(formData.password) },
    { label: 'Contains lowercase', met: /[a-z]/.test(formData.password) },
    { label: 'Contains special characters', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
  ];

  const strengthInfo = getPasswordStrength(passwordScore);

  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated background with different pattern */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 via-white to-purple-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.1)_1px,transparent_0)] bg-[size:40px_40px]" />
        
        {/* Animated circles */}
        {[...Array(3)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0.3 }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8 + index * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 2,
            }}
            className={`absolute w-[40rem] h-[40rem] rounded-full mix-blend-multiply filter blur-3xl ${
              index === 0
                ? "bg-blue-200 top-0 -left-20"
                : index === 1
                ? "bg-purple-200 bottom-0 -right-20"
                : "bg-pink-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            }`}
          />
        ))}

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: Math.random() * 0.4 + 0.2,
              }}
              animate={{
                y: [null, Math.random() * -200],
                x: [null, Math.random() * 200 - 100],
                rotate: [0, 360],
              }}
              transition={{
                duration: Math.random() * 20 + 30,
                repeat: Infinity,
                ease: "linear",
              }}
              className={`absolute w-1 h-1 rounded-full ${
                i % 3 === 0
                  ? "bg-blue-400"
                  : i % 3 === 1
                  ? "bg-purple-400"
                  : "bg-pink-400"
              } opacity-20`}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full relative"
      >
        {/* Enhanced glass card effect */}
        <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          {/* Add a subtle gradient overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 via-transparent to-transparent" />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
            >
              Create Account
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-3 text-gray-600"
            >
              Join our community today
            </motion.p>
          </motion.div>

          {/* Trial Benefits Section with improved design */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-100"
          >
            <div className="flex items-center space-x-2 text-blue-800 font-medium">
              <Clock className="w-5 h-5" />
              <span>7-Day Free Trial Benefits</span>
            </div>
            <ul className="mt-3 space-y-2 grid grid-cols-2 gap-2">
              {PLANS.trial.features.map((feature, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center text-gray-700 bg-white/60 rounded-lg p-2"
                >
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm">{feature.replace('_', ' ')}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Error Message with improved animation */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mt-4 p-4 bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 text-red-700 rounded-r-lg"
            >
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            </motion.div>
          )}

          {/* Form fields with improved styling */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Name Input */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="group"
            >
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full rounded-xl border border-gray-300 px-4 py-3.5 bg-white/50 text-gray-900 
                    transition-all duration-200 ease-in-out
                    focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white
                    group-hover:border-gray-400 placeholder:text-gray-400"
                  placeholder="John Doe"
                />
              </div>
            </motion.div>

            {/* Email Input with icon */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="group"
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3.5 bg-white/50 text-gray-900 
                    transition-all duration-200 ease-in-out
                    focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white
                    group-hover:border-gray-400"
                  placeholder="you@example.com"
                />
              </div>
            </motion.div>

            {/* Password strength indicator improvements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative group">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 bg-gray-50 text-gray-900 
                      transition-all duration-200 ease-in-out
                      focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white
                      group-hover:border-gray-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Password Strength:</span>
                      <span className={`text-sm font-medium ${strengthInfo.color}`}>
                        {strengthInfo.label}
                      </span>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, index) => (
                        <div
                          key={index}
                          className={`h-1 flex-1 rounded-full ${
                            index <= passwordScore
                              ? index <= 1
                                ? 'bg-red-500'
                                : index === 2
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <ul className="space-y-1">
                      {passwordRequirements.map((req, index) => (
                        <li
                          key={index}
                          className="flex items-center text-sm"
                        >
                          {req.met ? (
                            <Check className="w-4 h-4 text-green-500 mr-2" />
                          ) : (
                            <X className="w-4 h-4 text-red-500 mr-2" />
                          )}
                          <span className={req.met ? 'text-green-700' : 'text-red-700'}>
                            {req.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative group">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 bg-gray-50 text-gray-900 
                      transition-all duration-200 ease-in-out
                      focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white
                      group-hover:border-gray-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>

            {/* Submit Button with loading state */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white px-4 py-3.5 rounded-xl font-medium
                  transform transition-all duration-200 ease-in-out
                  hover:shadow-lg hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed
                  active:scale-[0.98] relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating your account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </span>
              </button>
            </motion.div>
          </form>

          {/* Social Sign-in section with improved design */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              className="mt-4 w-full flex items-center justify-center px-4 py-3.5 border border-gray-300 rounded-xl
                bg-white text-gray-700 transition-all duration-200 ease-in-out
                hover:bg-gray-50 hover:border-gray-400 hover:shadow-md group"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200"
              />
              Sign up with Google
            </motion.button>
          </div>

          {/* Footer links with hover effects */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center space-y-4"
          >
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors
                  hover:underline decoration-2 underline-offset-2"
              >
                Sign in
              </Link>
            </p>
            
            <p className="text-xs text-gray-500">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Animated corner accents */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: "spring" }}
          className="absolute -top-2 -left-2 w-6 h-6"
        >
          <div className="w-full h-full border-t-2 border-l-2 border-blue-500 rounded-tl-lg" />
        </motion.div>
        {/* Add similar corner accents for other corners */}
      </motion.div>
    </div>
  );
}
