import React from 'react';
import { Plus, Instagram, Facebook } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  platform: string;
  scheduledDate: string;
}

interface UpcomingPostsProps {
  posts: Post[];
  onNewPost: () => void;
}

export default function UpcomingPosts({ posts, onNewPost }: UpcomingPostsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Upcoming Posts</h2>
          <button
            onClick={onNewPost}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Post
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-gray-500">
              No upcoming posts scheduled
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="flex bg-gray-50 rounded-xl overflow-hidden">
                <div className="p-4 flex-1">
                  <div className="flex items-center mb-2">
                    {post.platform === "instagram" ? (
                      <Instagram className="h-5 w-5 text-pink-600 mr-2" />
                    ) : (
                      <Facebook className="h-5 w-5 text-blue-600 mr-2" />
                    )}
                    <span className="text-sm font-medium text-gray-600">{post.platform}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(post.scheduledDate).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}