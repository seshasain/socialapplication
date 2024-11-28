import React from 'react';
import { Clock, Zap } from 'lucide-react';

interface SchedulingOptionsProps {
  publishNow: boolean;
  setPublishNow: (value: boolean) => void;
  scheduledDate: string;
  scheduledTime: string;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SchedulingOptions({
  publishNow,
  setPublishNow,
  scheduledDate,
  scheduledTime,
  onDateChange,
  onTimeChange,
}: SchedulingOptionsProps) {
  return (
    <div>
      <div className="flex items-center space-x-4 mb-4">
        <button
          type="button"
          onClick={() => setPublishNow(false)}
          className={`flex items-center px-4 py-2 rounded-lg ${
            !publishNow
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } transition-colors`}
        >
          <Clock className="w-4 h-4 mr-2" />
          Schedule Post
        </button>
        <button
          type="button"
          onClick={() => setPublishNow(true)}
          className={`flex items-center px-4 py-2 rounded-lg ${
            publishNow
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } transition-colors`}
        >
          <Zap className="w-4 h-4 mr-2" />
          Publish Now
        </button>
      </div>

      {!publishNow && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={onDateChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={onTimeChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      )}
    </div>
  );
}