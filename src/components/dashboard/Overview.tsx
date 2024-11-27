import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, Clock } from 'lucide-react';
import StatsCard from './overview/StatsCard';
import SocialConnectBanner from './overview/SocialConnectBanner';
import UpcomingPosts from './overview/UpcomingPosts';
import ConnectAccountModal from '../modals/ConnectAccountModal';
import LoadingSpinner from '../common/LoadingSpinner';
import type { Post } from '../../types/posts';
import type { SocialAccount } from '../../types/overview';

interface OverviewProps {
  onNewPost: () => void;
}

export default function Overview({ onNewPost }: OverviewProps) {
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      // Fetch stats
      const statsResponse = await fetch('http://localhost:5000/api/overview/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch stats');
      }

      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch social accounts
      const accountsResponse = await fetch('http://localhost:5000/api/social-accounts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!accountsResponse.ok) {
        throw new Error('Failed to fetch social accounts');
      }

      const accountsData = await accountsResponse.json();
      setSocialAccounts(accountsData);

      // Fetch scheduled posts
      const postsResponse = await fetch('http://localhost:5000/api/posts/scheduled', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!postsResponse.ok) {
        throw new Error('Failed to fetch scheduled posts');
      }

      const postsData = await postsResponse.json();
      setScheduledPosts(postsData);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAccount = async (platform: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('http://localhost:5000/api/social-accounts/connect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect account');
      }

      const newAccount = await response.json();
      setSocialAccounts((prev) => [...prev, newAccount]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect account');
      throw err;
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`http://localhost:5000/api/social-accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect account');
      }

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
        connectedAccounts={socialAccounts}
        onAccountConnect={handleConnectAccount}
        onAccountDisconnect={handleDisconnectAccount}
      />
    </div>
  );
}

