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
  Loader2,Check
} from 'lucide-react';

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      // Fetch user profile and settings
      const userResponse = await fetch('http://localhost:5000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userResponse.ok) throw new Error('Failed to fetch user data');

      const userData = await userResponse.json();
      
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

      // Fetch subscription data if exists
      if (userData.subscription) {
        setSubscription(userData.subscription);
        
        // Fetch payment method if subscription exists
        const paymentResponse = await fetch('http://localhost:5000/api/billing/payment-method', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          setPaymentMethod(paymentData);
        }
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveStatus('saving');
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaveStatus('saving');
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('http://localhost:5000/api/user/settings', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to update settings');

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
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
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('http://localhost:5000/api/auth/password', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) throw new Error('Failed to update password');

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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Mail className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-500">Receive updates via email</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.emailNotifications}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev!,
                  emailNotifications: e.target.checked,
                }));
                handleSaveSettings();
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
              <p className="text-sm text-gray-500">Receive notifications in-app</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.pushNotifications}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev!,
                  pushNotifications: e.target.checked,
                }));
                handleSaveSettings();
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Smartphone className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
              <p className="text-sm text-gray-500">Receive notifications via SMS</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.smsNotifications}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev!,
                  smsNotifications: e.target.checked,
                }));
                handleSaveSettings();
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
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

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Current Plan</h4>
            <p className="text-sm text-gray-500 mt-1">
              {subscription ? `${subscription.status.charAt(0).toUpperCase()}${subscription.status.slice(1)} Plan` : 'Free Plan'}
            </p>
          </div>
          {!subscription && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Upgrade Plan
            </button>
          )}
        </div>

        {subscription && paymentMethod && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <CardIcon className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {paymentMethod.brand} •••• {paymentMethod.last4}
                  </p>
                  <p className="text-sm text-gray-500">
                    Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
                  </p>
                </div>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                Update
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Next billing date:{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </div>
          </div>
        )}
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4">
        <div className="p-6 border-r border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-3" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="col-span-3 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
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
