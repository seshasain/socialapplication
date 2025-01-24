import React, { useState, useEffect } from 'react';
import {
  Layout,
  Calendar,
  BarChart2,
  Users2,
  Settings,
  Crown,
  History,
  Clock,
  FileText,
  HelpCircle,
  MessageSquare,
  Menu,
  X,
  Shield,
  Headphones,
  Bell,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PricingModal from '../modals/PricingModal';
import SupportModal from '../modals/SupportModal';
import FeedbackModal from '../modals/FeedbackModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

type View =
  | 'overview'
  | 'calendar'
  | 'analytics'
  | 'team'
  | 'settings'
  | 'history';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const CircularProgress = ({ value, max, color = 'blue', size = 32 }: { value: number; max: number; color?: string; size?: number }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth="2"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`text-${color}-600`}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-medium text-${color}-600`}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [usageStats, setUsageStats] = useState<{
    postsUsed: number;
    postsLimit: number;
    daysLeft: number;
    daysTotal: number;
    connectedAccounts: number;
    maxAccounts: number;
    scheduledPosts: number;
    maxScheduledPosts: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isPremium = user?.subscription?.planId === 'pro';
  const isTrialUser = user?.subscription?.status === 'active' && user?.subscription?.trialEnd !== null;

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const handleViewChange = (view: View) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  const fetchUsageStats = async () => {
    try {
      const response = await api.get('/api/user/usage');
      
      // Debug user subscription data
      console.log('User subscription:', {
        status: user?.subscription?.status,
        trialEnd: user?.subscription?.trialEnd,
        isTrialUser
      });

      // Parse trial end date with explicit timezone handling
      let daysLeft = 0;
      if (user?.subscription?.trialEnd) {
        const trialEnd = new Date(user.subscription.trialEnd);
        const now = new Date();
        
        // Set both dates to midnight for accurate day calculation
        const trialEndDate = new Date(trialEnd.getFullYear(), trialEnd.getMonth(), trialEnd.getDate());
        const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Calculate the difference in days
        const timeDiff = trialEndDate.getTime() - currentDate.getTime();
        daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        // Add 1 to include the current day if it's the first day
        if (daysLeft === 0 && trialEndDate.getDate() === currentDate.getDate()) {
          daysLeft = 1;
        }

        console.log('Trial period calculation:', {
          trialEnd: trialEnd.toISOString(),
          trialEndDate: trialEndDate.toISOString(),
          now: now.toISOString(),
          currentDate: currentDate.toISOString(),
          timeDiff,
          daysLeft
        });
      }

      // Group stats by category
      const stats = {
        posts: {
          used: response.data?.postsUsed || 0,
          limit: response.data?.postsLimit || (isTrialUser ? 20 : 10),
          icon: FileText,
          color: 'blue',
          label: 'Posts',
          tooltip: 'Total posts this month'
        },
        accounts: {
          used: response.data?.connectedAccounts || 0,
          limit: response.data?.maxAccounts || (isTrialUser ? 4 : 2),
          icon: Users2,
          color: 'purple',
          label: 'Connected',
          tooltip: 'Connected social accounts'
        },
        scheduled: {
          used: response.data?.scheduledPosts || 0,
          limit: response.data?.maxScheduledPosts || (isTrialUser ? 10 : 5),
          icon: Calendar,
          color: 'green',
          label: 'Scheduled',
          tooltip: 'Scheduled posts'
        }
      };

      setUsageStats({
        postsUsed: stats.posts.used,
        postsLimit: stats.posts.limit,
        daysLeft,
        daysTotal: 7,
        connectedAccounts: stats.accounts.used,
        maxAccounts: stats.accounts.limit,
        scheduledPosts: stats.scheduled.used,
        maxScheduledPosts: stats.scheduled.limit
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      
      // Use the same trial period calculation in error case
      let daysLeft = 0;
      if (user?.subscription?.trialEnd) {
        const trialEnd = new Date(user.subscription.trialEnd);
        const now = new Date();
        
        const trialEndDate = new Date(trialEnd.getFullYear(), trialEnd.getMonth(), trialEnd.getDate());
        const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const timeDiff = trialEndDate.getTime() - currentDate.getTime();
        daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        if (daysLeft === 0 && trialEndDate.getDate() === currentDate.getDate()) {
          daysLeft = 1;
        }
      }

      setUsageStats({
        postsUsed: 0,
        postsLimit: isTrialUser ? 20 : 10,
        daysLeft,
        daysTotal: 7,
        connectedAccounts: 0,
        maxAccounts: isTrialUser ? 4 : 2,
        scheduledPosts: 0,
        maxScheduledPosts: isTrialUser ? 10 : 5
      });
      setError(err instanceof Error ? err.message : 'Failed to fetch usage stats');
    }
  };

  const menuItems = [
    { 
      icon: Layout, 
      label: 'Overview', 
      value: 'overview' as View,
      tooltip: 'Dashboard overview and key metrics'
    },
    { 
      icon: History, 
      label: 'History', 
      value: 'history' as View,
      tooltip: 'View your post history and status'
    },
    { 
      icon: Calendar, 
      label: 'Calendar', 
      value: 'calendar' as View, 
      badge: isTrialUser ? 'Pro' : null,
      tooltip: 'Schedule and manage your posts'
    },
    { 
      icon: BarChart2, 
      label: 'Analytics', 
      value: 'analytics' as View, 
      badge: isTrialUser ? 'Limited' : null,
      tooltip: 'View your social media performance'
    },
    { 
      icon: Users2, 
      label: 'Team', 
      value: 'team' as View, 
      badge: isTrialUser ? 'Pro' : null,
      tooltip: 'Manage team members and permissions'
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      value: 'settings' as View,
      tooltip: 'Account and application settings'
    },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-6 left-6 z-50 p-2 rounded-lg bg-white shadow-lg hover:bg-gray-50"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-gray-600" />
        ) : (
          <Menu className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out z-40 w-72 bg-white border-r border-gray-200 shadow-sm flex flex-col h-screen`}
      >
        {/* Header Section */}
        <div className="flex flex-col flex-shrink-0 p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isPremium
                    ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 shadow-amber-100 shadow-lg'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-100 shadow-lg'
                }`}
              >
                <Layout className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                CrossPodium
              </span>
            </div>
          </div>

          {/* User Info with Trial Status */}
          {user && (
            <div className="mb-6 p-4 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isPremium
                      ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800'
                      : isTrialUser
                      ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800'
                      : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800'
                  }`}
                >
                  {isPremium ? 'Pro' : isTrialUser ? 'Trial' : 'Free'}
                </div>
              </div>
              {isTrialUser && usageStats && (
                <div className="mt-3 p-2 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">Trial Period</span>
                    </div>
                    <div className="flex items-center bg-white px-2 py-1 rounded-lg shadow-sm">
                      <span className="text-sm font-semibold text-blue-600 mr-2">
                        {usageStats.daysLeft}d left
                      </span>
                      <CircularProgress
                        value={usageStats.daysLeft}
                        max={usageStats.daysTotal}
                        color="blue"
                        size={20}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-1.5">
            {menuItems.map(({ icon: Icon, label, value, badge, tooltip }) => (
              <button
                key={value}
                onClick={() => handleViewChange(value)}
                title={tooltip}
                className={`group relative w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  currentView === value
                    ? `${
                        isPremium
                          ? 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 shadow-sm border border-yellow-100'
                          : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                      }`
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      badge === 'Pro'
                        ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800'
                        : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600'
                    }`}
                  >
                    {badge}
                  </span>
                )}
                <div className="absolute left-0 transform -translate-x-full -translate-y-1/2 top-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {tooltip}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Usage Stats Section */}
        <div className="flex-1 px-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {user?.subscription && usageStats && (
            <div className="space-y-3">
              {/* Posts Usage */}
              <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-500">Posts</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {usageStats.postsUsed}/{usageStats.postsLimit}
                      </p>
                    </div>
                  </div>
                  <CircularProgress
                    value={usageStats.postsUsed}
                    max={usageStats.postsLimit}
                    color={usageStats.postsUsed >= usageStats.postsLimit * 0.9 ? 'red' : 'blue'}
                    size={36}
                  />
                </div>
              </div>

              {/* Connected Accounts */}
              <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Users2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-500">Connected</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {usageStats.connectedAccounts}/{usageStats.maxAccounts}
                      </p>
                    </div>
                  </div>
                  <CircularProgress
                    value={usageStats.connectedAccounts}
                    max={usageStats.maxAccounts}
                    color="purple"
                    size={36}
                  />
                </div>
              </div>

              {/* Scheduled Posts */}
              <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-500">Scheduled</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {usageStats.scheduledPosts}/{usageStats.maxScheduledPosts}
                      </p>
                    </div>
                  </div>
                  <CircularProgress
                    value={usageStats.scheduledPosts}
                    max={usageStats.maxScheduledPosts}
                    color="green"
                    size={36}
                  />
                </div>
              </div>

              {/* Upgrade Button for Trial Users */}
              {isTrialUser && (
                <button
                  onClick={() => setIsPricingModalOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-4 flex items-center justify-center hover:from-blue-600 hover:to-indigo-700 transition-colors shadow-lg shadow-blue-100"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  <span className="text-sm font-semibold">Upgrade to Pro</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="flex-shrink-0 p-6 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="flex flex-col items-center justify-center p-3 text-sm text-gray-600 hover:bg-white hover:shadow-sm rounded-xl transition-all duration-200"
            >
              <Headphones className="w-5 h-5 mb-1 text-gray-500" />
              Support
            </button>
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="flex flex-col items-center justify-center p-3 text-sm text-gray-600 hover:bg-white hover:shadow-sm rounded-xl transition-all duration-200"
            >
              <MessageSquare className="w-5 h-5 mb-1 text-gray-500" />
              Feedback
            </button>
            <button
              onClick={() => navigate('/privacy')}
              className="flex flex-col items-center justify-center p-3 text-sm text-gray-600 hover:bg-white hover:shadow-sm rounded-xl transition-all duration-200"
            >
              <Shield className="w-5 h-5 mb-1 text-gray-500" />
              Privacy
            </button>
          </div>
        </div>
      </div>

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </>
  );
}