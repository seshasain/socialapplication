import React, { useState } from 'react';
import {
  Layout,
  Calendar,
  BarChart2,
  Users2,
  Settings,
  Crown,
  History,
} from 'lucide-react';
import PricingModal from '../modals/PricingModal';

type View = 'overview' | 'calendar' | 'analytics' | 'team' | 'settings' | 'history';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const menuItems = [
    { icon: Layout, label: 'Overview', value: 'overview' as View },
    { icon: History, label: 'History', value: 'history' as View },
    { icon: Calendar, label: 'Calendar', value: 'calendar' as View },
    { icon: BarChart2, label: 'Analytics', value: 'analytics' as View },
    { icon: Users2, label: 'Team', value: 'team' as View },
    { icon: Settings, label: 'Settings', value: 'settings' as View },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col min-h-screen">
      <div className="p-6">
        <div className="flex items-center mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 text-xl font-bold text-gray-900">
            SocialSync
          </span>
        </div>
        <nav className="space-y-2">
          {menuItems.map(({ icon: Icon, label, value }) => (
            <button
              key={value}
              onClick={() => onViewChange(value)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                currentView === value
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center mb-3">
            <Crown className="h-5 w-5 mr-2" />
            <span className="font-semibold">Free Plan</span>
          </div>
          <p className="text-sm text-blue-100 mb-3">
            Upgrade to Pro for advanced features
          </p>
          <button
            onClick={() => setIsPricingModalOpen(true)}
            className="block w-full bg-white text-blue-600 text-center py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Upgrade Plan
          </button>
        </div>
      </div>

      <PricingModal 
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </div>
  );
}