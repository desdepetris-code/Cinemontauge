
import React from 'react';
import { AppNotification } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { XMarkIcon, TrashIcon, BellIcon, SparklesIcon, FireIcon, ClockIcon, UserGroupIcon, StarIcon, ChatBubbleLeftRightIcon } from './Icons';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
  onSelectUser: (userId: string) => void;
}

const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    return `${Math.floor(interval)}m ago`;
};

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'new_follower': return <UserGroupIcon className="w-4 h-4 text-sky-400" />;
        case 'list_like': return <StarIcon className="w-4 h-4 text-amber-400" />;
        case 'comment_reply': return <ChatBubbleLeftRightIcon className="w-4 h-4 text-purple-400" />;
        case 'revival': return <FireIcon className="w-4 h-4 text-red-500" />;
        case 'sequel': return <SparklesIcon className="w-4 h-4 text-blue-400" />;
        case 'stale_show': return <ClockIcon className="w-4 h-4 text-amber-500" />;
        default: return <BellIcon className="w-4 h-4 text-primary-accent" />;
    }
};

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, notifications, onMarkAllRead, onMarkOneRead, onDeleteNotification, onSelectShow, onSelectUser }) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-bg-primary rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-lg h-[80vh] flex flex-col overflow-hidden border border-white/10 animate-scale-in" onClick={e => e.stopPropagation()}>
        <header className="p-8 border-b border-white/5 bg-card-gradient flex justify-between items-start flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <BellIcon className="w-6 h-6 text-primary-accent" />
                <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter leading-none">Notifications</h2>
            </div>
            {unreadCount > 0 ? (
              <button onClick={onMarkAllRead} className="text-[10px] font-black text-primary-accent hover:underline uppercase tracking-widest opacity-80">
                Mark {unreadCount} unread as archived
              </button>
            ) : (
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-40">Your registry is up to date</p>
            )}
          </div>
          <button onClick={onClose} className="p-3 rounded-full hover:bg-white/10 text-text-secondary transition-all"><XMarkIcon className="w-6 h-6" /></button>
        </header>

        <div className="flex-grow overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-20">
                <BellIcon className="w-16 h-16 mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">No activity logs found</p>
            </div>
          ) : (
            notifications.map(notification => {
              let onClickAction = () => {};
              if (notification.type === 'new_follower' && notification.followerInfo?.userId) {
                  onClickAction = () => onSelectUser(notification.followerInfo.userId);
              } else if (notification.type === 'list_like' && notification.likerInfo?.userId) {
                  onClickAction = () => onSelectUser(notification.likerInfo.userId);
              } else if (notification.mediaId && notification.mediaType) {
                  onClickAction = () => onSelectShow(notification.mediaId, notification.mediaType);
              }

              const finalOnClick = () => {
                  onMarkOneRead(notification.id);
                  onClickAction();
                  onClose();
              }

              const handleDelete = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDeleteNotification(notification.id);
              };

              return (
                <div
                  key={notification.id}
                  onClick={finalOnClick}
                  className={`group relative flex items-start p-4 rounded-3xl cursor-pointer transition-all border ${
                    notification.read 
                        ? 'bg-bg-secondary/10 border-white/5 opacity-60' 
                        : 'bg-bg-secondary/40 border-primary-accent/20 shadow-lg'
                  } hover:border-primary-accent/40 hover:bg-bg-secondary/60`}
                >
                  <div className="relative flex-shrink-0 mr-4">
                    <img
                        src={getImageUrl(notification.poster_path, 'w92')}
                        alt=""
                        className="w-14 h-20 rounded-xl object-cover bg-bg-secondary shadow-md border border-white/5"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1.5 bg-bg-primary rounded-lg border border-white/10 shadow-lg">
                        {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  <div className="flex-grow min-w-0 pr-8">
                    <p className="font-black text-text-primary text-sm uppercase tracking-tight truncate leading-tight">
                        {notification.title}
                    </p>
                    <p className="text-xs text-text-secondary font-medium leading-relaxed mt-1 line-clamp-2">
                        {notification.description}
                    </p>
                    <p className="text-[9px] font-black text-text-secondary/40 mt-3 uppercase tracking-widest flex items-center gap-2">
                        <ClockIcon className="w-3 h-3" />
                        {formatTimeAgo(notification.timestamp)}
                    </p>
                  </div>

                  <div className="absolute top-4 right-4 flex flex-col items-center gap-4">
                    {!notification.read && (
                        <div className="w-2.5 h-2.5 bg-primary-accent rounded-full shadow-[0_0_12px_var(--color-accent-primary)] animate-pulse"></div>
                    )}
                    <button 
                        onClick={handleDelete}
                        className="p-2 rounded-xl text-text-secondary/20 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Alert"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <footer className="p-6 bg-bg-secondary/30 border-t border-white/5 text-center flex-shrink-0">
             <button 
                onClick={onClose}
                className="px-10 py-3 rounded-full bg-bg-secondary text-text-secondary font-black uppercase tracking-widest text-[10px] hover:text-text-primary transition-all border border-white/5 shadow-md"
            >
                Return to Registry
            </button>
        </footer>
      </div>
    </div>
  );
};

export default NotificationsModal;
