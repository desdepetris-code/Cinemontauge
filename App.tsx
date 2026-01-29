import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MainApp } from './MainApp';
import AuthModal from './components/AuthModal';
import { confirmationService } from './services/confirmationService';
import { supabase } from './services/supabaseClient';

interface User {
  id: string;
  username: string;
  email: string;
}

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const userId = currentUser ? currentUser.id : 'guest';

    const [autoHolidayThemesEnabled, setAutoHolidayThemesEnabled] = useLocalStorage<boolean>(`autoHolidayThemesEnabled_${userId}`, true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error("Supabase Session Error:", error.message, error.status);
            }
            if (session) {
                setCurrentUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User'
                });
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.debug("Supabase Auth Event:", event);
            if (session) {
                setCurrentUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User'
                });
            } else {
                setCurrentUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = useCallback(async ({ email, password }): Promise<string | null> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.error("Supabase Login Error:", error);
            return error.message;
        }
        setIsAuthModalOpen(false);
        return null;
    }, []);

    const handleGoogleLogin = useCallback(async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            }
        });
        if (error) {
            console.error("Google Auth Error:", error.message);
            alert("Google Sign-In failed: " + error.message);
        }
    }, []);

    const handleSignup = useCallback(async ({ username, email, password }): Promise<string | null> => {
        console.debug("Attempting signup for:", email);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });

        if (error) {
            console.error("Supabase Signup Error Details:", {
                message: error.message,
                status: error.status,
                name: error.name
            });
            
            if (error.message.toLowerCase().includes('api key')) {
                return "Authentication Registry Error: The server rejected the API key. Ensure VITE_ environment variables are correctly set in Vercel.";
            }
            return error.message;
        }
        
        // If the session is immediate (confirmation disabled)
        if (data.session) {
            const { error: profileError } = await supabase.from('profiles').upsert({ 
                id: data.user?.id, 
                username, 
                email,
                user_xp: 0 
            });
            if (profileError) console.error("Error creating profile:", profileError);
            confirmationService.show(`Welcome to SceneIt, ${username}!`);
        } else {
            confirmationService.show(`Registration successful! Please confirm your email (${email}) to activate your account.`);
        }
        
        setIsAuthModalOpen(false);
        return null;
    }, []);

    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        window.location.reload(); // Hard reset to clear memory state
    }, []);

    const handleForgotPasswordRequest = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        return error ? error.message : null;
    };

    if (loading) return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-primary-accent border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="font-black uppercase tracking-widest animate-pulse text-sm text-primary-accent">Verifying Connection...</div>
      </div>
    );
    
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
                onForgotPasswordRequest={handleForgotPasswordRequest}
                onForgotPasswordReset={() => Promise.resolve(null)}
                autoHolidayThemesEnabled={autoHolidayThemesEnabled}
                setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled}
            />
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLogin={handleLogin}
                onGoogleLogin={handleGoogleLogin}
                onSignup={handleSignup}
                onForgotPasswordRequest={handleForgotPasswordRequest}
                onForgotPasswordReset={() => Promise.resolve(null)}
            />
        </>
    );
};

export default App;