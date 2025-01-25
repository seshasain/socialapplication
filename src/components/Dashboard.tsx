import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  BarChart2,
  Users2,
  Settings,
  Plus,
  Layout,
  History,
} from 'lucide-react';
import Sidebar from './dashboard/Sidebar';
import CalendarView from './dashboard/CalendarView';
import Analytics from './dashboard/Analytics';
import TeamView from './dashboard/TeamView';
import SettingsView from './dashboard/SettingsView';
import Overview from './dashboard/Overview';
import HistoryView from './dashboard/HistoryView';
import NewPostModal from './modals/NewPostModal';
import TrialBanner from './TrialBanner';
import type { Post } from '../types/posts';
import type { SocialAccount } from '../types/overview';
import type { PlanType } from '../types/plans';
import { posts, socialAccounts as socialAccountsApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

type View =
  | 'overview'
  | 'calendar'
  | 'analytics'
  | 'team'
  | 'settings'
  | 'history';

interface PostStatusUpdate {
  id: string;
  platform: string;
  status: 'published' | 'scheduled' | 'failed' | 'processing';
  error?: string;
  publishedAt?: string;
  scheduledFor?: string;
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const userPlan = user?.subscription?.planId as PlanType || 'trial';

  // Get the current view from URL search params or default to 'overview'
  const searchParams = new URLSearchParams(location.search);
  const currentView = (searchParams.get('view') as View) || 'overview';

  const setCurrentView = (view: View) => {
    const params = new URLSearchParams(location.search);
    params.set('view', view);
    navigate({ search: params.toString() });
  };

  useEffect(() => {
    fetchSocialAccounts();
  }, []);

  const fetchSocialAccounts = async () => {
    try {
      const response = await socialAccountsApi.list();
      setSocialAccounts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching social accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch social accounts');
    }
  };

  const handleNewPost = async (post: Post) => {
    try {
      await posts.create(post);
      setShowNewPostModal(false);
      setError(null);
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    }
  };

  const handlePostSubmit = async (statuses: Array<{
    id: string;
    platform: string;
    status: 'published' | 'scheduled' | 'failed' | 'processing';
    error?: string;
    publishedAt?: string;
    scheduledFor?: string;
  }>) => {
    await fetchSocialAccounts();
  };

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <Overview onNewPost={() => setShowNewPostModal(true)} />;
      case 'calendar':
        return <CalendarView />;
      case 'analytics':
        return <Analytics />;
      case 'team':
        return <TeamView />;
      case 'settings':
        return <SettingsView />;
      case 'history':
        return <HistoryView />;
      default:
        return <Overview onNewPost={() => setShowNewPostModal(true)} />;
    }
  };

  // Only show trial banner if user is in trial period
  const showTrialBanner = user?.subscription?.isInTrial;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar 
          currentView={currentView} 
          onViewChange={setCurrentView}
          userPlan={userPlan}
        />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {showTrialBanner && <TrialBanner />}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            {renderView()}
          </div>
        </main>
      </div>

      {showNewPostModal && (
        <NewPostModal
          isOpen={showNewPostModal}
          onClose={() => setShowNewPostModal(false)}
          onSave={handleNewPost}
          onPostSubmit={handlePostSubmit}
          connectedAccounts={socialAccounts}
          userPlan={userPlan}
        />
      )}
    </div>
  );
}