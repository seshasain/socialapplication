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
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('http://localhost:5000/api/social-accounts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch social accounts');
      }

      const accounts = await response.json();
      setSocialAccounts(accounts);
    } catch (error) {
      console.error('Error fetching social accounts:', error);
    }
  };

  const handleNewPost = async (post: Post) => {
    // try {
    //   const token = localStorage.getItem('token');
    //   if (!token) throw new Error('No authentication token');

    //   const response = await fetch('http://localhost:5000/api/posts', {
    //     method: 'POST',
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(post),
    //   });

    //   if (!response.ok) {
    //     throw new Error('Failed to create post');
    //   }

    //   setShowNewPostModal(false);
    //   // Optionally refresh data or show success message
    // } catch (error) {
    //   console.error('Error creating post:', error);
    //   // Handle error (show error message, etc.)
    // }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
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
        onSave={handleNewPost}
        connectedAccounts={socialAccounts}
      />
    </div>
  );
}