import React, { useState, useEffect } from 'react';
import { PublicUser, CustomList, PrivacySettings } from '../types';
import { getAllUsers } from '../utils/userUtils';
// Added LockClosedIcon to imports
import { XMarkIcon, UserPlusIcon, UserMinusIcon, HeartIcon, EyeSlashIcon, EyeIcon, LockClosedIcon } from './Icons';
import { PLACEHOLDER_PROFILE } from '../constants';
import ListGrid from './ListGrid';
import ReportUserModal from './ReportUserModal';

interface UserProfileModalProps {
    userId: string;
    currentUser: { id: string; username: string };
    follows: string[];
    onFollow: (userId: string, username: string) => void;
    onUnfollow: (userId: string) => void;
    onClose: () => void;
    onToggleLikeList: (ownerId: string, listId: string, listName: string) => void;
    onBlockUser: (id: string) => Promise<void>;
    onUnblockUser: (id: string) => Promise<void>;
    isBlocked: boolean;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, currentUser, follows, onFollow, onUnfollow, onClose, onToggleLikeList, onBlockUser, onUnblockUser, isBlocked }) => {
    const [user, setUser] = useState<PublicUser | null>(null);
    const [publicLists, setPublicLists] = useState<CustomList[]>([]);
    const [loading, setLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        const allUsers = getAllUsers();
        const foundUser = allUsers.find(u => u.id === userId);
        
        if (foundUser) {
            const profilePicJson = localStorage.getItem(`profilePictureUrl_${userId}`);
            let profilePictureUrl: string | null = null;
            if (profilePicJson) {
                try {
                    profilePictureUrl = JSON.parse(profilePicJson);
                } catch (e) {
                    console.warn(`Could not parse profile picture URL for user ${userId}. Value:`, profilePicJson, e);
                    if (typeof profilePicJson === 'string' && (profilePicJson.startsWith('http') || profilePicJson.startsWith('data:'))) {
                        profilePictureUrl = profilePicJson;
                    }
                }
            }
            setUser({ id: foundUser.id, username: foundUser.username, profilePictureUrl });
            
            const privacySettingsJson = localStorage.getItem(`privacy_settings_${userId}`);
            const privacySettings: PrivacySettings = privacySettingsJson ? JSON.parse(privacySettingsJson) : { activityVisibility: 'followers' };

            if (privacySettings.activityVisibility === 'private' || isBlocked) {
                setPublicLists([]);
            } else {
                const listsJson = localStorage.getItem(`custom_lists_${userId}`);
                if (listsJson) {
                    const allLists: CustomList[] = JSON.parse(listsJson);
                    // FIX: Changed 'list.isPublic' to 'list.visibility === 'public'' to align with CustomList type
                    setPublicLists(allLists.filter(list => list.visibility === 'public'));
                }
            }
        }
        setLoading(false);
    }, [userId, isBlocked]);
    
    const isFollowing = follows.includes(userId);

    const handleFollowToggle = () => {
        if (!user) return;
        if (isFollowing) {
            onUnfollow(user.id);
        } else {
            onFollow(user.id, user.username);
        }
    };

    const handleLike = (listId: string, listName: string) => {
        onToggleLikeList(userId, listId, listName);
        // Optimistically update UI
        setPublicLists(prev => prev.map(list => {
            if (list.id === listId) {
                const likes = list.likes || [];
                const userIndex = likes.indexOf(currentUser.id);
                if (userIndex > -1) {
                    likes.splice(userIndex, 1);
                } else {
                    likes.push(currentUser.id);
                }
                return { ...list, likes };
            }
            return list;
        }));
    };

    const handleReport = (reason: string, comments: string) => {
        if (!user) return;
        const subject = `Report User: ${user.username} (ID: ${user.id})`;
        const body = `Report submitted by: ${currentUser.username} (ID: ${currentUser.id})\n\nReported User: ${user.username} (ID: ${user.id})\n\nReason: ${reason}\n\nAdditional Comments:\n${comments}`;
        window.location.href = `mailto:sceneit623@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setIsReportModalOpen(false);
    };

    return (
        <>
            {user && (
                <ReportUserModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    reportedUsername={user.username}
                    onReport={handleReport}
                />
            )}
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-2xl h-[90vh] flex flex-col p-6 animate-fade-in border border-white/10" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-text-primary">User Profile</h2>
                        <button onClick={onClose} className="p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary"><XMarkIcon className="w-5 h-5" /></button>
                    </div>
                    
                    {loading ? (
                        <div className="text-center">Loading profile...</div>
                    ) : !user ? (
                        <div className="text-center text-red-400">Could not load user profile.</div>
                    ) : (
                        <>
                            <div className="flex items-center space-x-4 mb-6 flex-shrink-0">
                                <img src={user.profilePictureUrl || PLACEHOLDER_PROFILE} alt={user.username} className="w-20 h-20 rounded-full object-cover bg-bg-secondary"/>
                                <div className="flex-grow">
                                    <h3 className="text-xl font-bold text-text-primary">{user.username}</h3>
                                    {isBlocked && <span className="text-[10px] font-black uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">Restricted</span>}
                                </div>
                                <div className="flex flex-col space-y-2">
                                    {!isBlocked && (
                                        <button
                                            onClick={handleFollowToggle}
                                            className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${isFollowing ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-accent-gradient text-on-accent hover:opacity-90'}`}
                                        >
                                            {isFollowing ? <UserMinusIcon className="w-5 h-5"/> : <UserPlusIcon className="w-5 h-5"/>}
                                            <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => isBlocked ? onUnblockUser(userId) : onBlockUser(userId)}
                                        className={`flex items-center justify-center space-x-2 px-4 py-2 text-xs font-bold rounded-full border transition-all ${isBlocked ? 'bg-bg-secondary border-primary-accent text-primary-accent' : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white'}`}
                                    >
                                        {isBlocked ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                                        <span>{isBlocked ? 'Restore Access' : 'Restrict Content'}</span>
                                    </button>
                                     <button onClick={() => setIsReportModalOpen(true)} className="px-3 py-1 text-xs text-text-secondary hover:underline">
                                        Report User
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto space-y-6">
                                {isBlocked ? (
                                    <div className="flex flex-col items-center justify-center h-full opacity-40 text-center px-10">
                                        <LockClosedIcon className="w-16 h-16 mb-4" />
                                        <p className="text-sm font-black uppercase tracking-widest">Profile Content Restricted</p>
                                        <p className="text-xs font-medium mt-2">Unblock this user to see their collections and activity.</p>
                                    </div>
                                ) : publicLists.length > 0 ? (
                                    publicLists.map(list => {
                                        const hasLiked = list.likes?.includes(currentUser.id);
                                        return (
                                            <div key={list.id}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-bold text-lg text-text-primary">{list.name}</h4>
                                                        <p className="text-sm text-text-secondary mb-2">{list.description}</p>
                                                    </div>
                                                    <button onClick={() => handleLike(list.id, list.name)} className="flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-md transition-colors bg-bg-secondary text-text-primary hover:brightness-125 font-semibold">
                                                        <HeartIcon className={`w-4 h-4 ${hasLiked ? 'text-primary-accent' : 'text-text-secondary'}`} filled={hasLiked} />
                                                        <span>{list.likes?.length || 0}</span>
                                                    </button>
                                                </div>
                                                <ListGrid items={list.items} onSelect={() => {}} />
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-text-secondary text-center pt-10">This user's profile is private or they have no public lists.</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default UserProfileModal;
