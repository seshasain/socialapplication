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
import TeamView from './dashboard/context/TeamView';
import SettingsView from './dashboard/SettingsView';
import Overview from './dashboard/Overview';
import HistoryView from './dashboard/HistoryView';
import NewPostModal from './modals/NewPostModal';
import type { Post } from '../types/posts';
import { SocialAccount } from '../types/overview';
import PostStatusModal from './modals/PostStatusModal';
import api, { posts, socialAccounts as socialAccountsApi } from '../utils/api';

type View =
  | 'overview'
  | 'calendar'
  | 'analytics'
  | 'team'
  | 'settings'
  | 'history';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [platformStatuses, setPlatformStatuses] = useState<Array<{
    id: string;
    platform: string;
    status: 'published' | 'scheduled' | 'failed' | 'processing';
    error?: string;
    publishedAt?: string;
    scheduledFor?: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);

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

  const handlePostSubmit = (statuses: typeof platformStatuses) => {
    setShowNewPostModal(false);
    setPlatformStatuses(statuses);
    setShowStatusModal(true);
  };

  const handleNewPost = async (post: Post) => {
    try {
      await posts.create(post);
      setShowNewPostModal(false);
      // Refresh data in Overview component
      if (currentView === 'overview') {
        window.dispatchEvent(new CustomEvent('refreshOverview'));
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error instanceof Error ? error.message : 'Failed to create post');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              </h1>
              <p className="text-gray-600 mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {currentView === 'overview' && (
              <button
                onClick={() => setShowNewPostModal(true)}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Post
              </button>
            )}
          </div>

          {currentView === 'overview' && <Overview onNewPost={() => setShowNewPostModal(true)} />}
          {currentView === 'calendar' && <CalendarView />}
          {currentView === 'analytics' && <Analytics />}
          {currentView === 'team' && <TeamView />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'history' && <HistoryView />}
        </div>
      </main>

      <NewPostModal
        isOpen={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        onPostSubmit={handlePostSubmit}
        onSave={handleNewPost}
        connectedAccounts={socialAccounts}
      />
      <PostStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        platforms={platformStatuses}
        onRetry={async (platformId) => {
          try {
            // Use the API instance directly for retry and status endpoints
            await api.post(`/api/posts/retry/${platformId}`);
            setPlatformStatuses(prev => prev.map(p => 
              p.id === platformId 
                ? { ...p, status: 'processing', error: undefined }
                : p
            ));

            // Fetch updated status after a short delay
            setTimeout(async () => {
              const statusResponse = await api.get(`/api/posts/status/${platformId}`);
              setPlatformStatuses(prev => prev.map(p => 
                p.id === platformId ? { ...p, ...statusResponse.data } : p
              ));
            }, 2000);
          } catch (error) {
            console.error('Failed to retry post:', error);
            setError(error instanceof Error ? error.message : 'Failed to retry post');
          }
        }}
      />
    </div>
  );
}