import React from 'react';
import type { PostType } from '../index';

interface LinkedInOptionsProps {
  postType: PostType;
  data: any;
  onChange: (data: any) => void;
}

export default function LinkedInOptions({ postType, data, onChange }: LinkedInOptionsProps) {
  switch (postType) {
    case 'article':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Article Settings
            </label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Article Title"
                value={data.articleTitle || ''}
                onChange={(e) => onChange({ ...data, articleTitle: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <input
                type="text"
                placeholder="Subtitle (optional)"
                value={data.subtitle || ''}
                onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <div>
                <label className="text-sm text-gray-600">Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onChange({ ...data, coverImage: file });
                    }
                  }}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
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
                  checked={data.notifyEmployees}
                  onChange={(e) => onChange({ ...data, notifyEmployees: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Notify Employees</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <select
              value={data.visibility || 'anyone'}
              onChange={(e) => onChange({ ...data, visibility: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="anyone">Anyone</option>
              <option value="connections">Connections only</option>
              <option value="group">Specific Group</option>
            </select>
          </div>
        </div>
      );
  }
}