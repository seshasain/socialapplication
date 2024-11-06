import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Calendar,
  List,
  Grid,
  Filter,
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
import NewPostModal from '../modals/NewPostModal';
import type { Post, PostPlatform } from '../../types/posts';
import { SocialAccount } from '../../types/overview';

interface CalendarPost extends Post {
  title: string;
  start: string;
  end?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    platform: string;
    status: string;
    color: string;
    caption: string;
  };
}

interface RetryModalProps {
  post: Post;
  onClose: () => void;
  onRetry: () => Promise<void>;
}
const RetryModal: React.FC<RetryModalProps> = ({ post, onClose, onRetry }) => {
  const [loading, setLoading] = useState(false);

  const getPlatformStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRetry = async () => {
    try {
      setLoading(true);
      await onRetry();
      onClose();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Retry Failed Post</h3>
            <p className="mt-1 text-sm text-gray-500">
              Would you like to retry publishing this post on failed platforms?
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">{post.caption}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {post.platforms.map((platform) => (
              <span
                key={platform.id}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPlatformStatusColor(platform.status)}`}
              >
                {platform.platform} - {platform.status}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleRetry}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Retry Failed Posts
          </button>
        </div>
      </div>
    </div>
  );
};
export default function CalendarView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'listWeek'>('dayGridMonth');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);
  const [calendarKey, setCalendarKey] = useState(0);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [retryPost, setRetryPost] = useState<Post | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getPostStatus = (platforms: PostPlatform[]) => {
    if (!platforms || platforms.length === 0) return 'draft';
    const statuses = platforms.map((p) => p.status);
    if (statuses.every((status) => status === 'published')) return 'published';
    if (statuses.some((status) => status === 'failed')) return 'failed';
    if (statuses.some((status) => status === 'publishing')) return 'publishing';
    if (statuses.every((status) => status === 'scheduled')) return 'scheduled';
    return 'draft';
  };

  const getPostColor = (platforms: PostPlatform[]) => {
    const statuses = platforms.map(p => p.status);
    
    if (statuses.every(status => status === 'published')) {
      return { bg: '#10B981', border: '#059669' }; // Green for all success
    }
    if (statuses.every(status => status === 'failed')) {
      return { bg: '#EF4444', border: '#DC2626' }; // Red for all failed
    }
    if (statuses.some(status => status === 'failed')) {
      return { bg: '#F97316', border: '#EA580C' }; // Orange for partial failure
    }
    return { bg: '#60A5FA', border: '#3B82F6' }; // Blue for scheduled/default
  };

  const renderEventContent = (eventInfo: any) => {
    const time = new Date(eventInfo.event.start).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
    
    return (
      <div className="flex items-center gap-1 px-1 py-0.5 w-full overflow-hidden text-white text-xs">
        <span className="whitespace-nowrap">{time}</span>
        <span className="truncate">{eventInfo.event.extendedProps.caption}</span>
      </div>
    );
  };

  const fetchConnectedAccounts = async () => {
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
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error('Error fetching social accounts:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('http://localhost:5000/api/posts/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data: Post[] = await response.json();
      const filteredData = filter === 'all' 
        ? data 
        : data.filter(post => 
            post.platforms.some(p => p.platform.toLowerCase() === filter)
          );

      const searchedData = searchQuery
        ? filteredData.filter(post =>
            post.caption.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : filteredData;

      const calendarPosts: CalendarPost[] = searchedData.map((post) => {
        const colors = getPostColor(post.platforms);
        
        return {
          ...post,
          title: post.caption,
          start: post.scheduledDate,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: '#FFFFFF',
          extendedProps: {
            platform: post.platforms[0]?.platform.toLowerCase() || 'default',
            status: getPostStatus(post.platforms),
            color: colors.bg,
            caption: post.caption
          },
          display: 'block',
          classNames: ['calendar-event']
        };
      });

      setPosts(calendarPosts);
      setError(null);
      setCalendarKey(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchConnectedAccounts();
  }, [filter, searchQuery]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleDateClick = (arg: { date: Date }) => {
    setSelectedDate(arg.date);
    setSelectedPost(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (arg: { event: any }) => {
    const post = posts.find((p) => p.id === arg.event.id);
    if (post) {
      const status = getPostStatus(post.platforms);
      if (status === 'failed') {
        setRetryPost(post);
        setShowRetryModal(true);
        return;
      }
      if (status === 'published') {
        setError('Published posts cannot be edited.');
        return;
      }
      setSelectedPost(post);
      setSelectedDate(new Date(post.scheduledDate));
      setIsModalOpen(true);
    }
  };

  const handleRetryPost = async (postId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(
        `http://localhost:5000/api/posts/retry/${postId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to retry post');
      }

      setSuccessMessage('Post retry initiated successfully');
      await fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry post');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <Check className="w-5 h-5 mr-2" />
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('dayGridMonth')}
                className={`p-2 rounded-lg transition-all ${
                  view === 'dayGridMonth' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('timeGridWeek')}
                className={`p-2 rounded-lg transition-all ${
                  view === 'timeGridWeek' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('listWeek')}
                className={`p-2 rounded-lg transition-all ${
                  view === 'listWeek' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none bg-gray-100 border-0 rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Platforms</option>
                {connectedAccounts.map((account) => (
                  <option key={account.id} value={account.platform?.toLowerCase()}>
                    {account.platform}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            <button
              onClick={fetchPosts}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => {
                setSelectedDate(new Date());
                setSelectedPost(null);
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Post
            </button>
          </div>
        </div>

        <style>
          {`
            .calendar-event {
              margin: 1px 0;
              padding: 0 2px;
              border-radius: 4px;
            }
            .fc-daygrid-event-harness {
              margin-top: 1px !important;
              margin-bottom: 1px !important;
            }
            .fc-daygrid-day-events {
              padding: 2px !important;
            }
          `}
        </style>

        <FullCalendar
          key={calendarKey}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={view}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          events={posts}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          height="auto"
          aspectRatio={1.8}
          editable={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          nowIndicator={true}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          views={{
            timeGridWeek: {
              titleFormat: { year: 'numeric', month: 'short', day: '2-digit' },
              dayHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true },
            },
            dayGridMonth: {
              titleFormat: { year: 'numeric', month: 'long' },
              dayHeaderFormat: { weekday: 'short' },
            },
            listWeek: {
              titleFormat: { year: 'numeric', month: 'short', day: '2-digit' },
              dayHeaderFormat: { weekday: 'long', month: 'short', day: 'numeric' },
            },
          }}
        />
      </div>

      {isModalOpen && (
        <NewPostModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPost(null);
            setSelectedDate(null);
          }}
          onSave={async () => {
            await fetchPosts();
            setIsModalOpen(false);
            setSelectedPost(null);
            setSelectedDate(null);
          }}
          initialData={selectedPost || undefined}
          defaultDate={selectedDate || undefined}
          connectedAccounts={connectedAccounts}
        />
      )}

      {showRetryModal && retryPost && (
        <RetryModal
          post={retryPost}
          onClose={() => {
            setShowRetryModal(false);
            setRetryPost(null);
          }}
          onRetry={async () => {
            await handleRetryPost(retryPost.id);
            setShowRetryModal(false);
            setRetryPost(null);
          }}
        />
      )}
    </div>
  );
}