import React from 'react';
import type { PostType } from '../index';

interface FacebookOptionsProps {
  postType: PostType;
  data: any;
  onChange: (data: any) => void;
}

export default function FacebookOptions({ postType, data, onChange }: FacebookOptionsProps) {
  switch (postType) {
    case 'event':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Details
            </label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Event Name"
                value={data.eventName || ''}
                onChange={(e) => onChange({ ...data, eventName: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={data.startDateTime || ''}
                    onChange={(e) => onChange({ ...data, startDateTime: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={data.endDateTime || ''}
                    onChange={(e) => onChange({ ...data, endDateTime: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Location"
                value={data.location || ''}
                onChange={(e) => onChange({ ...data, location: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <select
                value={data.eventType || 'public'}
                onChange={(e) => onChange({ ...data, eventType: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="public">Public Event</option>
                <option value="private">Private Event</option>
                <option value="online">Online Event</option>
              </select>
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
                  checked={data.enableSharing}
                  onChange={(e) => onChange({ ...data, enableSharing: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Enable Sharing</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audience
            </label>
            <select
              value={data.audience || 'public'}
              onChange={(e) => onChange({ ...data, audience: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="friends-except">Friends except...</option>
              <option value="specific-friends">Specific friends</option>
              <option value="only-me">Only me</option>
            </select>
          </div>
        </div>
      );
  }
}