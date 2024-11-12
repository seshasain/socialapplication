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
} from 'lucide-react';
import PricingModal from '../modals/PricingModal';
import SupportModal from '../modals/SupportModal';
import FeedbackModal from '../modals/FeedbackModal';
import { useAuth } from '../../context/AuthContext';

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

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [usageStats, setUsageStats] = useState<{
    postsUsed: number;
    postsLimit: number;
    daysLeft: number;
    daysLimit: number;
  } | null>(null);
  const { user } = useAuth();

  const isPremium = user?.subscription?.planId !== 'free';
  const viewChange = false;

  useEffect(() => {
    fetchUsageStats();
  }, []);

  // Close mobile menu on view change
  const handleViewChange = (view: View) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  const fetchUsageStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/user/usage', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch usage stats');

      const data = await response.json();
      setUsageStats(data);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const getDaysLeftColor = (days: number) => {
    if (days <= 3) return 'text-red-600 bg-red-600';
    if (days <= 7) return 'text-yellow-600 bg-yellow-600';
    return 'text-blue-600 bg-blue-600';
  };

  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'text-red-600 bg-red-600';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-600';
    return 'text-blue-600 bg-blue-600';
  };

  const calculatePercentage = (value: number, max: number) => {
    return Math.min(Math.max((value / max) * 100, 0), 100);
  };

  const menuItems = [
    { icon: Layout, label: 'Overview', value: 'overview' as View },
    { icon: History, label: 'History', value: 'history' as View },
    { icon: Calendar, label: 'Calendar', value: 'calendar' as View },
    { icon: BarChart2, label: 'Analytics', value: 'analytics' as View },
    { icon: Users2, label: 'Team', value: 'team' as View },
    { icon: Settings, label: 'Settings', value: 'settings' as View },
  ];

  // Mobile menu button component
  const MobileMenuButton = () => (
    <button
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md hover:bg-gray-50"
    >
      {isMobileMenuOpen ? (
        <X className="w-6 h-6 text-gray-600" />
      ) : (
        <Menu className="w-6 h-6 text-gray-600" />
      )}
    </button>
  );

  return (
    <>
      <MobileMenuButton />
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out z-40 w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col h-screen`}
      >
        {/* Header Section */}
        <div className="p-6">
          <div className="flex items-center mb-8">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isPremium && viewChange
                  ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600'
                  : 'bg-blue-600'
              }`}
            >
              <Layout className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">
              SocialSync
            </span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {menuItems.map(({ icon: Icon, label, value }) => (
              <button
                key={value}
                onClick={() => handleViewChange(value)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  currentView === value
                    ? `${
                        isPremium && viewChange
                          ? 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700'
                          : 'bg-blue-50 text-blue-600'
                      } shadow-sm`
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Usage Stats Section */}
        <div className="flex-1 px-6 overflow-y-auto">
          {user?.subscription && usageStats && (
            <div className="space-y-3">
              {/* Days Left */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Days Left</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      getDaysLeftColor(usageStats.daysLeft).split(' ')[0]
                    }`}
                  >
                    {usageStats.daysLeft}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      getDaysLeftColor(usageStats.daysLeft).split(' ')[1]
                    }`}
                    style={{
                      width: `${calculatePercentage(
                        usageStats.daysLeft,
                        usageStats.daysLimit
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Posts Usage */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="w-4 h-4 mr-2" />
                    <span>Posts</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      getUsageColor(usageStats.postsUsed, usageStats.postsLimit).split(
                        ' '
                      )[0]
                    }`}
                  >
                    {usageStats.postsLimit === 1000
                      ? '∞'
                      : `${usageStats.postsUsed}/${usageStats.postsLimit}`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      getUsageColor(usageStats.postsUsed, usageStats.postsLimit).split(
                        ' '
                      )[1]
                    }`}
                    style={{
                      width:
                        usageStats.postsLimit === 1000
                          ? '100%'
                          : `${calculatePercentage(
                              usageStats.postsUsed,
                              usageStats.postsLimit
                            )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="p-6 border-t border-gray-200">
          {/* Premium/Upgrade Banner */}
          <div
            className={`rounded-xl p-4 text-white mb-4 ${
              isPremium
                ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 shadow-lg'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}
          >
            <div className="flex items-center mb-3">
              {isPremium && <Crown className="w-5 h-5 mr-2 text-yellow-200" />}
              <p
                className={`text-sm ${
                  isPremium ? 'text-yellow-100' : 'text-blue-100'
                }`}
              >
                {isPremium
                  ? 'Enjoying Premium Features'
                  : 'Upgrade to Pro for advanced features'}
              </p>
            </div>
            {!isPremium && (
              <button
                onClick={() => setIsPricingModalOpen(true)}
                className="block w-full bg-white text-blue-600 text-center py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Upgrade Plan
              </button>
            )}
          </div>

          {/* Support & Feedback Section */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Support
            </button>
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Feedback
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