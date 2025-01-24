import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import TrialCountdown from './TrialCountdown';

export default function TrialBanner() {
  const { user } = useAuth();
  
  if (!user?.subscription.isInTrial) {
    return null;
  }

  const trialEnd = user.subscription.trialEnd ? new Date(user.subscription.trialEnd) : null;
  
  if (!trialEnd) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 flex-1 max-w-md">
            <TrialCountdown 
              endDate={trialEnd} 
              onExpire={() => {
                // Refresh user data when trial expires
                window.location.reload();
              }} 
            />
          </div>
          <div className="hidden md:block">
            <span className="font-medium">
              Upgrade now to keep all features after your trial
            </span>
          </div>
        </div>
        <Link
          to="/dashboard/settings"
          className="ml-4 bg-white text-blue-600 px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          Upgrade Now
        </Link>
      </div>
    </div>
  );
} 