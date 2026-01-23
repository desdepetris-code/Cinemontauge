import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MainApp } from './MainApp';
import AuthModal from './components/AuthModal';
import { UserData, WatchProgress, Theme } from './types';
import { confirmationService } from './services/confirmationService';

interface User {
  id: string;
  username: string;
  email: string;
}

interface StoredUser extends User {
  hashedPassword?: string;
}

// --- Data Migration Helper ---
const migrateGuestData = (newUserId: string) => {
    if (!confirm("You have local data as a guest. Would you like to merge it with your account? This will combine your lists and progress.")) {
        return;
    }

    const guestId = 'guest';
    const keysToMigrate = [
        'watching_list', 'plan_to_watch_list', 'completed_list', 'on_hold_list', 'dropped_list', 'favorites_list',
        'watch_progress', 'history', 'search_history', 'comments', 'custom_image_paths', 'notifications',
        'favorite_episodes', 'episode_ratings', 'custom_lists', 'user_ratings', 'profilePictureUrl'
    ];

    keysToMigrate.forEach(key => {
        const guestKey = `${key}_${guestId}`;
        const userKey = `${key}_${newUserId}`;

        const guestDataStr = localStorage.getItem(guestKey);
        if (!guestDataStr) return;

        const userDataStr = localStorage.getItem(userKey);
        let guestData, userData;

        try {
            guestData = JSON.parse(guestDataStr);
            userData = userDataStr ? JSON.parse(userDataStr) : null;
        } catch (e) {
            console.error(`Failed to parse data for migration on key "${guestKey}". Skipping merge for this key.`, e);
            return;
        }
        
        let mergedData;

        if (!userData) {
            mergedData = guestData;
        } else {
            if (Array.isArray(userData) && Array.isArray(guestData)) {
                 const userIds = new Set(userData.map(i => i.id || i.logId || i.timestamp));
                 const uniqueGuestItems = guestData.filter(item => !userIds.has(item.id || item.logId || item.timestamp));
                 mergedData = [...uniqueGuestItems, ...userData];
            } else if (typeof userData === 'object' && userData !== null && typeof guestData === 'object' && guestData !== null) {
                if (key === 'watch_progress') {
                     const mergedProgress = JSON.parse(JSON.stringify(userData));
                     for (const showId in guestData) {
                         if (!mergedProgress[showId]) {
                             mergedProgress[showId] = guestData[showId];
                         } else {
                             for (const seasonNum in guestData[showId]) {
                                 if (!mergedProgress[showId][seasonNum]) {
                                     mergedProgress[showId][seasonNum] = guestData[showId][seasonNum];
                                 } else {
                                     mergedProgress[showId][seasonNum] = {...guestData[showId][seasonNum], ...mergedProgress[showId][seasonNum]};
                                 }
                             }
                         }
                     }
                     mergedData = mergedProgress;
                } else {
                    mergedData = { ...guestData, ...userData };
                }
            } else {
                mergedData = userData;
            }
        }
        localStorage.setItem(userKey, JSON.stringify(mergedData));
        localStorage.removeItem(guestKey);
    });
};

