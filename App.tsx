import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MainApp } from './MainApp';
import AuthModal from './components/AuthModal';
import CompleteProfileModal from './components/CompleteProfileModal';
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
    const [missingUsername, setMissingUsername] = useState(false);
    const [missingPassword, setMissingPassword] = useState(false);
    
    const userId = currentUser ? currentUser.id : 'guest';
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const checkProfileStatus = useCallback(async (supabaseUser: any) => {
        if (!supabaseUser) return;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', supabaseUser.id)
            .single();

        const hasUsername = !!(profile?.username);
        const hasPassword = supabaseUser.identities?.some((identity: any) => identity.provider === 'email') || false;

        setMissingUsername(!hasUsername);
        setMissingPassword(!hasPassword);

        if (hasUsername) {
            setCurrentUser({
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                username: profile.username
            });
        }
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error("Supabase Session Error:", error.message);
            }
            if (session) {
                checkProfileStatus(session.user);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                    checkProfileStatus(session.user);
                }
            } else {
                setCurrentUser(null);
                setMissingUsername(false);
                setMissingPassword(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [checkProfileStatus]);

    const handleLogin = useCallback(async ({ email, password }: any): Promise<string | null> => {
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

    const handleSignup = useCallback(async ({ username, email, password }: any): Promise<string | null> => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });

        if (error) return error.message;
        
        if (data.session) {
            const { error: profileError } = await supabase.from('profiles').upsert({ 
                id: data.user?.id, 
                username, 
                email,
                user_xp: 0 
            });
            if (profileError) console.error("Error creating profile:", profileError);
            confirmationService.show(`Welcome to CineMontauge, ${username}!`);
            setIsAuthModalOpen(false);
        } else {
            // This is handled via the success state in AuthModal for better UX
            // but we also show a confirmation just in case.
            confirmationService.show(`A verification link was dispatched to ${email}.`);
        }
        
        return null;
    }, []);

    const handleCompleteProfile = useCallback(async (data: { username?: string; password?: string }): Promise<string | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return "User session not found.";

        if (data.password) {
            const { error: authError } = await supabase.auth.updateUser({ password: data.password });
            if (authError) return authError.message;
        }

        if (data.username) {
            const { error: profileError } = await supabase.from('profiles').upsert({ 
                id: user.id, 
                username: data.username,
                email: user.email
            }, { onConflict: 'id' });
            
            if (profileError) {
                if (profileError.code === '23505') return "Username already taken.";
                return profileError.message;
            }
        }

        await checkProfileStatus(user);
        confirmationService.show(`Registry updated! Welcome to CineMontauge.`);
        return null;
  }, [checkProfileStatus]);

    const handleUpdatePassword = useCallback(async (passwords: { currentPassword: string; newPassword: string; }): Promise<string | null> => {
        const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });
        if (error) return error.message;
        confirmationService.show("Security credentials updated.");
        return null;
    }, []);

    const handleUpdateProfile = useCallback(async (details: { username: string; email: string; }): Promise<string | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return "No active session.";

        if (details.email !== user.email) {
            const { error: emailError } = await supabase.auth.updateUser({ email: details.email });
            if (emailError) return emailError.message;
            confirmationService.show("Check your emails to confirm the address change.");
        }

        const { error: dbError } = await supabase
            .from('profiles')
            .update({ username: details.username, email: details.email })
            .eq('id', user.id);

        if (dbError) {
            if (dbError.code === '23505') return "Username is already registered.";
            return dbError.message;
        }

        setCurrentUser(prev => prev ? { ...prev, username: details.username, email: details.email } : null);
        confirmationService.show("Registry identity updated.");
        return null;
    }, []);

    const handleForgotPasswordRequest = useCallback(async (email: string): Promise<string | null> => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) return error.message;
        return null;
    }, []);

    const handleForgotPasswordReset = useCallback(async (data: { code: string; newPassword: string }): Promise<string | null> => {
        const { error } = await supabase.auth.updateUser({ password: data.newPassword });
        if (error) return error.message;
        return null;
    }, []);

    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        window.location.reload();
    }, []);

    if (loading) return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-primary-accent border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="font-black uppercase tracking-widest animate-pulse text-sm text-primary-accent">Verifying Connection...</div>
      </div>
    );

    const showProfileCompletion = missingUsername || missingPassword;
    
    return (
        <>
            <MainApp
                key={userId}
                userId={userId}
                currentUser={currentUser}
                onLogout={handleLogout}
                onUpdatePassword={handleUpdatePassword}
                onUpdateProfile={handleUpdateProfile}
                onAuthClick={() => setIsAuthModalOpen(true)}
                onForgotPasswordRequest={handleForgotPasswordRequest}
                onForgotPasswordReset={handleForgotPasswordReset}
            />
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLogin={handleLogin}
                onGoogleLogin={handleGoogleLogin}
                onSignup={handleSignup}
                onForgotPasswordRequest={handleForgotPasswordRequest}
                onForgotPasswordReset={handleForgotPasswordReset}
            />
            <CompleteProfileModal 
                isOpen={showProfileCompletion}
                missingUsername={missingUsername}
                missingPassword={missingPassword}
                onComplete={handleCompleteProfile}
            />
        </>
    );
};

export default App;