import React from 'react';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin,
  Link,
  AtSign,
  Hash,
  Globe,
  Users,
  Clock,
  Music2,
  Image,
  Video,
  Sticker,
  MessageCircle,
  ThumbsUp,
  Share2
} from 'lucide-react';
import type { PostType } from './index';

interface PlatformSpecificOptionsProps {
  platform: string;
  postType: PostType;
  data: any;
  onChange: (data: any) => void;
}

export default function PlatformSpecificOptions({
  platform,
  postType,
  data = {},
  onChange
}: PlatformSpecificOptionsProps) {
  const renderInstagramOptions = () => {
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
              <div className="grid grid-cols <boltAction type="file" filePath="src/components/modals/NewPostModal/PlatformSpecificOptions.tsx">

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
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={data.hideFromProfile}
                    onChange={(e) => onChange({ ...data, hideFromProfile: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Hide from Profile</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={data.turnOffResharing}
                    onChange={(e) => onChange({ ...data, turnOffResharing: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Turn Off Resharing</span>
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
  };

  const renderFacebookOptions = () => {
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
                    checked={data.enableStickers}
                    onChange={(e) => onChange({ ...data, enableStickers: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Enable Stickers</span>
                </label>
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
                    checked={data.enableMusic}
                    onChange={(e) => onChange({ ...data, enableMusic: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Add Music</span>
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
  };

  const renderTwitterOptions = () => {
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
  };

  const renderLinkedinOptions = () => {
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
  };

  const renderPlatformIcon = () => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-600" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'twitter':
        return <Twitter className="w-5 h-5 text-sky-500" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5 text-blue-700" />;
      default:
        return null;
    }
  };

  const renderOptions = () => {
    switch (platform) {
      case 'instagram':
        return renderInstagramOptions();
      case 'facebook':
        return renderFacebookOptions();
      case 'twitter':
        return renderTwitterOptions();
      case 'linkedin':
        return renderLinkedinOptions();
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        {renderPlatformIcon()}
        <h3 className="text-lg font-medium text-gray-900">
          {platform.charAt(0).toUpperCase() + platform.slice(1)} Options
        </h3>
      </div>
      {renderOptions()}
    </div>
  );
}