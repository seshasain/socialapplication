import React from 'react';
import { Music2 } from 'lucide-react';
import type { PostType } from '../index';

interface InstagramOptionsProps {
  postType: PostType;
  data: any;
  onChange: (data: any) => void;
}

export default function InstagramOptions({ postType, data, onChange }: InstagramOptionsProps) {
  switch (postType) {
    case 'story':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Story Features
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.enablePolls}
                  onChange={(e) => onChange({ ...data, enablePolls: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Enable Polls</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.enableQuestions}
                  onChange={(e) => onChange({ ...data, enableQuestions: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Enable Questions</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.enableMusic}
                  onChange={(e) => onChange({ ...data, enableMusic: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Add Music</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.enableLocation}
                  onChange={(e) => onChange({ ...data, enableLocation: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Add Location</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Story Layout
            </label>
            <select
              value={data.layout || 'default'}
              onChange={(e) => onChange({ ...data, layout: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="default">Default</option>
              <option value="fullscreen">Fullscreen</option>
              <option value="split">Split Screen</option>
            </select>
          </div>
        </div>
      );

    case 'reel':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Music Selection
            </label>
            <div className="flex items-center space-x-2">
              <Music2 className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for music..."
                value={data.music || ''}
                onChange={(e) => onChange({ ...data, music: e.target.value })}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reel Settings
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.shareToFeed}
                  onChange={(e) => onChange({ ...data, shareToFeed: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Share to Feed</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.allowRemix}
                  onChange={(e) => onChange({ ...data, allowRemix: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Allow Remixing</span>
              </label>
            </div>
          </div>
        </div>
      );

    case 'carousel':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carousel Settings
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.enableTags}
                  onChange={(e) => onChange({ ...data, enableTags: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Enable Tags</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.enableProducts}
                  onChange={(e) => onChange({ ...data, enableProducts: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Tag Products</span>
              </label>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Settings
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.enableComments}
                  onChange={(e) => onChange({ ...data, enableComments: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Enable Comments</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.enableLikes}
                  onChange={(e) => onChange({ ...data, enableLikes: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Show Like Count</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advanced Options
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Location</label>
                <input
                  type="text"
                  placeholder="Add location..."
                  value={data.location || ''}
                  onChange={(e) => onChange({ ...data, location: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Alt Text</label>
                <input
                  type="text"
                  placeholder="Add alt text for accessibility..."
                  value={data.altText || ''}
                  onChange={(e) => onChange({ ...data, altText: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>
      );
  }
}