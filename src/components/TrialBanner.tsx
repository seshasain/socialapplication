import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Clock, Users, Calendar, ExternalLink } from 'lucide-react';
import { TRIAL_LIMITS } from '../types/trial';
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
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1.5">
        {icon}
        <span className="text-xs text-white/90">{label}</span>
      </div>
      <div className="w-16 h-1 bg-white/20 rounded-full">
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

interface TrialStats {
  postsToday: number;
  scheduledPosts: number;
  teamMembers: number;
  isLoading: boolean;
}

export default function TrialBanner() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = React.useState<TrialStats>({
    postsToday: 0,
    scheduledPosts: 0,
    teamMembers: 1,
    isLoading: true
  });

  useEffect(() => {
    const fetchTrialStats = async () => {
      try {
        const response = await api.get('/api/trial/stats');
        setStats({
          ...response.data,
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching trial stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    if (user?.subscription.isInTrial) {
      fetchTrialStats();
      // Refresh stats every 5 minutes
      const interval = setInterval(fetchTrialStats, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user?.subscription.isInTrial]);
  
  if (!user?.subscription.isInTrial || !user.subscription.trialEnd) {
    return null;
  }

  const trialEnd = new Date(user.subscription.trialEnd);
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

  // If trial has ended, refresh user data
  if (daysLeft === 0) {
    refreshUser();
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
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 m-4 rounded-lg shadow-lg">
      <div className="container mx-auto px-4">
        <div className="h-12 flex items-center justify-between">
          <div className="flex items-center divide-x divide-white/20">
            <div className="flex items-center pr-4 space-x-4">
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
            
            <div className="hidden sm:flex items-center space-x-4 px-4">
              <UsageIndicator
                current={stats.postsToday}
                max={TRIAL_LIMITS.maxPostsPerDay}
                label="Posts"
                icon={<Calendar className="w-3.5 h-3.5 text-blue-200" />}
              />
              <UsageIndicator
                current={stats.scheduledPosts}
                max={TRIAL_LIMITS.maxScheduledPosts}
                label="Scheduled"
                icon={<Clock className="w-3.5 h-3.5 text-blue-200" />}
              />
            </div>

            <div className="hidden md:flex items-center space-x-4 px-4">
              <UsageIndicator
                current={stats.teamMembers}
                max={TRIAL_LIMITS.maxTeamMembers}
                label="Team"
                icon={<Users className="w-3.5 h-3.5 text-blue-200" />}
              />
            </div>
          </div>

          <Link
            to="/dashboard/settings"
            className="text-xs px-3 py-1.5 bg-white hover:bg-opacity-90 text-blue-600 font-medium rounded-full transition-colors flex items-center shadow-sm"
          >
            Upgrade Now
            <ExternalLink className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
} 