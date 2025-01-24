import React, { useState, useEffect } from 'react';
import {
  Bell,
  Lock,
  Globe,
  CreditCard,
  User,
  Mail,
  Shield,
  Key,
  Smartphone,
  CreditCard as CardIcon,
  Calendar,
  AlertTriangle,
  Loader2,Check,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { PLANS } from '../../types/plans';
import { Link } from 'react-router-dom';

interface UserSettings {
  id: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  language: string;
  theme: string;
  autoSchedule: boolean;
  defaultVisibility: string;
}

interface UserProfile {
  name: string;
  email: string;
  timezone: string;
  bio: string;
  avatar: string;
  role: string;
}

interface Subscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface PaymentMethod {
  id: string;
  type: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const { user } = useAuth();
  const isInTrial = user?.subscription.isInTrial;
  const currentPlan = user?.subscription.planId || 'trial';
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: 'post_published',
      label: 'Post Published',
      description: 'Get notified when your scheduled posts are published',
      enabled: true
    },
    {
      id: 'post_failed',
      label: 'Post Failed',
      description: 'Get notified when a post fails to publish',
      enabled: true
    },
    {
      id: 'trial_expiring',
      label: 'Trial Status',
      description: 'Get notified about your trial status and expiration',
      enabled: true
    }
  ]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/user/profile');
      const userData = response.data;
      
      setProfile({
        name: userData.name || '',
        email: userData.email || '',
        timezone: userData.timezone || 'UTC',
        bio: userData.bio || '',
        avatar: userData.avatar || '',
        role: userData.role || 'USER',
      });

      if (userData.settings) {
        setSettings(userData.settings);
      }

      if (userData.subscription) {
        setSubscription(userData.subscription);
      }

      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveStatus('saving');
      await api.put('/user/profile', profile);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaveStatus('saving');
      await api.put('/user/settings', settings);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setSaveStatus('saving');
      await api.put('/user/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSaveStatus('saved');
      setShowChangePassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to update password');
    }
  };

  const handleUpgrade = async (planId: string) => {
    // TODO: Implement payment flow
    console.log('Upgrading to plan:', planId);
  };

  const handleNotificationToggle = (id: string) => {
    setNotificationSettings(settings =>
      settings.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Update your personal information and preferences.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={profile?.name || ''}
              onChange={(e) => setProfile(prev => ({ ...prev!, name: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              onChange={(e) => setProfile(prev => ({ ...prev!, email: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={profile?.bio || ''}
              onChange={(e) => setProfile(prev => ({ ...prev!, bio: e.target.value }))}
              rows={4}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Timezone</label>
            <select
              value={profile?.timezone || 'UTC'}
              onChange={(e) => setProfile(prev => ({ ...prev!, timezone: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveStatus === 'saving'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {saveStatus === 'saving' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage how you receive notifications.
        </p>
      </div>

      <div className="space-y-4">
        {notificationSettings.map((setting) => (
          <div
            key={setting.id}
            className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{setting.label}</p>
              <p className="text-sm text-gray-500">{setting.description}</p>
            </div>
            <button
              onClick={() => handleNotificationToggle(setting.id)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                setting.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  setting.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account security and authentication methods.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Key className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Password</h4>
                <p className="text-sm text-gray-500">Update your password</p>
              </div>
            </div>
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Change Password
            </button>
          </div>

          {showChangePassword && (
            <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Account Management</h4>
                <p className="text-sm text-gray-500">Manage your account status</p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <button
              onClick={() => navigate('/account/delete')}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <span className="flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Delete Account
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/account/reactivate')}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <span className="flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reactivate Account
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Billing & Subscription</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your subscription and payment methods.
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="mt-4 text-lg text-gray-600">
            Choose the perfect plan for your social media management needs
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <div className={`rounded-lg shadow-sm border ${currentPlan === 'basic' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'} p-8`}>
            <h2 className="text-xl font-semibold text-gray-900">Basic</h2>
            <p className="mt-4 text-gray-600">Essential social media management</p>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">
                ${PLANS.basic.price.monthly}
              </span>
              <span className="text-base font-medium text-gray-500">/mo</span>
            </div>
            <ul className="mt-8 space-y-4">
              {PLANS.basic.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade('basic')}
              disabled={currentPlan === 'basic'}
              className={`mt-8 w-full py-2 px-4 rounded-lg font-medium ${
                currentPlan === 'basic'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {currentPlan === 'basic' ? 'Current Plan' : 'Upgrade to Basic'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className={`rounded-lg shadow-sm border ${currentPlan === 'pro' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'} p-8`}>
            <div className="absolute top-0 right-0 -mr-1 -mt-1 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full transform translate-x-2 -translate-y-2">
              Popular
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Pro</h2>
            <p className="mt-4 text-gray-600">Advanced features for growing teams</p>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">
                ${PLANS.pro.price.monthly}
              </span>
              <span className="text-base font-medium text-gray-500">/mo</span>
            </div>
            <ul className="mt-8 space-y-4">
              {PLANS.pro.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={currentPlan === 'pro'}
              className={`mt-8 w-full py-2 px-4 rounded-lg font-medium ${
                currentPlan === 'pro'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Trial Status */}
          {isInTrial && (
            <div className="rounded-lg shadow-sm border border-gray-200 p-8 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">Trial Status</h2>
              <div className="mt-4">
                <p className="text-gray-600">
                  You're currently on a free trial with access to Basic features.
                  {user?.subscription.trialEnd && (
                    <>
                      <br />
                      Trial ends on:{' '}
                      {new Date(user.subscription.trialEnd).toLocaleDateString()}
                    </>
                  )}
                </p>
              </div>
              <div className="mt-8">
                <h3 className="font-medium text-gray-900">Available Platforms:</h3>
                <ul className="mt-4 space-y-2">
                  {PLANS.trial.features.map((platform) => (
                    <li key={platform} className="flex items-center text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Need a custom plan? {' '}
            <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-500">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'billing', name: 'Billing', icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Settings Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 text-sm font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'billing' && renderBillingTab()}

          {saveStatus === 'saved' && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center">
              <Check className="w-5 h-5 mr-2" />
              Changes saved successfully!
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save Changes
        </button>
      </div>
    </div>
  );
}
