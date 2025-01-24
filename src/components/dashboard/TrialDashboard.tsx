import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { TRIAL_LIMITS, TrialUsage } from '../../types/trial';
import { Clock, Users, Calendar, BarChart2, Share2, Gift } from 'lucide-react';
import TrialCountdown from '../TrialCountdown';
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
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium text-gray-900">{label}</span>
        </div>
        <span className={`text-sm font-medium ${
          isNearLimit ? 'text-red-600' : 'text-gray-600'
        }`}>
          {current} / {max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            isNearLimit ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isNearLimit && (
        <p className="mt-2 text-sm text-red-600">
          You're approaching your trial limit!
        </p>
      )}
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

  // Mock data - replace with actual API calls
  React.useEffect(() => {
    // Fetch trial usage data
    setUsage({
      postsToday: 2,
      totalPosts: 8,
      scheduledPosts: 3,
      referralCount: 1,
      teamMembers: 1
    });
  }, []);

  if (!user?.subscription.isInTrial) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Trial Status Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Trial Status</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            {user.subscription.trialEnd && (
              <TrialCountdown endDate={new Date(user.subscription.trialEnd)} />
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Extend Your Trial</h3>
            <p className="text-sm text-gray-600 mb-4">
              Invite friends to get additional trial days!
            </p>
            <div className="flex space-x-3">
              <Link
                to="/referrals"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Gift className="w-4 h-4 mr-2" />
                Invite Friends
              </Link>
              <Link
                to="/trial/extend"
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Clock className="w-4 h-4 mr-2" />
                Request Extension
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UsageIndicator
          current={usage.postsToday}
          max={TRIAL_LIMITS.maxPostsPerDay}
          label="Posts Today"
          icon={<Calendar className="w-5 h-5 text-blue-500" />}
        />
        <UsageIndicator
          current={usage.scheduledPosts}
          max={TRIAL_LIMITS.maxScheduledPosts}
          label="Scheduled Posts"
          icon={<Clock className="w-5 h-5 text-blue-500" />}
        />
        <UsageIndicator
          current={usage.teamMembers}
          max={TRIAL_LIMITS.maxTeamMembers}
          label="Team Members"
          icon={<Users className="w-5 h-5 text-blue-500" />}
        />
      </div>

      {/* Feature Comparison */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Available Features
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Trial Features</h3>
            <ul className="space-y-2">
              {TRIAL_LIMITS.availablePlatforms.map((platform) => (
                <li key={platform} className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Pro Features</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-500">
                <span className="w-2 h-2 bg-gray-300 rounded-full mr-2" />
                Advanced Analytics
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Pro
                </span>
              </li>
              <li className="flex items-center text-gray-500">
                <span className="w-2 h-2 bg-gray-300 rounded-full mr-2" />
                Unlimited Team Members
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Pro
                </span>
              </li>
              <li className="flex items-center text-gray-500">
                <span className="w-2 h-2 bg-gray-300 rounded-full mr-2" />
                Custom Reports
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Pro
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Referral Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Referral Progress
          </h2>
          <Link
            to="/referrals"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Details
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                {usage.referralCount} referrals
              </span>
              <span className="text-sm font-medium text-gray-600">
                {usage.referralCount * 2} days earned
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${(usage.referralCount / 5) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Invite 5 friends to get 10 extra trial days!
            </p>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
} 