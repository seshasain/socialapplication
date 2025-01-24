import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import Overview from './Overview';
import CalendarView from './CalendarView';
import Analytics from './Analytics';
import TeamView from './context/TeamView';
import SettingsView from './SettingsView';
import HistoryView from './HistoryView';
import NewPostModal from '../modals/NewPostModal';
import PostStatusModal from '../modals/PostStatusModal';
import api from '../../utils/api';
import type { Platform } from '../modals/PostStatusModal';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';

type View = 'overview' | 'calendar' | 'analytics' | 'team' | 'settings' | 'history';

export default function Dashboard() {
  const location = useLocation();
  const initialView = location.pathname === '/settings' ? 'settings' : 'overview';
  const [currentView, setCurrentView] = useState<View>(initialView);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { posts, socialAccounts, refreshData } = useAppState();

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
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 p-8 overflow-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
        {renderView()}
      </main>

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
