import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { TRIAL_LIMITS, TrialUsage } from '../../types/trial';
import { Clock, Users, Calendar, Gift, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className={`text-sm ${isNearLimit ? 'text-red-600' : 'text-gray-600'}`}>
            {current}/{max}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${isNearLimit ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function TrialDashboard() {
  const { user } = useAuth();
  const [usage, setUsage] = React.useState<TrialUsage>({
    postsToday: 0,
    totalPosts: 0,
    scheduledPosts: 0,
    referralCount: 0,
    teamMembers: 1
  });

  React.useEffect(() => {
    // Mock data - replace with actual API calls
    setUsage({
      postsToday: 2,
      totalPosts: 8,
      scheduledPosts: 3,
      referralCount: 1,
      teamMembers: 1
    });
  }, []);

  if (user?.subscription?.status !== 'trial') {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Trial Status</h2>
        <Link
          to="/dashboard/settings"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
        >
          Upgrade Now
          <ExternalLink className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="space-y-3">
        <UsageIndicator
          current={usage.postsToday}
          max={TRIAL_LIMITS.maxPostsPerDay}
          label="Posts Today"
          icon={<Calendar className="w-4 h-4 text-blue-500" />}
        />
        <UsageIndicator
          current={usage.scheduledPosts}
          max={TRIAL_LIMITS.maxScheduledPosts}
          label="Scheduled Posts"
          icon={<Clock className="w-4 h-4 text-blue-500" />}
        />
        <UsageIndicator
          current={usage.teamMembers}
          max={TRIAL_LIMITS.maxTeamMembers}
          label="Team Members"
          icon={<Users className="w-4 h-4 text-blue-500" />}
        />
      </div>

      {/* Referral Progress */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Referral Progress</span>
          <Link
            to="/referrals"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View Details
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-blue-500"
                style={{ width: `${(usage.referralCount / 5) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">{usage.referralCount} referrals</span>
              <span className="text-xs text-gray-500">{usage.referralCount * 2} days earned</span>
            </div>
          </div>
          <Link
            to="/referrals"
            className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Gift className="w-4 h-4 mr-1" />
            Invite
          </Link>
        </div>
      </div>
    </div>
  );
} 