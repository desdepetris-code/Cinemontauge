import React, { useMemo } from 'react';
import { Comment, PublicUser, TmdbMediaDetails } from '../types';
import { PencilSquareIcon, HeartIcon } from './Icons';
import { PLACEHOLDER_PROFILE } from '../constants';

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

interface User {
  id: string;
  username: string;
  email: string;
}

interface CommentItemProps {
    comment: Comment;
    user: PublicUser;
    currentUser: User | null;
    onReply: (parentId: string) => void;
    onLike: (commentId: string) => void;
    details: TmdbMediaDetails | null;
    children?: React.ReactNode;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, user, currentUser, onReply, onLike, details, children }) => {
    const isLiked = currentUser ? (comment.likes || []).includes(currentUser.id) : false;
    
    const episodeInfo = useMemo(() => {
        if (!details || details.media_type !== 'tv' || !comment.mediaKey.includes('-s')) return null;
        const parts = comment.mediaKey.split('-s');
        if (parts.length < 2) return null;
        const seasonAndEpisode = parts[1].split('-e');
        if (seasonAndEpisode.length < 2) return null;
        const seasonNumber = parseInt(seasonAndEpisode[0], 10);
        const episodeNumber = parseInt(seasonAndEpisode[1], 10);

        if (isNaN(seasonNumber) || isNaN(episodeNumber)) return null;

        return `on S${seasonNumber} E${episodeNumber}`;
    }, [comment.mediaKey, details]);
    
    return (
        <div className="flex items-start space-x-3">
            <img src={user.profilePictureUrl || PLACEHOLDER_PROFILE} alt={user.username} className="w-10 h-10 rounded-full object-cover bg-bg-secondary" />
            <div className="flex-grow">
                <div className="bg-bg-secondary p-3 rounded-lg">
                    <div className="flex justify-between items-baseline">
                        <p className="font-semibold text-text-primary text-sm">
                            {user.username}
                            {episodeInfo && <span className="font-normal text-text-secondary text-xs ml-2">{episodeInfo}</span>}
                        </p>
                        <p className="text-xs text-text-secondary">{formatTimeAgo(comment.timestamp)}</p>
                    </div>
                    <p className="text-text-primary whitespace-pre-wrap mt-1 text-sm">{comment.text}</p>
                </div>
                <div className="flex items-center space-x-3 mt-1 px-2">
                    <button onClick={() => onLike(comment.id)} className="text-xs font-semibold text-text-secondary hover:text-primary-accent flex items-center space-x-1">
                        <HeartIcon filled={isLiked} className={`w-3 h-3 ${isLiked ? 'text-primary-accent' : ''}`} />
                        <span>Like ({comment.likes?.length || 0})</span>
                    </button>
                    <button onClick={() => onReply(comment.id)} className="text-xs font-semibold text-text-secondary hover:text-primary-accent">
                        Reply
                    </button>
                </div>
                {children && <div className="mt-3 space-y-3">{children}</div>}
            </div>
        </div>
    );
};


interface CommentsTabProps {
    comments: Comment[];
    userMap: Map<string, PublicUser>;
    currentUser: User | null;
    onCommentAction: (parentId?: string) => void;
    onToggleLike: (commentId: string) => void;
    details: TmdbMediaDetails | null;
}

const CommentsTab: React.FC<CommentsTabProps> = ({ comments, userMap, currentUser, onCommentAction, onToggleLike, details }) => {
    const { commentsByParent, topLevelComments } = useMemo(() => {
        const commentsByParent = new Map<string, Comment[]>();
        const topLevelComments: Comment[] = [];
        
        comments.forEach(comment => {
            if (comment.parentId) {
                if (!commentsByParent.has(comment.parentId)) {
                    commentsByParent.set(comment.parentId, []);
                }
                commentsByParent.get(comment.parentId)!.push(comment);
            } else {
                topLevelComments.push(comment);
            }
        });
        
        commentsByParent.forEach(replies => replies.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
        topLevelComments.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return { commentsByParent, topLevelComments };
    }, [comments]);

    const renderComments = (commentList: Comment[]) => {
        return commentList.map(comment => {
            const user = userMap.get(comment.userId);
            if (!user) return null;
            
            const replies = commentsByParent.get(comment.id);
            return (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    user={user}
                    currentUser={currentUser}
                    onReply={onCommentAction}
                    onLike={onToggleLike}
                    details={details}
                >
                    {replies && <div className="pl-4 border-l-2 border-bg-secondary/50 space-y-3">{renderComments(replies)}</div>}
                </CommentItem>
            );
        });
    };

    const currentUserComment = currentUser ? comments.find(c => c.userId === currentUser.id && !c.parentId && !c.mediaKey.includes('-s')) : null;

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Your Comment</h3>
                {currentUser ? (
                    currentUserComment ? (
                        <div className="bg-bg-secondary p-4 rounded-lg">
                            <p className="text-text-primary whitespace-pre-wrap">{currentUserComment.text}</p>
                            <div className="flex justify-end mt-2">
                                <button onClick={() => onCommentAction()} className="text-sm font-semibold text-primary-accent hover:underline flex items-center space-x-1">
                                    <PencilSquareIcon className="w-4 h-4" />
                                    <span>Edit Comment</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => onCommentAction()} className="w-full text-center p-4 rounded-lg bg-bg-secondary hover:brightness-125 transition-colors">
                            <span className="font-semibold text-text-primary">Add your comment...</span>
                        </button>
                    )
                ) : (
                    <button onClick={() => onCommentAction()} className="w-full text-center p-4 rounded-lg bg-bg-secondary hover:brightness-125 transition-colors">
                        <span className="font-semibold text-text-primary">Log in to add a comment</span>
                    </button>
                )}
            </div>

            {(topLevelComments.length > 0) && (
                <div>
                    <h3 className="text-xl font-bold text-text-primary mb-3">Community Comments ({comments.length})</h3>
                    <div className="space-y-4">
                        {renderComments(topLevelComments)}
                    </div>
                </div>
            )}
        </div>
    );
};
export default CommentsTab;
