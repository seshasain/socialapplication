import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TrialCountdownProps {
  endDate: Date;
  onExpire?: () => void;
}

export default function TrialCountdown({ endDate, onExpire }: TrialCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        onExpire?.();
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.days === 0 && 
          newTimeLeft.hours === 0 && 
          newTimeLeft.minutes === 0 && 
          newTimeLeft.seconds === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpire]);

  const isNearingEnd = timeLeft.days === 0 && timeLeft.hours < 24;

  return (
    <div className={`rounded-lg p-4 ${
      isNearingEnd ? 'bg-red-50' : 'bg-blue-50'
    }`}>
      <div className="flex items-center space-x-2 mb-3">
        <Clock className={`w-5 h-5 ${
          isNearingEnd ? 'text-red-500' : 'text-blue-500'
        }`} />
        <span className={`font-medium ${
          isNearingEnd ? 'text-red-700' : 'text-blue-700'
        }`}>
          Trial Expires In:
        </span>
      </div>
      
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-white rounded-lg p-2">
          <div className="text-2xl font-bold">{timeLeft.days}</div>
          <div className="text-xs text-gray-500">Days</div>
        </div>
        <div className="bg-white rounded-lg p-2">
          <div className="text-2xl font-bold">{timeLeft.hours}</div>
          <div className="text-xs text-gray-500">Hours</div>
        </div>
        <div className="bg-white rounded-lg p-2">
          <div className="text-2xl font-bold">{timeLeft.minutes}</div>
          <div className="text-xs text-gray-500">Minutes</div>
        </div>
        <div className="bg-white rounded-lg p-2">
          <div className="text-2xl font-bold">{timeLeft.seconds}</div>
          <div className="text-xs text-gray-500">Seconds</div>
        </div>
      </div>

      {isNearingEnd && (
        <div className="mt-3 text-sm text-red-600 font-medium text-center">
          Your trial is ending soon! Upgrade now to keep your access.
        </div>
      )}
    </div>
  );
} 