const recordDeviceLogin = (userId: string, username: string) => {
    // 1. User specific registry (last 5 logins)
    const userRegistryKey = `device_registry_${userId}`;
    const userRegistryStr = localStorage.getItem(userRegistryKey);
    const userRegistry = userRegistryStr ? JSON.parse(userRegistryStr) : [];
    
    const entry = {
        id: `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        lastLogin: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isPWA: window.matchMedia('(display-mode: standalone)').matches
    };

    localStorage.setItem(userRegistryKey, JSON.stringify([entry, ...userRegistry].slice(0, 5)));

    // 2. Global registry for owner broadcasting (simulating centralized device storage)
    const globalRegistryKey = 'sceneit_global_device_tokens';
    const globalRegistryStr = localStorage.getItem(globalRegistryKey);
    const globalRegistry = globalRegistryStr ? JSON.parse(globalRegistryStr) : [];
    
    // Update or add device for this specific browser/user combo
    const existingIndex = globalRegistry.findIndex((d: any) => d.userId === userId && d.userAgent === entry.userAgent);
    if (existingIndex > -1) {
        globalRegistry[existingIndex].lastSeen = entry.lastLogin;
    } else {
        globalRegistry.push({
            userId,
            username,
            userAgent: entry.userAgent,
            lastSeen: entry.lastLogin
        });
    }
    localStorage.setItem(globalRegistryKey, JSON.stringify(globalRegistry));
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
    const userId = currentUser ? currentUser.id : 'guest';

    const [autoHolidayThemesEnabled, setAutoHolidayThemesEnabled] = useLocalStorage<boolean>(`autoHolidayThemesEnabled_${userId}`, true);

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [passwordResetState, setPasswordResetState] = useState<{ email: string; code: string; expiry: number } | null>(null);

    const getUsers = (): StoredUser[] => {
        try {
            const usersJson = localStorage.getItem('sceneit_users');
            let users: StoredUser[] = usersJson ? JSON.parse(usersJson) : [];
            
            const masterEmail = "sceneit_owner@example.com";
            const hasMaster = users.some(u => u.email.toLowerCase() === masterEmail.toLowerCase());
            
            if (!hasMaster) {
                const masterUser: StoredUser = {
                    id: "user_master_001",
                    username: "SceneIt Owner",
                    email: masterEmail,
                    hashedPassword: "YOUR_PASSWORD",
                };
                users.push(masterUser);
                localStorage.setItem('sceneit_users', JSON.stringify(users));
            }
            
            return users;
        } catch (error) {
            console.error("Failed to parse users from localStorage", error);
            return [];
        }
    };

    const saveUsers = (users: StoredUser[]) => {
        localStorage.setItem('sceneit_users', JSON.stringify(users));
    };

    const handleLogin = useCallback(async ({ email, password, rememberMe }): Promise<string | null> => {
        const users = getUsers();
        const user = users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() || 
            u.username.toLowerCase() === email.toLowerCase()
        );

        if (user && user.hashedPassword === password) {
            const loggedInUser = { id: user.id, username: user.username, email: user.email };
            
            migrateGuestData(loggedInUser.id);
            recordDeviceLogin(loggedInUser.id, loggedInUser.username);
            setCurrentUser(loggedInUser);
            setIsAuthModalOpen(false);

            if (rememberMe) {
                localStorage.setItem('rememberedUser', JSON.stringify({ email: user.email, password }));
            } else {
                localStorage.removeItem('rememberedUser');
            }
            
            confirmationService.show(`Security Alert: A login notification has been sent to ${user.email}.`);
            
            return null;
        } else {
            return "Invalid username/email or password.";
        }
    }, [setCurrentUser]);

    const handleSignup = useCallback(async ({ username, email, password }): Promise<string | null> => {
        const users = getUsers();
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) return "An account with this email already exists.";
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) return "This username is already taken.";

        const newUser: StoredUser = {
            id: `user_${Date.now()}`, username, email,
            hashedPassword: password,
        };
        saveUsers([...users, newUser]);
        
        migrateGuestData(newUser.id);
        recordDeviceLogin(newUser.id, newUser.username);
        setCurrentUser({ id: newUser.id, username: newUser.username, email: newUser.email });
        setIsAuthModalOpen(false);
        
        confirmationService.show(`Welcome to CineMontauge! A confirmation email has been sent to ${email}.`);
        
        return null;
    }, [setCurrentUser]);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
    }, [setCurrentUser]);
    
    return (
        <>
            <MainApp
                key={userId}
                userId={userId}
                currentUser={currentUser}
                onLogout={handleLogout}
                onUpdatePassword={() => Promise.resolve(null)}
                onUpdateProfile={() => Promise.resolve(null)}
                onAuthClick={() => setIsAuthModalOpen(true)}
                onForgotPasswordRequest={() => Promise.resolve(null)}
                onForgotPasswordReset={() => Promise.resolve(null)}
                autoHolidayThemesEnabled={autoHolidayThemesEnabled}
                setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled}
            />
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLogin={handleLogin}
                onSignup={handleSignup}
                onForgotPasswordRequest={() => Promise.resolve(null)}
                onForgotPasswordReset={() => Promise.resolve(null)}
            />
        </>
    );
};

export default App;