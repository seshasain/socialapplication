import React, { useState, useEffect, useRef } from 'react';
import { BarChart2, TrendingUp, Users, Clock, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import StatsCard from './overview/StatsCard';
import SocialConnectBanner from './overview/SocialConnectBanner';
import UpcomingPosts from './overview/UpcomingPosts';
import ConnectAccountModal from '../modals/ConnectAccountModal';
import LoadingSpinner from '../common/LoadingSpinner';
import type { Post, SocialAccount } from '../../types';
import type { SocialPlatform, PlanType } from '../../types/plans';
import { SubscriptionStatus } from '../../types/subscription';
import { useAuth } from '../../context/AuthContext';
import api, { socialAccounts as socialAccountsApi } from '../../utils/api';
import { API_URL } from '../../config/api';

interface OverviewProps {
  onNewPost: () => void;
}

export default function Overview({ onNewPost }: OverviewProps) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [stats, setStats] = useState<{
    totalPosts: number;
    engagementRate: number;
    totalFollowers: number;
    scheduledPosts: number;
  } | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const oauthInProgress = useRef(false);
  const userPlan = (user?.subscription?.planId || 'basic') as PlanType;
  const isTrialUser = user?.subscription?.status === SubscriptionStatus.TRIAL;

  // Log component renders
  console.log('Overview rendering:', { 
    isAuthenticated, 
    authLoading, 
    socialAccounts: socialAccounts.length,
    oauthInProgress: oauthInProgress.current 
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadData();
    }
  }, [isAuthenticated, authLoading]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const platform = params.get('platform');
    const status = params.get('status');

    console.log('Checking OAuth params:', { 
      platform, 
      status, 
      oauthInProgress: oauthInProgress.current 
    });

    // Only process if we have params and haven't handled them yet
    if (platform && status && !oauthInProgress.current) {
      console.log('Processing OAuth callback for platform:', platform);
      oauthInProgress.current = true;

      if (status === 'connected') {
        console.log('Platform connected, refreshing account list...');
        loadData()
          .then(() => {
            console.log('Account list refreshed successfully');
            toast.custom((t) => (
              <div className={`toast-notification ${
                t.visible ? 'animate-enter' : 'animate-leave'
              } bg-gradient-to-r from-emerald-500 to-green-600 text-white relative overflow-hidden`}>
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">Successfully connected to {platform}!</p>
                <div className="toast-progress" />
              </div>
            ), { duration: 3000 });
            // Clear URL parameters
            window.history.replaceState({}, '', window.location.pathname);
          })
          .catch((err) => {
            console.error('Failed to refresh account list:', err);
            setError('Failed to update account list. Please refresh the page.');
          })
          .finally(() => {
            oauthInProgress.current = false;
          });
      } else if (status === 'error') {
        console.log('OAuth error reported for platform:', platform);
        toast.custom((t) => (
          <div className={`toast-notification ${
            t.visible ? 'animate-enter' : 'animate-leave'
          } bg-gradient-to-r from-rose-500 to-red-600 text-white relative overflow-hidden`}>
            <XCircle className="h-5 w-5" />
            <p className="font-medium">Failed to connect to {platform}</p>
            <div className="toast-progress" />
          </div>
        ), { duration: 3000 });
        window.history.replaceState({}, '', window.location.pathname);
        oauthInProgress.current = false;
      }
    }
  }, []);

  const loadData = async () => {
    console.log('Loading data...');
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, accountsResponse, postsResponse] = await Promise.all([
        api.get('/api/overview/stats'),
        socialAccountsApi.list(),
        api.get('/api/posts/scheduled')
      ]);

      console.log('Data loaded:', {
        stats: statsResponse.data,
        accounts: accountsResponse.data.length,
        posts: postsResponse.data.length
      });

      setStats(statsResponse.data);
      setSocialAccounts(accountsResponse.data);
      setScheduledPosts(postsResponse.data);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAccount = async (platform: string) => {
    try {
      const normalizedPlatform = platform.toLowerCase() as SocialPlatform;
      const response = await api.get('/api/social-accounts/connect', { params: { platform: normalizedPlatform } });
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Connection error:', error);
      toast.custom((t) => (
        <div className={`toast-notification ${
          t.visible ? 'animate-enter' : 'animate-leave'
        } bg-gradient-to-r from-rose-500 to-red-600 text-white relative overflow-hidden`}>
          <XCircle className="h-5 w-5" />
          <p className="font-medium">Failed to connect to {platform}</p>
          <div className="toast-progress" />
        </div>
      ), { duration: 1000 });
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    console.log('Disconnecting account:', accountId);
    try {
      setSocialAccounts((prev) => prev.filter((account) => account.id !== accountId));
      setError(null);
    } catch (err) {
      console.error('Disconnect error:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
      throw err;
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <SocialConnectBanner
        onConnect={() => setIsConnectModalOpen(true)}
        socialAccounts={socialAccounts}
        userPlan={userPlan}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Posts"
          value={stats?.totalPosts.toLocaleString() || '0'}
          change="+12.5%"
          icon={BarChart2}
          color="blue"
        />
        <StatsCard
          title="Engagement Rate"
          value={`${(stats?.engagementRate || 0).toFixed(1)}%`}
          change="+2.1%"
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Total Followers"
          value={stats?.totalFollowers.toLocaleString() || '0'}
          change="+5.3%"
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Scheduled Posts"
          value={stats?.scheduledPosts.toString() || '0'}
          change="-1"
          icon={Clock}
          color="orange"
        />
      </div>

      <UpcomingPosts
        posts={scheduledPosts}
        onNewPost={onNewPost}
      />

      <ConnectAccountModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        socialAccounts={socialAccounts}
        onAccountConnect={handleConnectAccount}
        onAccountDisconnect={handleDisconnectAccount}
        userPlan={userPlan}
      />
    </div>
  );
}

