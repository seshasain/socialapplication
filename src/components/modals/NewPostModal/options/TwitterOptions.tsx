import React from 'react';
import type { PostType } from '../index';

interface TwitterOptionsProps {
  postType: PostType;
  data: any;
  onChange: (data: any) => void;
}

export default function TwitterOptions({ postType, data, onChange }: TwitterOptionsProps) {
  switch (postType) {
    case 'thread':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thread Settings
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.numberedThreads}
                  onChange={(e) => onChange({ ...data, numberedThreads: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Numbered Threads</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.addFollowupPrompt}
                  onChange={(e) => onChange({ ...data, addFollowupPrompt: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Add Follow-up Prompt</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reply Settings
            </label>
            <select
              value={data.replySettings || 'everyone'}
              onChange={(e) => onChange({ ...data, replySettings: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="everyone">Everyone can reply</option>
              <option value="following">People you follow</option>
              <option value="mentioned">Only people you mention</option>
            </select>
          </div>
        </div>
      );

    case 'poll':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll Options
            </label>
            <div className="space-y-2">
              {(data.pollOptions || ['', '']).map((option: string, index: number) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(data.pollOptions || ['', ''])];
                    newOptions[index] = e.target.value;
                    onChange({ ...data, pollOptions: newOptions });
                  }}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              ))}
              {(data.pollOptions || ['', '']).length < 4 && (
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = [...(data.pollOptions || ['', '']), ''];
                    onChange({ ...data, pollOptions: newOptions });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add another option
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll Duration
            </label>
            <select
              value={data.pollDuration || '1d'}
              onChange={(e) => onChange({ ...data, pollDuration: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="1d">1 day</option>
              <option value="3d">3 days</option>
              <option value="7d">7 days</option>
            </select>
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tweet Settings
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.enableReplies}
                  onChange={(e) => onChange({ ...data, enableReplies: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Enable Replies</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.quoteRetweets}
                  onChange={(e) => onChange({ ...data, quoteRetweets: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Allow Quote Retweets</span>
              </label>
            </div>
          </div>
        </div>
      );
  }
}