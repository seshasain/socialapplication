import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, AlertCircle, Check, X } from 'lucide-react';
import zxcvbn from 'zxcvbn';

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
  const [error, setError] = useState('');
  const [passwordScore, setPasswordScore] = useState(0);
  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Your actual reCAPTCHA v3 site key
  const RECAPTCHA_SITE_KEY = "6LdXzXgqAAAAAKOU92xe7WQyRIFcHBK4T3ruI8fz";

  useEffect(() => {
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
      document.body.removeChild(script);
      document.head.removeChild(style);
    };
  }, []);

  React.useEffect(() => {
    const referrer = document.referrer || '/pricing';
    setRedirectUrl(referrer);
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
      if (!validatePassword(formData.password)) {
        setError('Please choose a stronger password');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Execute reCAPTCHA and get token
      const captchaToken = await executeRecaptcha();

      await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        redirectUrl,
        captchaToken
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create an account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
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
    <>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-gray-600">
              Start managing your social media presence
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handlePasswordChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
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
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Signing up...' : 'Sign up'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5 mr-2"
              />
              Sign up with Google
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <div className="text-center text-xs text-gray-500 mt-4">
        This site is protected by reCAPTCHA and the Google{' '}
        <a href="https://policies.google.com/privacy" className="text-blue-600 hover:text-blue-700">
          Privacy Policy
        </a>{' '}
        and{' '}
        <a href="https://policies.google.com/terms" className="text-blue-600 hover:text-blue-700">
          Terms of Service
        </a>{' '}
        apply.
      </div>
    </>
  );
}
