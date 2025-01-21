import React, { useRef, useEffect } from 'react';
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
  const dateTimeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!publishNow && dateTimeRef.current) {
      dateTimeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [publishNow]);

  return (
    <div className="flex flex-col space-y-6">
      <h3 className="text-sm font-medium text-gray-700">When would you like to publish?</h3>
      
      <div className="inline-flex rounded-lg p-1 bg-gray-50 border border-gray-200">
        {/* Publish Now Option */}
        <button
          type="button"
          onClick={() => setPublishNow(true)}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-all ${
            publishNow
              ? 'bg-white shadow-sm border border-gray-200 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Zap size={18} className="mr-2" />
          <span className="font-medium">Publish Now</span>
        </button>

        {/* Schedule Post Option */}
        <button
          type="button"
          onClick={() => setPublishNow(false)}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-all ${
            !publishNow
              ? 'bg-white shadow-sm border border-gray-200 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock size={18} className="mr-2" />
          <span className="font-medium">Schedule Post</span>
        </button>
      </div>

      {/* Date Time Selector */}
      {!publishNow && (
        <div 
          ref={dateTimeRef}
          className="animate-slideDown"
        >
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700">Select date and time for your post</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={onDateChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={onTimeChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}