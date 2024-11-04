import React, { useState } from 'react';
import { Calendar, BarChart2, Users2, Settings, Plus, Layout } from 'lucide-react';
import Sidebar from './dashboard/Sidebar';
import CalendarView from './dashboard/CalendarView';
import Analytics from './dashboard/Analytics';
import TeamView from './dashboard/TeamView';
import SettingsView from './dashboard/SettingsView';
import Overview from './dashboard/Overview';
import HistoryView from './dashboard/HistoryView';

type View = 'overview' | 'calendar' | 'analytics' | 'team' | 'settings' | 'history';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('overview');
  const [showNewPostModal, setShowNewPostModal] = useState(false);

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
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button
              onClick={() => setShowNewPostModal(true)}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Post
            </button>
          </div>

          {currentView === 'overview' && <Overview />}
          {currentView === 'history' && <HistoryView />}
          {currentView === 'calendar' && <CalendarView />}
          {currentView === 'analytics' && <Analytics />}
          {currentView === 'team' && <TeamView />}
          {currentView === 'settings' && <SettingsView />}
          
        </div>
      </main>
    </div>
  );
}