import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';
import NewPostModal from '../modals/NewPostModal';

interface ScheduledPost {
  id: string;
  title: string;
  date: string;
  platform: string;
  color: string;
  caption: string;
  scheduledDate: string;
  scheduledTime: string;
  hashtags: string;
  visibility: string;
}

export default function CalendarView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

  const platformIcons = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin
  };

  const platformColors = {
    instagram: 'bg-pink-100 border-pink-200 text-pink-800',
    facebook: 'bg-blue-100 border-blue-200 text-blue-800',
    twitter: 'bg-sky-100 border-sky-200 text-sky-800',
    linkedin: 'bg-blue-100 border-blue-200 text-blue-800'
  };

  const handleSavePost = (postData: any) => {
    if (selectedPost) {
      setScheduledPosts(posts => posts.map(post => 
        post.id === selectedPost.id 
          ? {
              ...post,
              title: postData.caption.substring(0, 20) + '...',
              caption: postData.caption,
              date: `${postData.scheduledDate}T${postData.scheduledTime}`,
              scheduledDate: postData.scheduledDate,
              scheduledTime: postData.scheduledTime,
              platform: postData.platform,
              hashtags: postData.hashtags,
              visibility: postData.visibility
            }
          : post
      ));
    } else {
      const newPost: ScheduledPost = {
        id: Date.now().toString(),
        title: postData.caption.substring(0, 20) + '...',
        caption: postData.caption,
        date: `${postData.scheduledDate}T${postData.scheduledTime}`,
        scheduledDate: postData.scheduledDate,
        scheduledTime: postData.scheduledTime,
        platform: postData.platform,
        color: platformColors[postData.platform as keyof typeof platformColors],
        hashtags: postData.hashtags,
        visibility: postData.visibility
      };
      setScheduledPosts([...scheduledPosts, newPost]);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const handleEditPost = (post: ScheduledPost) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOfMonth = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const getPostsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.date);
      return postDate.getDate() === day && 
             postDate.getMonth() === date.getMonth() &&
             postDate.getFullYear() === date.getFullYear();
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const changeMonth = (increment: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + increment);
      return newDate;
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Schedule Post
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
          {Array.from({ length: 42 }, (_, i) => {
            const day = i - firstDayOfMonth + 1;
            const isValidDay = day > 0 && day <= daysInMonth;
            const postsForDay = isValidDay ? getPostsForDay(day) : [];
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={i}
                className={`min-h-[120px] p-2 border-r border-gray-200 last:border-r-0 ${
                  isValidDay ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className={`flex justify-center items-center w-8 h-8 mb-1 mx-auto rounded-full ${
                  isCurrentDay ? 'bg-blue-600 text-white' : 'text-gray-700'
                } ${isValidDay ? 'font-medium' : 'text-gray-400'}`}>
                  {isValidDay ? day : ''}
                </div>
                <div className="space-y-1">
                  {postsForDay.map(post => {
                    const PlatformIcon = platformIcons[post.platform as keyof typeof platformIcons];
                    return (
                      <button
                        key={post.id}
                        onClick={() => handleEditPost(post)}
                        className={`w-full flex items-center p-2 text-xs rounded-lg border ${post.color} hover:shadow-md transition-all duration-200 group`}
                      >
                        {PlatformIcon && <PlatformIcon className="w-3 h-3 mr-1 shrink-0" />}
                        <span className="truncate">{post.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <NewPostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePost}
        initialData={selectedPost}
      />
    </div>
  );
}