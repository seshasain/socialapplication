import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, Clock } from 'lucide-react';
import StatsCard from './overview/StatsCard';
import SocialConnectBanner from './overview/SocialConnectBanner';
import UpcomingPosts from './overview/UpcomingPosts';
import ConnectAccountModal from '../modals/ConnectAccountModal';
import LoadingSpinner from '../common/LoadingSpinner';
import type { Post, SocialAccount } from '../../types';
import { useAuth } from '../../context/AuthContext';
import api, { socialAccounts as socialAccountsApi } from '../../utils/api';

const isDevelopment = import.meta.env.MODE === 'development';
const API_URL = isDevelopment 
  ? 'http://localhost:5000'
  : 'https://crosspodium-api-katv4u7upa-uc.a.run.app';

interface OverviewProps {
  onNewPost: () => void;
}

export default function Overview({ onNewPost }: OverviewProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadData();
    }
  }, [isAuthenticated, authLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, accountsResponse, postsResponse] = await Promise.all([
        api.get('/api/overview/stats'),
        socialAccountsApi.list(),
        api.get('/api/posts/scheduled')
      ]);

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
      const response = await api.post('/api/social-accounts/connect', { platform });
      setSocialAccounts((prev) => [...prev, response.data]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect account');
      throw err;
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      await api.delete(`/api/social-accounts/${accountId}`);
      setSocialAccounts((prev) => prev.filter((account) => account.id !== accountId));
      setError(null);
    } catch (err) {
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
      />
    </div>
  );
}

