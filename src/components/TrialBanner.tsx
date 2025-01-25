import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Clock, Users, Calendar, Globe, ExternalLink } from 'lucide-react';
import { TRIAL_LIMITS } from '../types/trial';
import { BASIC_PLATFORMS, PLATFORM_NAMES } from '../types/plans';
import api from '../utils/api';

interface UsageIndicatorProps {
  current: number;
  max: number;
  label: string;
  icon: React.ReactNode;
}

function UsageIndicator({ current, max, label, icon }: UsageIndicatorProps) {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;

  return (
    <div className="flex items-center space-x-1">
      {icon}
      <span className="text-xs text-white/90">{label}</span>
      <div className="w-8 h-1 bg-white/20 rounded-full">
        <div
          className={`h-1 rounded-full ${
            isNearLimit ? 'bg-amber-400' : 'bg-blue-400'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={`text-xs ${isNearLimit ? 'text-amber-200' : 'text-white/70'}`}>
        {current}/{max}
      </span>
    </div>
  );
}

export default function TrialBanner() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    postsToday: number;
    scheduledPosts: number;
    teamMembers: number;
    platformUsage: Record<string, number>;
    isLoading: boolean;
  }>({
    postsToday: 0,
    scheduledPosts: 0,
    teamMembers: 1,
    platformUsage: {},
    isLoading: true
  });

  useEffect(() => {
    const fetchTrialStats = async () => {
      try {
        const response = await api.get('/api/trial/stats');
        setStats({
          ...response.data,
          platformUsage: response.data.platformUsage || {},
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching trial stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    if (user?.subscription?.status === 'trial') {
      fetchTrialStats();
      // Refresh stats every 5 minutes
      const interval = setInterval(fetchTrialStats, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user?.subscription?.status]);

  // Early return if no user or subscription
  if (!user?.subscription) {
    return null;
  }

  // Early return if not in trial
  if (user.subscription.status !== 'trial' || !user.subscription.trialEnd) {
    return null;
  }

  const trialEnd = new Date(user.subscription.trialEnd);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // If trial has ended, refresh user data
  if (daysLeft === 0) {
    window.location.reload();
    return null;
  }

  if (stats.isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 m-4 rounded-lg shadow-lg">
        <div className="container mx-auto px-4">
          <div className="h-12 flex items-center justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 mx-4 mt-4 rounded-lg shadow-lg">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          {/* Left Section: Trial Status */}
          <div className="flex items-center space-x-6">
            {/* Trial Timer */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <div className="p-1 bg-white/10 rounded">
                  <Clock className="w-3.5 h-3.5 text-blue-200" />
                </div>
                <span className="text-sm font-medium text-white">
                  {daysLeft}d left
                </span>
              </div>
              <span className="text-xs text-blue-200">
                Expires {trialEnd.toLocaleDateString()}
              </span>
            </div>

            {/* Usage Stats */}
            <div className="flex items-center space-x-4">
              <UsageIndicator
                current={stats.postsToday}
                max={TRIAL_LIMITS.maxPostsPerDay}
                label="Daily"
                icon={<Calendar className="w-3.5 h-3.5 text-blue-200" />}
              />
              <UsageIndicator
                current={stats.scheduledPosts}
                max={TRIAL_LIMITS.maxScheduledPosts}
                label="Scheduled"
                icon={<Clock className="w-3.5 h-3.5 text-blue-200" />}
              />
              <UsageIndicator
                current={stats.teamMembers}
                max={TRIAL_LIMITS.maxTeamMembers}
                label="Team"
                icon={<Users className="w-3.5 h-3.5 text-blue-200" />}
              />
            </div>

            {/* Platform Stats */}
            <div className="flex items-center space-x-4">
              {BASIC_PLATFORMS.map(platform => (
                <UsageIndicator
                  key={platform}
                  current={stats.platformUsage[platform] || 0}
                  max={TRIAL_LIMITS.maxPostsPerPlatform}
                  label={PLATFORM_NAMES[platform]}
                  icon={<Globe className="w-3.5 h-3.5 text-blue-200" />}
                />
              ))}
            </div>
          </div>

          {/* Right Section: Upgrade Button */}
          <Link
            to="/dashboard/settings"
            className="text-xs px-2.5 py-1 bg-white hover:bg-opacity-90 text-blue-600 font-medium rounded-full transition-colors flex items-center shadow-sm whitespace-nowrap"
          >
            Upgrade
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}