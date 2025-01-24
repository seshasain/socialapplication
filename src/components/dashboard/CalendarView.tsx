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
import type { Post, PostPlatform, SocialAccount } from '../../types';
import { posts, socialAccounts } from '../../utils/api';
import PostStatusModal from '../modals/PostStatusModal';
import { API_ROUTES } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { TRIAL_LIMITS } from '../../types/trial';

interface CalendarPost extends Omit<Post, 'scheduledDate'> {
  title: string;
  start: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    platform: string;
    status: string;
    color: string;
    caption: string;
  };
  display: string;
  classNames: string[];
}

interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledDate: Date;
  status: 'scheduled' | 'processing' | 'published' | 'failed';
}

export default function CalendarView() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [retryPost, setRetryPost] = useState<Post | null>(null);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [calendarKey, setCalendarKey] = useState(0);
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'listWeek'>('dayGridMonth');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);
  const [calendarPosts, setCalendarPosts] = useState<CalendarPost[]>([]);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [scheduledPosts, setScheduledPosts] = React.useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const isTrialUser = user?.subscription?.status === 'trial';
  const scheduledPostCount = scheduledPosts.length;
  const isPostLimitReached = isTrialUser && scheduledPostCount >= TRIAL_LIMITS.maxScheduledPosts;

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const getPostStatus = (platforms: PostPlatform[]) => {
    if (!platforms || platforms.length === 0) return 'draft';
    const statuses = platforms.map((p) => p.status);
    if (statuses.every((status) => status === 'published')) return 'published';
    if (statuses.some((status) => status === 'failed')) return 'failed';
    if (statuses.some((status) => status === 'processing')) return 'processing';
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

  const customButtons = {
    prev: {
      text: 'Prev',
      click: () => {
        const calendarApi = calendarRef.current?.getApi();
        calendarApi?.prev();
      }
    },
    next: {
      text: 'Next',
      click: () => {
        const calendarApi = calendarRef.current?.getApi();
        calendarApi?.next();
      }
    },
    today: {
      text: 'Today',
      click: () => {
        const calendarApi = calendarRef.current?.getApi();
        calendarApi?.today();
      }
    }
  };

  const calendarRef = React.useRef<any>(null);

  const renderEventContent = (eventInfo: any) => {
    const platform = eventInfo.event.extendedProps.platform;
    const status = eventInfo.event.extendedProps.status;
    
    return (
      <div className="flex items-center gap-2 px-2 py-1 w-full overflow-hidden">
        {platform === 'instagram' && <Instagram className="w-4 h-4 flex-shrink-0" />}
        {platform === 'facebook' && <Facebook className="w-4 h-4 flex-shrink-0" />}
        {platform === 'twitter' && <Twitter className="w-4 h-4 flex-shrink-0" />}
        {platform === 'linkedin' && <Linkedin className="w-4 h-4 flex-shrink-0" />}
        <div className="flex flex-col overflow-hidden">
          <span className="text-xs font-medium truncate">{eventInfo.event.extendedProps.caption}</span>
          <span className="text-[10px] opacity-75">
            {new Date(eventInfo.event.start).toLocaleTimeString([], { 
              hour: 'numeric',
              minute: '2-digit'
            })}
          </span>
        </div>
        {status === 'failed' && (
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
        )}
      </div>
    );
  };

  const fetchConnectedAccounts = async () => {
    try {
      const response = await socialAccounts.list();
      setConnectedAccounts(response.data);
    } catch (error) {
      console.error('Error fetching social accounts:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      const response = await posts.scheduled();
      const data: Post[] = response.data;
      
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

      const calendarPosts: CalendarPost[] = searchedData.map((post) => ({
        ...post,
        title: post.caption.substring(0, 30) + (post.caption.length > 30 ? '...' : ''),
        start: post.scheduledDate || post.createdAt,
        backgroundColor: getPostColor(post.platforms).bg,
        borderColor: getPostColor(post.platforms).border,
        textColor: '#ffffff',
        extendedProps: {
          platform: post.platforms[0]?.platform || 'unknown',
          status: getPostStatus(post.platforms),
          color: getPostColor(post.platforms).bg,
          caption: post.caption
        },
        display: 'block',
        classNames: ['cursor-pointer', 'hover:opacity-90']
      }));

      setCalendarPosts(calendarPosts);
      setError(null);
      setCalendarKey(prev => prev + 1);
    } catch (err) {
      console.error('Error fetching posts:', err);
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

  const handleEventClick = async (info: any) => {
    const postId = info.event.id;
    try {
      const response = await posts.get(postId);
      const foundPost = response.data;
      if (foundPost) {
        setSelectedPost(foundPost);
        setSelectedDate(new Date(foundPost.scheduledDate || foundPost.createdAt));
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post details');
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

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const getDayPosts = (day: number) => {
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduledDate);
      return (
        postDate.getDate() === day &&
        postDate.getMonth() === currentDate.getMonth() &&
        postDate.getFullYear() === currentDate.getFullYear()
      );
    });
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center">
          <Check className="w-5 h-5 mr-2" />
          {successMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
        <button
          disabled={isPostLimitReached}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Post
        </button>
      </div>

      {isTrialUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          <p className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Trial accounts are limited to {TRIAL_LIMITS.maxScheduledPosts} scheduled posts
            ({scheduledPostCount} used)
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setView('dayGridMonth')}
                  className={`p-2 rounded-lg transition-all ${
                    view === 'dayGridMonth' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setView('timeGridWeek')}
                  className={`p-2 rounded-lg transition-all ${
                    view === 'timeGridWeek' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setView('listWeek')}
                  className={`p-2 rounded-lg transition-all ${
                    view === 'listWeek' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none bg-gray-100 border-0 rounded-xl pl-3 pr-8 py-2 focus:ring-2 focus:ring-blue-500"
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
                  className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setSelectedPost(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Post
              </button>
            </div>
          </div>

          <style>
            {`
              .fc {
                --fc-border-color: #e5e7eb;
                --fc-today-bg-color: #eff6ff;
                --fc-neutral-bg-color: #ffffff;
                --fc-list-event-hover-bg-color: #f3f4f6;
                --fc-theme-standard-border-radius: 0.75rem;
                --fc-button-bg-color: #ffffff;
                --fc-button-border-color: #e5e7eb;
                --fc-button-hover-bg-color: #f3f4f6;
                --fc-button-hover-border-color: #d1d5db;
                --fc-button-active-bg-color: #2563eb;
                --fc-button-active-border-color: #2563eb;
              }
              
              .fc .fc-toolbar {
                padding: 1rem;
                background: #f9fafb;
                border-radius: 0.75rem;
                margin-bottom: 1rem !important;
              }

              .fc .fc-toolbar-title {
                font-size: 1.25rem;
                font-weight: 600;
              }

              .fc .fc-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
                font-weight: 500;
                border-radius: 0.5rem;
                border: 1px solid var(--fc-button-border-color);
                background: var(--fc-button-bg-color);
                color: #374151;
                transition: all 0.2s;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                min-width: 32px;
                height: 32px;
              }

              .fc .fc-button:hover {
                background: var(--fc-button-hover-bg-color);
                border-color: var(--fc-button-hover-border-color);
                color: #111827;
              }

              .fc .fc-button:focus {
                outline: none;
                ring: 2px;
                ring-offset: 2px;
                ring-blue-500;
              }

              .fc .fc-button-primary:not(:disabled).fc-button-active,
              .fc .fc-button-primary:not(:disabled):active {
                background: var(--fc-button-active-bg-color);
                border-color: var(--fc-button-active-border-color);
                color: #ffffff;
              }

              .fc .fc-prev-button,
              .fc .fc-next-button {
                padding: 0.5rem;
                background: #ffffff;
              }

              .fc .fc-today-button {
                font-weight: 500;
              }

              .fc .fc-today-button:disabled {
                opacity: 0.7;
                background: #f3f4f6;
              }

              .fc .fc-toolbar-chunk {
                display: flex;
                align-items: center;
                gap: 0.5rem;
              }

              .fc-event {
                border-radius: 0.375rem;
                border: none;
                padding: 2px;
                margin: 1px 0;
              }

              .fc-daygrid-event {
                white-space: normal;
              }

              .fc td, .fc th {
                border: 1px solid #e5e7eb;
              }

              .fc-day-today {
                background: #eff6ff !important;
              }

              .fc-list-event:hover td {
                background: #f3f4f6;
              }

              .fc-list-day-cushion {
                background: #f9fafb !important;
              }
            `}
          </style>

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={view}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            customButtons={customButtons}
            events={calendarPosts}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            height="auto"
            aspectRatio={1.8}
            editable={false}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3}
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
      </div>

      {isModalOpen && (
        <NewPostModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPost(null);
            setSelectedDate(null);
          }}
          onSave={async (post) => {
            await fetchPosts();
            setIsModalOpen(false);
            setSelectedPost(null);
            setSelectedDate(null);
          }}
          onPostSubmit={(statuses) => {
            console.log('Post submission statuses:', statuses);
            fetchPosts();
          }}
          initialData={selectedPost || undefined}
          connectedAccounts={connectedAccounts}
          defaultScheduledDate={selectedDate ?? undefined}
          defaultScheduleEnabled={true}
        />
      )}

      {showRetryModal && retryPost && (
        <PostStatusModal
          isOpen={showRetryModal}
          onClose={() => {
            setShowRetryModal(false);
            setRetryPost(null);
          }}
          platforms={retryPost.platforms.map(p => ({
            ...p,
            publishedAt: p.publishedAt || undefined
          }))}
          onRetry={async () => {
            if (retryPost) {
              await handleRetryPost(retryPost.id);
              setShowRetryModal(false);
              setRetryPost(null);
            }
          }}
          scheduledDate={retryPost.scheduledDate}
        />
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleString('default', {
                month: 'long',
                year: 'numeric'
              })}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}

          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="bg-white p-4 min-h-[120px]" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayPosts = getDayPosts(day);
            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`bg-white p-4 min-h-[120px] ${
                  isToday ? 'bg-blue-50' : ''
                }`}
              >
                <span
                  className={`inline-block w-6 h-6 rounded-full text-center text-sm ${
                    isToday
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {day}
                </span>
                <div className="mt-2 space-y-1">
                  {dayPosts.map((post) => (
                    <div
                      key={post.id}
                      className="text-xs p-1 rounded bg-blue-100 text-blue-700"
                    >
                      {post.content.substring(0, 20)}...
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}