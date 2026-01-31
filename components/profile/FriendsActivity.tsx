
import React, { useState, useEffect } from 'react';
import { HistoryItem, Follows, PublicUser, PrivacySettings, TrackedItem } from '../../types';
import { getAllUsers } from '../../utils/userUtils';
import CompactShowCard from '../CompactShowCard';
import { PLACEHOLDER_PROFILE } from '../../constants';

interface FriendsActivityProps {
    currentUser: { id: string; username: string } | null;
    follows: Follows;
    onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
    onSelectUser: (userId: string) => void;
}

interface FriendActivity {
    user: PublicUser;
    history: HistoryItem[];
}

const FriendsActivity: React.FC<FriendsActivityProps> = ({ currentUser, follows, onSelectShow, onSelectUser }) => {
    const [friendsActivity, setFriendsActivity] = useState<FriendActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const followedIds = follows[currentUser.id] || [];
        if (followedIds.length === 0) {
            setLoading(false);
            return;
        }

        const allUsers = getAllUsers();
        const userMap = new Map(allUsers.map(u => [u.id, u.username]));
        
        const activity: FriendActivity[] = [];

        followedIds.forEach(id => {
            try {
                const privacySettingsJson = localStorage.getItem(`privacy_settings_${id}`);
                const privacySettings: PrivacySettings = privacySettingsJson ? JSON.parse(privacySettingsJson) : { activityVisibility: 'followers' };

                if (privacySettings.activityVisibility === 'private') {
                    return; 
                }

                const historyJson = localStorage.getItem(`history_${id}`);
                if (!historyJson) return;

                const fullHistory: HistoryItem[] = JSON.parse(historyJson);
                if (!Array.isArray(fullHistory)) return;

                const uniqueMediaIds = new Set<number>();
                const recentUniqueHistory: HistoryItem[] = [];
                for (const item of fullHistory) {
                    if (!uniqueMediaIds.has(item.id)) {
                        uniqueMediaIds.add(item.id);
                        recentUniqueHistory.push(item);
                    }
                    if (recentUniqueHistory.length >= 5) break;
                }

                if (recentUniqueHistory.length > 0) {
                    const profilePicJson = localStorage.getItem(`profilePictureUrl_${id}`);
                    let profilePictureUrl = null;
                    if (profilePicJson) {
                        try { profilePictureUrl = JSON.parse(profilePicJson); } catch(e) { profilePictureUrl = profilePicJson; }
                    }

                    activity.push({
                        user: {
                            id,
                            username: userMap.get(id) || 'Unknown User',
                            profilePictureUrl,
                        },
                        history: recentUniqueHistory,
                    });
                }
            } catch (e) {
                console.error(`Registry trace error for user ${id}:`, e);
            }
        });

        setFriendsActivity(activity);
        setLoading(false);

    }, [currentUser, follows]);

    if (loading) {
        return (
            <div className="bg-card-gradient rounded-lg shadow-md p-4 animate-pulse">
                <div className="h-6 w-1/2 bg-bg-secondary rounded-md mb-4"></div>
                <div className="h-40 bg-bg-secondary rounded-md"></div>
            </div>
        );
    }

    if (!currentUser || friendsActivity.length === 0) {
        return (
            <div className="bg-card-gradient rounded-lg shadow-md p-6 text-center">
                <h3 className="text-xl font-bold text-text-primary">Friends' Activity</h3>
                <p className="text-text-secondary mt-2">Follow other users to see what they've been watching here!</p>
            </div>
        );
    }
    
    return (
        <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-accent-gradient mb-4">Friends' Recent Activity</h2>
            <div className="space-y-6">
                {friendsActivity.map(({ user, history }) => (
                    <div key={user.id}>
                        <div 
                            className="flex items-center space-x-3 mb-3 cursor-pointer group"
                            onClick={() => onSelectUser(user.id)}
                        >
                            <img src={user.profilePictureUrl || PLACEHOLDER_PROFILE} alt={user.username} className="w-8 h-8 rounded-full object-cover bg-bg-secondary border border-white/5" />
                            <h4 className="font-semibold text-text-primary group-hover:underline">{user.username}</h4>
                        </div>
                        <div className="flex overflow-x-auto space-x-4 pb-2 hide-scrollbar">
                            {history.map(item => (
                                <div key={item.logId} className="w-28 flex-shrink-0">
                                    <CompactShowCard item={item} onSelect={onSelectShow} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FriendsActivity;
