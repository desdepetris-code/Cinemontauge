import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon } from './Icons';
import { PublicUser } from '../types';
import { getAllUsers } from '../utils/userUtils';
import { PLACEHOLDER_PROFILE } from '../constants';

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    userIds: string[];
    onSelectUser: (userId: string) => void;
}

const FollowListModal: React.FC<FollowListModalProps> = ({ isOpen, onClose, title, userIds, onSelectUser }) => {
    const [users, setUsers] = useState<PublicUser[]>([]);

    useEffect(() => {
        if (isOpen && userIds.length > 0) {
            const allUsers = getAllUsers();
            const userMap = new Map(allUsers.map(u => [u.id, u.username]));

            const userDetails = userIds.map(id => {
                const profilePicJson = localStorage.getItem(`profilePictureUrl_${id}`);
                let profilePictureUrl: string | null = null;
                if (profilePicJson) {
                    try {
                        profilePictureUrl = JSON.parse(profilePicJson);
                    } catch (e) {
                        console.warn(`Could not parse profile picture URL for user ${id}. Value:`, profilePicJson, e);
                        if (typeof profilePicJson === 'string' && (profilePicJson.startsWith('http') || profilePicJson.startsWith('data:'))) {
                            profilePictureUrl = profilePicJson;
                        }
                    }
                }
                return {
                    id,
                    username: userMap.get(id) || 'Unknown User',
                    profilePictureUrl,
                };
            });
            setUsers(userDetails);
        }
    }, [isOpen, userIds]);

    if (!isOpen) return null;

    const handleSelect = (userId: string) => {
        onClose();
        onSelectUser(userId);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-sm h-[70vh] flex flex-col p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-text-primary">{title} ({userIds.length})</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary"><XMarkIcon className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-grow overflow-y-auto">
                    {users.length > 0 ? (
                        <div className="space-y-3">
                            {users.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-secondary">
                                    <div className="flex items-center space-x-3">
                                        <img src={user.profilePictureUrl || PLACEHOLDER_PROFILE} alt={user.username} className="w-10 h-10 rounded-full object-cover bg-bg-secondary" />
                                        <span className="font-semibold text-text-primary">{user.username}</span>
                                    </div>
                                    <button onClick={() => handleSelect(user.id)} className="px-3 py-1 text-xs font-semibold rounded-full bg-bg-secondary text-text-primary hover:brightness-125">
                                        View
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-secondary text-center pt-10">No users to display.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowListModal;