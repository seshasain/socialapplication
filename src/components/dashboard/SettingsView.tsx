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
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { PLANS, BASIC_PLATFORMS, PRO_PLATFORMS, PLATFORM_NAMES, SocialPlatform, ALL_PLATFORMS } from '../../types/plans';
import { getPlatformIcon, PLATFORM_COLORS } from '../../utils/platformUtils';

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

interface ConnectedPlatform {
  id: string;
  platform: string;
  username?: string;
  profileUrl?: string;
  lastSync?: string;
  status: 'active' | 'error' | 'revoked';
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
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([]);

  useEffect(() => {
    fetchUserData();
    fetchConnectedPlatforms();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/api/user/profile');
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

  const fetchConnectedPlatforms = async () => {
    try {
      const response = await api.get('/api/social-accounts');
      setConnectedPlatforms(response.data);
    } catch (err) {
      console.error('Error fetching connected platforms:', err);
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

  const handleDisconnectPlatform = async (platformId: string) => {
    try {
      await api.delete(`/api/social-accounts/${platformId}`);
      setConnectedPlatforms(prev => prev.filter(p => p.id !== platformId));
      toast.success('Platform disconnected successfully');
    } catch (err) {
      toast.error('Failed to disconnect platform');
    }
  };

  const handleRefreshPlatform = async (platformId: string) => {
    try {
      await api.post(`/api/social-accounts/${platformId}/refresh`);
      await fetchConnectedPlatforms();
      toast.success('Platform connection refreshed');
    } catch (err) {
      toast.error('Failed to refresh platform connection');
    }
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
        {/* Password Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-gray-900">Password</h4>
                <p className="text-sm text-gray-500">Update your account password</p>
              </div>
            </div>
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Change Password
            </button>
          </div>

          {showChangePassword && (
            <form onSubmit={handlePasswordChange} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    required
                    minLength={8}
                />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    required
                    minLength={8}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 8 characters long
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    required
                    minLength={8}
                />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveStatus === 'saving' || 
                    !passwordData.currentPassword || 
                    !passwordData.newPassword || 
                    !passwordData.confirmPassword ||
                    passwordData.newPassword !== passwordData.confirmPassword}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Account Management Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
            <div className="p-3 bg-red-50 rounded-lg">
              <Shield className="w-5 h-5 text-red-600" />
              </div>
            <div className="ml-4">
              <h4 className="text-base font-medium text-gray-900">Account Management</h4>
              <p className="text-sm text-gray-500">Manage your account status and data</p>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <button
              onClick={() => navigate('/account/delete')}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors group border border-red-100"
            >
              <span className="flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Delete Account
              </span>
              <div className="flex items-center text-red-400">
                <span className="text-xs mr-2 group-hover:opacity-100 opacity-0 transition-opacity">Permanently delete your account</span>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
            <button
              onClick={() => navigate('/account/reactivate')}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group border border-blue-100"
            >
              <span className="flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reactivate Account
              </span>
              <div className="flex items-center text-blue-400">
                <span className="text-xs mr-2 group-hover:opacity-100 opacity-0 transition-opacity">Restore your deactivated account</span>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlatformsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Connected Platforms</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your connected social media accounts and their permissions.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Basic Platforms</h4>
          <div className="space-y-4">
            {BASIC_PLATFORMS.map((platform) => {
              const connected = connectedPlatforms.find(
                p => p.platform.toLowerCase() === platform.toLowerCase()
              );
              const icon = getPlatformIcon(platform);
              const colors = PLATFORM_COLORS[platform];

              return (
                <div
                  key={platform}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
                      {icon}
                    </div>
                    <div>
                      <h5 className="font-medium">{PLATFORM_NAMES[platform]}</h5>
                      {connected ? (
                        <p className="text-sm text-gray-500">
                          Connected as @{connected.username}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">Not connected</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {connected && (
                      <>
                        <button
                          onClick={() => handleRefreshPlatform(connected.id)}
                          className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDisconnectPlatform(connected.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          Disconnect
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">Pro Platforms</h4>
            {currentPlan !== 'pro' && (
              <Link
                to="/dashboard/billing"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Upgrade to Pro
                <ChevronRight className="w-4 h-4 inline-block ml-1" />
              </Link>
            )}
          </div>
          <div className="space-y-4">
            {PRO_PLATFORMS.map((platform) => {
              const connected = connectedPlatforms.find(
                p => p.platform.toLowerCase() === platform.toLowerCase()
              );
              const icon = getPlatformIcon(platform);
              const colors = PLATFORM_COLORS[platform];
              const isLocked = currentPlan !== 'pro';

              return (
                <div
                  key={platform}
                  className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg ${
                    isLocked ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
                      {icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{PLATFORM_NAMES[platform]}</h5>
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                          PRO
                        </span>
                      </div>
                      {connected ? (
                        <p className="text-sm text-gray-500">
                          Connected as @{connected.username}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          {isLocked ? 'Upgrade to Pro to connect' : 'Not connected'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {connected && (
                      <>
                        <button
                          onClick={() => handleRefreshPlatform(connected.id)}
                          className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDisconnectPlatform(connected.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          Disconnect
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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

      <div className="space-y-8">
        {/* Current Plan Status */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <h4 className="text-base font-medium text-gray-900">Current Plan</h4>
              <p className="text-sm text-gray-500">
                {subscription?.status === 'trial' ? 'Free Trial' : 
                 subscription?.planId ? PLANS[subscription.planId as keyof typeof PLANS]?.name : 'No Plan'}
              </p>
              {subscription?.currentPeriodStart && subscription?.currentPeriodEnd && (
                <div className="mt-2 text-xs text-gray-500">
                  <p>Started: {new Date(subscription.currentPeriodStart).toLocaleDateString()}</p>
                  <p>Ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
          {isInTrial && user?.subscription?.trialEnd && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-700">
                  Trial ends on {new Date(user.subscription.trialEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Available Plans */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-base font-medium text-gray-900">Available Plans</h4>
            <p className="mt-1 text-sm text-gray-500">Choose the perfect plan for your needs</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Basic Plan */}
              {subscription?.planId !== 'basic' && (
                <div className={`p-6 rounded-xl border ${
                  subscription?.planId === 'basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } h-full`}>
                  <div className="flex flex-col h-full">
                  <div>
                      <h5 className="text-lg font-medium text-gray-900">Basic Plan</h5>
                      <p className="mt-1 text-sm text-gray-500">Essential features for individuals</p>
                      <div className="mt-4">
                        <span className="text-3xl font-bold text-gray-900">${PLANS.basic.price.monthly}</span>
                        <span className="text-gray-500">/month</span>
                      </div>
                    </div>
                    <div className="mt-6 flex-grow">
                      <h6 className="text-sm font-medium text-gray-900 mb-4">Features included:</h6>
                      <ul className="space-y-3">
                        {PLANS.basic.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4">
                        <h6 className="text-sm font-medium text-gray-900 mb-2">Plan Limits:</h6>
                        <ul className="space-y-2">
                          <li className="flex items-center text-sm text-gray-600">
                            <span className="w-32">Monthly Posts:</span>
                            <span className="font-medium">{PLANS.basic.limits.monthlyPosts}</span>
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <span className="w-32">Scheduled Posts:</span>
                            <span className="font-medium">{PLANS.basic.limits.scheduledPosts}</span>
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <span className="w-32">Team Members:</span>
                            <span className="font-medium">{PLANS.basic.limits.teamMembers}</span>
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <span className="w-32">Analytics History:</span>
                            <span className="font-medium">{PLANS.basic.limits.analyticsHistory} days</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        onClick={() => handleUpgrade('basic')}
                        disabled={subscription?.planId === 'basic'}
                        className={`w-full px-4 py-2 rounded-lg text-sm font-medium ${
                          subscription?.planId === 'basic'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {subscription?.planId === 'basic' ? 'Current Plan' : 'Select Basic'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pro Plan */}
              {subscription?.planId !== 'pro' && (
                <div className={`p-6 rounded-xl border ${
                  subscription?.planId === 'pro' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } h-full`}>
                  <div className="flex flex-col h-full">
                    <div>
                      <h5 className="text-xl font-semibold text-gray-900">Pro Plan</h5>
                      <p className="mt-1 text-sm text-gray-500">Advanced features for growing teams</p>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-gray-900">${PLANS.pro.price.monthly}</span>
                        <span className="text-gray-500">/month</span>
                      </div>
                    </div>
                    <div className="mt-6 flex-grow">
                      <h6 className="text-sm font-medium text-gray-900 mb-4">Features included:</h6>
                      <ul className="space-y-3">
                        {PLANS.pro.features
                          .filter(feature => !PLANS.basic.features.includes(feature))
                          .map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <div className="bg-blue-100 rounded-full p-1 mr-2">
                                <Check className="w-3 h-3 text-blue-600 flex-shrink-0" />
                              </div>
                              <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                            </li>
                        ))}
                      </ul>
                      <div className="mt-4">
                        <h6 className="text-sm font-medium text-gray-900 mb-2">Enhanced Limits:</h6>
                        <ul className="space-y-2">
                          <li className="flex items-center text-sm text-gray-600">
                            <span className="w-32">Monthly Posts:</span>
                            <span className="font-medium">
                              {PLANS.pro.limits.monthlyPosts === 'unlimited' || PLANS.pro.limits.monthlyPosts === -1 
                                ? 'Unlimited' 
                                : PLANS.pro.limits.monthlyPosts}
                            </span>
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <span className="w-32">Scheduled Posts:</span>
                            <span className="font-medium">
                              {PLANS.pro.limits.scheduledPosts === 'unlimited' || PLANS.pro.limits.scheduledPosts === -1 
                                ? 'Unlimited' 
                                : PLANS.pro.limits.scheduledPosts}
                            </span>
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <span className="w-32">Team Members:</span>
                            <span className="font-medium">{PLANS.pro.limits.teamMembers}</span>
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <span className="w-32">Analytics History:</span>
                            <span className="font-medium">{PLANS.pro.limits.analyticsHistory} days</span>
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <span className="w-32">Posts/Platform:</span>
                            <span className="font-medium">
                              {PLANS.pro.limits.postsPerPlatform === 'unlimited' || PLANS.pro.limits.postsPerPlatform === -1 
                                ? 'Unlimited' 
                                : PLANS.pro.limits.postsPerPlatform}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        onClick={() => handleUpgrade('pro')}
                        disabled={subscription?.planId === 'pro'}
                        className={`w-full px-4 py-3 rounded-lg text-sm font-medium ${
                          subscription?.planId === 'pro'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                        }`}
                      >
                        {subscription?.planId === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-600">
            Need a custom enterprise plan?{' '}
            <a 
              href="mailto:support@example.com" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'platforms', name: 'Platforms', icon: Globe },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'billing', name: 'Billing', icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 text-sm font-medium flex items-center ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'platforms' && renderPlatformsTab()}
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
    </div>
  );
}
