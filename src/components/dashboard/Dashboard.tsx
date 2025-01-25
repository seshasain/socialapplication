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
import TrialBanner from '../TrialBanner';
import api from '../../utils/api';
import type { Platform } from '../modals/PostStatusModal';
import Sidebar from './Sidebar';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

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
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />

      <div className="flex-1 flex flex-col">
        {user?.subscription?.status === 'trial' && <TrialBanner />}
        <main className="flex-1 overflow-y-auto">
          <div className="flex justify-between items-center px-8 pt-6 mb-6">
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

          <div className="px-8 pb-8">
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
