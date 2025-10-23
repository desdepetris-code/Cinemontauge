import React from 'react';
import { AppNotification } from '../types';
import { getImageUrl } from '../utils/imageUtils';

const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    
    let interval = seconds / 31536000; // years
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000; // months
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400; // days
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600; // hours
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60; // minutes
    return `${Math.floor(interval)}m ago`;
};

interface NotificationsScreenProps {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ notifications, onMarkAllRead, onMarkOneRead, onSelectShow }) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto px-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-sm font-semibold text-primary-accent hover:underline"
          >
            Mark all as read
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-text-primary">You're all caught up!</h2>
          <p className="mt-2 text-text-secondary">New notifications will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => {
                onMarkOneRead(notification.id);
                onSelectShow(notification.mediaId, notification.mediaType);
              }}
              className={`flex items-start p-3 rounded-lg cursor-pointer transition-colors ${
                notification.read ? 'bg-bg-secondary/50' : 'bg-bg-secondary'
              }`}
            >
              <img
                src={getImageUrl(notification.poster_path, 'w92')}
                alt={notification.title}
                className="w-12 h-auto rounded-md mr-4 flex-shrink-0"
              />
              <div className="flex-grow min-w-0">
                <p className="font-semibold text-text-primary truncate">{notification.title}</p>
                <p className="text-sm text-text-secondary">{notification.description}</p>
                <p className="text-xs text-text-secondary/70 mt-1">{formatTimeAgo(notification.timestamp)}</p>
              </div>
              {!notification.read && (
                <div className="w-2.5 h-2.5 bg-primary-accent rounded-full self-center ml-3 flex-shrink-0"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsScreen;