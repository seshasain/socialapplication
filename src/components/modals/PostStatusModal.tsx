import React from 'react';
import { 
  X, 
  Check, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Info,
  ChevronRight
} from 'lucide-react';

interface Platform {
  id: string;
  platform: string;
  status: 'published' | 'scheduled' | 'failed' | 'processing';
  error?: string;
  publishedAt?: string;
  scheduledFor?: string;
}

interface PostStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  platforms: Platform[];
  onRetry?: (platformId: string) => void;
  scheduledDate?: string;
}

export default function PostStatusModal({ 
  isOpen, 
  onClose, 
  platforms,
  onRetry,
  scheduledDate 
}: PostStatusModalProps) {
  if (!isOpen) return null;

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'twitter':
        return <Twitter className="w-5 h-5 text-sky-500" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5 text-blue-700" />;
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusConfig = (status: Platform['status']) => {
    switch (status) {
      case 'published':
        return {
          icon: Check,
          iconColor: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          label: 'Published'
        };
      case 'scheduled':
        return {
          icon: Clock,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          label: 'Scheduled'
        };
      case 'failed':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          label: 'Failed'
        };
      case 'processing':
        return {
          icon: RefreshCw,
          iconColor: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          label: 'Processing'
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          label: 'Unknown'
        };
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const allSuccessful = platforms.every(p => p.status === 'published' || p.status === 'scheduled');
  const anyFailed = platforms.some(p => p.status === 'failed');
  const anyProcessing = platforms.some(p => p.status === 'processing');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Post Status</h2>
              <p className="text-sm text-gray-500 mt-1">
                {allSuccessful 
                  ? 'Your post has been successfully processed'
                  : anyFailed
                  ? 'There were some issues with your post'
                  : anyProcessing
                  ? 'Your post is being processed'
                  : 'Status of your post across platforms'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Status Summary */}
          <div className="space-y-4">
            {platforms.map((platform) => {
              const status = getStatusConfig(platform.status);
              const StatusIcon = status.icon;

              return (
                <div
                  key={platform.id}
                  className={`relative p-4 rounded-lg border ${status.borderColor} ${status.bgColor} overflow-hidden group transition-all duration-200`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {getPlatformIcon(platform.platform)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {platform.platform}
                        </h3>
                        <div className="flex items-center mt-1">
                          <StatusIcon className={`w-4 h-4 ${status.iconColor} ${
                            platform.status === 'processing' ? 'animate-spin' : ''
                          }`} />
                          <span className={`ml-1.5 text-sm ${status.textColor}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {platform.status === 'failed' && onRetry && (
                      <button
                        onClick={() => onRetry(platform.id)}
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        Retry
                      </button>
                    )}
                  </div>

                  {/* Status Details */}
                  {(platform.error || platform.publishedAt || platform.scheduledFor || scheduledDate) && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      {platform.error && (
                        <p className="text-sm text-red-600 flex items-start">
                          <AlertTriangle className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" />
                          {platform.error}
                        </p>
                      )}
                      {platform.publishedAt && (
                        <p className="text-sm text-gray-600">
                          Published at {formatDate(platform.publishedAt)}
                        </p>
                      )}
                      {(platform.scheduledFor || scheduledDate) && (
                        <p className="text-sm text-gray-600">
                          Scheduled for {formatDate(platform.scheduledFor || scheduledDate)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Hover effect */}
                  <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-transparent via-white/25 to-transparent transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}