import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { useAuth } from '../../context/AuthContext';
import Overview from './Overview';
import CalendarView from './CalendarView';
import Analytics from './Analytics';
import TeamView from './TeamView';
import SettingsView from './SettingsView';
import HistoryView from './HistoryView';
import NewPostModal from '../modals/NewPostModal';
import PostStatusModal from '../modals/PostStatusModal';
import TrialDashboard from './TrialDashboard';
import TrialBanner from '../TrialBanner';
import api from '../../utils/api';
import type { Platform } from '../modals/PostStatusModal';
import Sidebar from './Sidebar';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';

type View = 'overview' | 'calendar' | 'analytics' | 'team' | 'settings' | 'history';

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = new URLSearchParams(location.search);
  const currentView = (searchParams.get('view') as View) || 'overview';
  
  const { posts, socialAccounts, refreshData } = useAppState();

  const handleViewChange = (view: View) => {
    searchParams.set('view', view);
    navigate({ search: searchParams.toString() });
  };

  const handleNewPost = async (post: any) => {
    try {
      const response = await api.post('/api/posts', post);
      await refreshData();
      setShowNewPostModal(false);
      // Handle post statuses
      if (response.data.platforms) {
        handlePostSubmit(response.data.platforms);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    }
  };

  const handlePostSubmit = (platforms: Platform[]) => {
    if (platforms.some(p => p.status === 'processing')) {
      setSelectedPlatform(platforms[0]);
      setShowStatusModal(true);
    }
  };

  const handleRetry = async (platformId: string) => {
    try {
      const response = await api.post(`/api/posts/retry/${platformId}`);
      if (response.data.platform) {
        setSelectedPlatform(response.data.platform);
      }
    } catch (err) {
      console.error('Error retrying post:', err);
      setError('Failed to retry post. Please try again.');
    }
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
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {user?.subscription?.status === 'trial' && <TrialBanner />}
      <div className="flex">
        <Sidebar currentView={currentView} onViewChange={handleViewChange} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            {user?.subscription?.status === 'trial' && currentView === 'overview' && (
              <TrialDashboard />
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
        />
      )}

      {showStatusModal && selectedPlatform && (
        <PostStatusModal
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedPlatform(null);
          }}
          platforms={[selectedPlatform]}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
