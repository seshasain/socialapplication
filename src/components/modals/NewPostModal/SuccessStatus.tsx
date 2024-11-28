import React from 'react';
import { Check } from 'lucide-react';

interface SuccessStatusProps {
  postSuccess: { [key: string]: boolean };
}

export default function SuccessStatus({ postSuccess }: SuccessStatusProps) {
  if (Object.keys(postSuccess).length === 0) return null;

  return (
    <div className="mb-6 p-3 bg-green-100 border border-green-200 text-green-800 rounded-lg">
      <h3 className="font-semibold mb-2">Post Status:</h3>
      <ul className="space-y-1">
        {Object.entries(postSuccess).map(([platform, success]) => (
          <li key={platform} className="flex items-center">
            <Check className="w-4 h-4 mr-2 text-green-600" />
            {platform}: Successfully posted
          </li>
        ))}
      </ul>
    </div>
  );
}