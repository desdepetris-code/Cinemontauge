import React, { useState, useEffect, useMemo } from 'react';
import { TmdbMediaDetails, Comment, PublicUser, TmdbSeasonDetails, Follows, CommentVisibility } from '../types';
import CommentThread from './CommentThread';
import { ChevronDownIcon, GlobeAltIcon, UsersIcon, LockClosedIcon } from './Icons';

interface CommentsTabProps {
    details: TmdbMediaDetails;
    comments: Comment[];
    currentUser: { id: string; username: string; email: string; } | null;
    allUsers: PublicUser[];
    seasonDetailsMap: Record<number, TmdbSeasonDetails>;
    onFetchSeasonDetails: (seasonNumber: number) => void;
    onSaveComment: (commentData: { mediaKey: string; text: string; parentId: string | null; isSpoiler: boolean; visibility: CommentVisibility; }) => void;
    onToggleLikeComment: (commentId: string) => void;
    onDeleteComment: (commentId: string) => void;
    activeThread: string;
    setActiveThread: (key: string) => void;
    follows: Follows;
}

const CommentForm: React.FC<{
    onSubmit: (text: string, isSpoiler: boolean, visibility: CommentVisibility) => void;
    buttonText?: string;
    onCancel?: () => void;
}> = ({ onSubmit, buttonText = "Post Comment", onCancel }) => {
    const [text, setText] = useState('');
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [visibility, setVisibility] = useState<CommentVisibility>('public');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSubmit(text, isSpoiler, visibility);
        setText('');
        setIsSpoiler(false);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-bg-secondary/20 p-6 rounded-2xl border border-white/5 shadow-inner">
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Join the discussion..."
                className="w-full h-24 p-3 bg-bg-primary rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent border border-white/10"
                required
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center text-xs text-text-secondary cursor-pointer font-bold uppercase tracking-widest">
                        <input type="checkbox" checked={isSpoiler} onChange={e => setIsSpoiler(e.target.checked)} className="h-4 w-4 rounded border-bg-secondary text-primary-accent focus:ring-primary-accent" />
                        <span className="ml-2">Spoiler</span>
                    </label>
                    <div className="flex items-center gap-2 bg-bg-primary p-1 rounded-lg border border-white/5">
                        {(['public', 'followers', 'private'] as const).map(v => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setVisibility(v)}
                                className={`p-1.5 rounded transition-all ${visibility === v ? 'bg-primary-accent text-on-accent' : 'text-text-secondary hover:text-text-primary'}`}
                                title={v.charAt(0).toUpperCase() + v.slice(1)}
                            >
                                {v === 'public' && <GlobeAltIcon className="w-4 h-4" />}
                                {v === 'followers' && <UsersIcon className="w-4 h-4" />}
                                {v === 'private' && <LockClosedIcon className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-x-2 w-full sm:w-auto flex justify-end">
                    {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-black uppercase rounded-xl text-text-primary hover:bg-bg-secondary">Cancel</button>}
                    <button type="submit" className="px-6 py-2 text-xs font-black uppercase rounded-xl bg-accent-gradient text-on-accent hover:opacity-90 shadow-lg">{buttonText}</button>
                </div>
            </div>
        </form>
    );
};


const CommentsTab: React.FC<CommentsTabProps> = (props) => {
    const { details, onFetchSeasonDetails, seasonDetailsMap, activeThread, setActiveThread, currentUser, follows } = props;
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_liked'>('newest');

    const filteredComments = useMemo(() => {
        const viewerId = currentUser?.id || 'guest';
        const myFollowing = follows[viewerId] || [];

        return props.comments.filter(comment => {
            const authorId = comment.user.id;
            
            // Rules:
            // 1. Author can always see their own comment
            if (authorId === viewerId) return true;
            
            // 2. Private comments are ONLY for the author
            if (comment.visibility === 'private') return false;
            
            // 3. Public comments are for everyone
            if (comment.visibility === 'public') return true;
            
            // 4. Followers only: viewer must follow author
            if (comment.visibility === 'followers') {
                return myFollowing.includes(authorId);
            }

            return false;
        });
    }, [props.comments, currentUser, follows]);

    const handlePostComment = (text: string, isSpoiler: boolean, visibility: CommentVisibility) => {
        const mediaKey = activeThread === 'general' ? `${details.media_type}-${details.id}` : activeThread;
        props.onSaveComment({ mediaKey, text, parentId: null, isSpoiler, visibility });
    };

    const threadOptions = useMemo(() => {
        const options: { key: string; label: string; group: string }[] = [{ key: 'general', label: 'General Discussion', group: 'Main' }];
        if (details.media_type === 'tv' && details.seasons) {
            details.seasons.forEach(season => {
                if (season.season_number > 0) {
                    options.push({
                        key: `s${season.season_number}`,
                        label: season.name,
                        group: `Season ${season.season_number}`,
                    });
                }
            });
        }
        return options;
    }, [details]);
    
    const handleThreadChange = (key: string) => {
        if (key.startsWith('s')) {
            const seasonNum = parseInt(key.replace('s', ''));
            if (!seasonDetailsMap[seasonNum]) {
                onFetchSeasonDetails(seasonNum);
            }
        }
        setActiveThread(key === `s${details.last_episode_to_air?.season_number}` ? `tv-${details.id}-s${details.last_episode_to_air?.season_number}-e${details.last_episode_to_air?.episode_number}` : key);
    }
    
    const isEpisodeThread = activeThread.startsWith('tv-') && activeThread.includes('-e');

    const selectedGroup = useMemo(() => {
        if (isEpisodeThread) {
             const parts = activeThread.split('-');
             const seasonNum = parts[2].replace('s', '');
             return `s${seasonNum}`;
        }
        return activeThread;
    }, [activeThread, isEpisodeThread]);
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                     <select
                        value={selectedGroup}
                        onChange={(e) => handleThreadChange(e.target.value)}
                        className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    >
                       {threadOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                </div>
                {selectedGroup.startsWith('s') && (
                    <div className="relative flex-1">
                        <select
                            value={activeThread}
                            onChange={(e) => setActiveThread(e.target.value)}
                            className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                        >
                            {!seasonDetailsMap[parseInt(selectedGroup.replace('s', ''))] ? (
                                <option>Loading episodes...</option>
                            ) : (
                                seasonDetailsMap[parseInt(selectedGroup.replace('s', ''))].episodes.map(ep => (
                                    <option key={ep.id} value={`tv-${details.id}-s${ep.season_number}-e${ep.episode_number}`}>
                                        E{ep.episode_number}: {ep.name}
                                    </option>
                                ))
                            )}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                    </div>
                )}
                 <div className="relative">
                     <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="most_liked">Top</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                </div>
            </div>

            {currentUser ? (
                <CommentForm onSubmit={handlePostComment} />
            ) : (
                <div className="text-center p-4 bg-bg-secondary/50 rounded-lg">
                    <p className="text-text-secondary">You must be logged in to comment.</p>
                </div>
            )}
            
            <CommentThread
                allComments={filteredComments}
                threadKey={activeThread === 'general' ? `${details.media_type}-${details.id}` : activeThread}
                sortBy={sortBy}
                currentUser={currentUser}
                onSaveComment={props.onSaveComment}
                onToggleLikeComment={props.onToggleLikeComment}
                onDeleteComment={props.onDeleteComment}
            />
        </div>
    );
};

export default CommentsTab;