import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, Clock } from 'lucide-react';
import StatsCard from './overview/StatsCard';
import SocialConnectBanner from './overview/SocialConnectBanner';
import UpcomingPosts from './overview/UpcomingPosts';
import NewPostModal from '../modals/NewPostModal';
import ConnectAccountModal from '../modals/ConnectAccountModal';
import LoadingSpinner from '../common/LoadingSpinner';
import { OverviewStats, Post, SocialAccount } from '../../types/overview';
import { fetchOverviewData, connectSocialAccount, disconnectSocialAccount } from '../../api/overview';

interface OverviewData {
  stats: OverviewStats;
  posts: Post[];
  accounts: SocialAccount[];
}

export default function Overview() {
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data: OverviewData = await fetchOverviewData();
      setStats(data.stats);
      setScheduledPosts(data.posts);
      setSocialAccounts(data.accounts || []);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAccount = async (platform: string) => {
    try {
      const newAccount = await connectSocialAccount(platform);
      setSocialAccounts(prev => [...prev, newAccount]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect account');
      throw err; // Re-throw to be handled by the modal
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      await disconnectSocialAccount(accountId);
      setSocialAccounts(prev => prev.filter(account => account.id !== accountId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
      throw err; // Re-throw to be handled by the modal
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
        onNewPost={() => setIsNewPostModalOpen(true)}
      />

      <NewPostModal
        isOpen={isNewPostModalOpen}
        onClose={() => setIsNewPostModalOpen(false)}
        onSave={() => {}}
      />

      <ConnectAccountModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        connectedAccounts={socialAccounts}
        onAccountConnect={handleConnectAccount}
        onAccountDisconnect={handleDisconnectAccount}
      />
    </div>
  );
}