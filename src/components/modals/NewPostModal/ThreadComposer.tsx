import React, { useState } from 'react';
import { Plus, Minus, AlertCircle, MessageCircle, Image as ImageIcon, X } from 'lucide-react';
import MediaUploader from '../../media/MediaUploader';
import type { MediaFile } from '../../../types/media';

interface ThreadPost {
  id: string;
  content: string;
  charCount: number;
  media: MediaFile[];
}

interface ThreadComposerProps {
  value: string[];
  onChange: (threads: string[]) => void;
  maxThreads?: number;
  onMediaUpload: (files: File[]) => Promise<void>;
  onMediaRemove: (file: MediaFile) => void;
  uploadedFiles: Record<string, MediaFile[]>;
  uploadError?: string | null;
}

export default function ThreadComposer({ 
  value, 
  onChange, 
  maxThreads = 25,
  onMediaUpload,
  onMediaRemove,
  uploadedFiles = {},
  uploadError
}: ThreadComposerProps) {
  const MAX_CHARS_PER_TWEET = 280;
  const MAX_MEDIA_PER_TWEET = 4;
  
  const [threads, setThreads] = useState<ThreadPost[]>(
    value.map((content, index) => ({
      id: `thread-${index}`,
      content,
      charCount: content.length,
      media: uploadedFiles[`thread-${index}`] || []
    }))
  );

  const addThread = () => {
    if (threads.length >= maxThreads) return;
    
    const newThread: ThreadPost = {
      id: `thread-${Date.now()}`,
      content: '',
      charCount: 0,
      media: []
    };
    
    const updatedThreads = [...threads, newThread];
    setThreads(updatedThreads);
    onChange(updatedThreads.map(t => t.content));
  };

  const removeThread = (index: number) => {
    if (threads.length <= 1) return;
    
    const updatedThreads = threads.filter((_, i) => i !== index);
    setThreads(updatedThreads);
    onChange(updatedThreads.map(t => t.content));
  };

  const updateThread = (index: number, content: string) => {
    const updatedThreads = threads.map((thread, i) => {
      if (i === index) {
        return {
          ...thread,
          content,
          charCount: content.length
        };
      }
      return thread;
    });
    
    setThreads(updatedThreads);
    onChange(updatedThreads.map(t => t.content));
  };

  const handleMediaUpload = async (threadId: string, files: File[]) => {
    await onMediaUpload(files);
  };

  const handleMediaRemove = (threadId: string, file: MediaFile) => {
    onMediaRemove(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">Thread Composer</h3>
        </div>
        <span className="text-sm text-gray-500">
          {threads.length} of {maxThreads} tweets
        </span>
      </div>

      <div className="space-y-4">
        {threads.map((thread, index) => {
          const threadMedia = uploadedFiles[thread.id] || [];
          
          return (
            <div
              key={thread.id}
              className="relative bg-white rounded-xl border border-gray-200 p-4 transition-all duration-200 hover:border-blue-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-500">Tweet</span>
                </div>
                <button
                  onClick={() => removeThread(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={threads.length === 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={thread.content}
                onChange={(e) => updateThread(index, e.target.value)}
                placeholder={index === 0 ? "Start your thread..." : "Continue your thread..."}
                className="w-full h-24 p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />

              {/* Media Section */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Media</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {threadMedia.length} of {MAX_MEDIA_PER_TWEET}
                  </span>
                </div>

                {threadMedia.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {threadMedia.map((file) => (
                      <div
                        key={file.id}
                        className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img
                          src={file.url}
                          alt={file.filename}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleMediaRemove(thread.id, file)}
                          className="absolute top-0.5 right-0.5 p-1 bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <MediaUploader
                  onUpload={(files) => handleMediaUpload(thread.id, files)}
                  onRemove={(file) => handleMediaRemove(thread.id, file)}
                  existingFiles={threadMedia}
                  maxFiles={MAX_MEDIA_PER_TWEET}
                  error={uploadError}
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  {thread.charCount > MAX_CHARS_PER_TWEET && (
                    <div className="flex items-center text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Exceeds limit
                    </div>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    thread.charCount > MAX_CHARS_PER_TWEET
                      ? 'text-red-500'
                      : thread.charCount > MAX_CHARS_PER_TWEET * 0.8
                      ? 'text-yellow-500'
                      : 'text-gray-500'
                  }`}
                >
                  {thread.charCount}/{MAX_CHARS_PER_TWEET}
                </span>
              </div>

              {index < threads.length - 1 && (
                <div className="absolute left-7 -bottom-4 w-0.5 h-4 bg-gray-200" />
              )}
            </div>
          );
        })}
      </div>

      {threads.length < maxThreads && (
        <button
          onClick={addThread}
          className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Tweet
        </button>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Thread Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Each tweet can contain up to 280 characters</li>
          <li>• Add up to 4 images or 1 video per tweet</li>
          <li>• You can add up to {maxThreads} tweets in a thread</li>
          <li>• Use numbers to keep track of your thread order</li>
          <li>• Make sure each tweet can stand on its own</li>
        </ul>
      </div>
    </div>
  );
}