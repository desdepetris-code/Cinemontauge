import React, { useState, useEffect } from 'react';
import { EnvelopeIcon, XMarkIcon, SearchNavIcon, CheckCircleIcon, SparklesIcon } from './Icons';
import Logo from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (credentials: { email: string; password: string; rememberMe: boolean }) => Promise<string | null>;
  onGoogleLogin: () => void;
  onSignup: (details: any) => Promise<string | null>;
  onForgotPasswordRequest: (email: string) => Promise<string | null>;
  onForgotPasswordReset: (data: { code: string; newPassword: string }) => Promise<string | null>;
}

const InputField: React.FC<{ type: string, placeholder: string, value: string, onChange: (val: string) => void, icon?: React.ReactNode, readOnly?: boolean }> = ({ type, placeholder, value, onChange, icon, readOnly }) => (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        readOnly={readOnly}
        className={`w-full pl-10 pr-4 py-3 bg-bg-primary text-text-primary placeholder-text-secondary/60 rounded-lg border border-white/10 focus:border-primary-accent focus:outline-none focus:ring-1 focus:ring-primary-accent transition-all shadow-inner ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/70">
        {icon}
      </div>
    </div>
);

const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
);

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onGoogleLogin, onSignup, onForgotPasswordRequest, onForgotPasswordReset }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot_email' | 'forgot_code' | 'find_account' | 'signup_success'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [lookupValue, setLookupValue] = useState('');

  const resetForm = () => {
    setError(null);
    setInfo(null);
    setLoading(false);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setResetCode('');
    setLookupValue('');
  };

  useEffect(() => {
      if(isOpen) {
        resetForm();
        setView('login');
        try {
            const rememberedUserJson = localStorage.getItem('rememberedUser');
            if (rememberedUserJson) {
                const rememberedUser = JSON.parse(rememberedUserJson);
                setEmail(rememberedUser.email || '');
                setPassword(rememberedUser.password || '');
                setRememberMe(true);
            } else {
                setEmail('');
                setPassword('');
                setRememberMe(false);
            }
        } catch (error) {
            console.error("Failed to parse remembered user from localStorage", error);
        }
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFindAccount = () => {
    setError(null);
    setInfo(null);
    setLoading(true);

    const usersJson = localStorage.getItem('sceneit_users');
    const users = usersJson ? JSON.parse(usersJson) : [];
    const lowerLookup = lookupValue.toLowerCase().trim();

    const foundUser = users.find((u: any) => 
        u.email.toLowerCase() === lowerLookup || 
        u.username.toLowerCase() === lowerLookup
    );

    setTimeout(() => {
        if (foundUser) {
            const obscuredEmail = foundUser.email.replace(/(.{2})(.*)(?=@)/, (gp1: string, gp2: string, gp3: string) => {
                return gp2 + "*".repeat(gp3.length);
            });
            setInfo(`Success! We found an account for "${foundUser.username}". A recovery link has been simulated to ${obscuredEmail}.`);
        } else {
            setError("We couldn't find an account matching that information. Please check your spelling or sign up for a new account.");
        }
        setLoading(false);
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (view === 'find_account') {
        handleFindAccount();
        return;
    }

    setLoading(true);
    let authError: string | null = null;

    if (view === 'login') {
      authError = await onLogin({ email, password, rememberMe });
    } else if (view === 'signup') {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      authError = await onSignup({ username, email, password });
      if (!authError) {
          setView('signup_success');
          setLoading(false);
          return;
      }
    } else if (view === 'forgot_email') {
        authError = await onForgotPasswordRequest(email);
        if (!authError) {
            setInfo("A reset code has been 'sent' to your email.");
            setView('forgot_code');
        }
    } else if (view === 'forgot_code') {
        if (password !== confirmPassword) {
            setError("New passwords do not match.");
            setLoading(false);
            return;
        }
        authError = await onForgotPasswordReset({ code: resetCode, newPassword: password });
    }

    if (authError) {
      setError(authError);
    }
    setLoading(false);
  };
  
  const handleSwitchView = (newView: 'login' | 'signup') => {
      setView(newView);
      resetForm();
  }

  const renderContent = () => {
    switch (view) {
        case 'signup_success':
            return (
                <div className="text-center py-6 space-y-6 animate-fade-in">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner border border-green-500/30">
                        <CheckCircleIcon className="w-10 h-10 text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">Verify Your Identity</h3>
                        <p className="text-sm text-text-secondary mt-2 font-medium leading-relaxed">
                            We've dispatched a secure verification link to:
                            <br />
                            <strong className="text-primary-accent block mt-1">{email}</strong>
                        </p>
                    </div>
                    <div className="p-4 bg-primary-accent/5 rounded-xl border border-primary-accent/10">
                        <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest leading-relaxed">
                            Check your inbox (and spam) to finalize your entry into the CineMontauge registry.
                        </p>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="w-full py-4 rounded-xl bg-bg-secondary text-text-primary font-black uppercase text-[10px] tracking-widest hover:brightness-125 transition-all shadow-md"
                    >
                        Got it, I'll check my email
                    </button>
                </div>
            );
        case 'login':
            return (
                <>
                    <button 
                        type="button" 
                        onClick={onGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 py-3 bg-white text-black font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-md active:scale-[0.98] mb-4"
                    >
                        <GoogleIcon />
                        <span>Sign in with Google</span>
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-grow bg-white/10"></div>
                        <span className="text-[10px] font-black uppercase text-text-secondary opacity-40">Or Use Credentials</span>
                        <div className="h-px flex-grow bg-white/10"></div>
                    </div>

                    <InputField type="email" placeholder="Email" value={email} onChange={setEmail} icon={<EnvelopeIcon />} />
                    <InputField type="password" placeholder="Password" value={password} onChange={setPassword} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"></path></svg>} />
                    <div className="flex flex-col space-y-3 pt-2">
                        <label className="flex items-center text-sm text-text-secondary cursor-pointer">
                            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-bg-secondary text-primary-accent focus:ring-primary-accent" />
                            <span className="ml-2">Remember me</span>
                        </label>
                        <div className="flex justify-between items-center text-xs">
                            <button type="button" onClick={() => setView('forgot_email')} className="font-semibold text-primary-accent hover:underline">Forgot Password?</button>
                            <button type="button" onClick={() => setView('find_account')} className="font-semibold text-primary-accent hover:underline">Can't find account?</button>
                        </div>
                    </div>
                </>
            );
        case 'signup':
            return (
                <>
                    <button 
                        type="button" 
                        onClick={onGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 py-3 bg-white text-black font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-md active:scale-[0.98] mb-4"
                    >
                        <GoogleIcon />
                        <span>Sign up with Google</span>
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-grow bg-white/10"></div>
                        <span className="text-[10px] font-black uppercase text-text-secondary opacity-40">Or Create Manually</span>
                        <div className="h-px flex-grow bg-white/10"></div>
                    </div>

                    <InputField type="text" placeholder="Username" value={username} onChange={setUsername} icon={<SearchNavIcon className="w-5 h-5" />} />
                    <InputField type="email" placeholder="Email" value={email} onChange={setEmail} icon={<EnvelopeIcon />} />
                    <InputField type="password" placeholder="Password" value={password} onChange={setPassword} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"></path></svg>} />
                    <InputField type="password" placeholder="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"></path></svg>} />
                </>
            );
        case 'forgot_email':
            return (
                <div className="space-y-4">
                    <p className="text-sm text-text-secondary text-center">Enter your email to receive a password reset code.</p>
                    <InputField type="email" placeholder="Enter your account email" value={email} onChange={setEmail} icon={<EnvelopeIcon />} />
                </div>
            );
        case 'find_account':
            return (
                <div className="space-y-4">
                    <p className="text-sm text-text-secondary text-center">Lost track of your account? Enter your username or any email you might have used.</p>
                    <InputField type="text" placeholder="Username or Email" value={lookupValue} onChange={setLookupValue} icon={<SearchNavIcon className="w-5 h-5" />} />
                </div>
            );
        case 'forgot_code':
            return (
                <>
                    <InputField type="email" placeholder="Email" value={email} onChange={() => {}} icon={<EnvelopeIcon />} readOnly />
                    <InputField type="text" placeholder="6-Digit Reset Code" value={resetCode} onChange={setResetCode} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"></path></svg>} />
                    <InputField type="password" placeholder="New Password" value={password} onChange={setPassword} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"></path></svg>} />
                </>
            );
    }
  };

  const titles = { 
    login: 'Welcome Back', 
    signup: 'Create Account', 
    forgot_email: 'Forgot Password', 
    forgot_code: 'Reset Password',
    find_account: 'Find Account',
    signup_success: 'Alert Sent'
  };
  const buttonTexts = { 
    login: 'Log In', 
    signup: 'Sign Up', 
    forgot_email: 'Send Reset Code', 
    forgot_code: 'Reset Password',
    find_account: 'Locate Account',
    signup_success: 'Close'
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-sm p-8 animate-fade-in relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary"><XMarkIcon className="w-5 h-5" /></button>
        
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-text-primary uppercase tracking-tighter">CineMontauge</h1>
        </div>

        <div className="bg-card-gradient rounded-xl p-6 border border-white/5 shadow-2xl">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-6">{titles[view]}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-400 text-sm text-center bg-red-500/20 p-3 rounded-lg">{error}</p>}
            {info && <p className="text-blue-400 text-sm text-center bg-blue-500/20 p-3 rounded-lg">{info}</p>}
            
            {renderContent()}

            {view !== 'signup_success' && (
                <button type="submit" disabled={loading} className="w-full py-3 mt-4 rounded-lg bg-accent-gradient text-on-accent font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xl">
                  {loading ? 'Processing...' : buttonTexts[view]}
                </button>
            )}
          </form>
        </div>
        {view !== 'signup_success' && (
            <p className="text-center text-sm text-text-secondary mt-6">
              {view === 'login' && "Don't have an account?"}
              {view === 'signup' && "Already have an account?"}
              {(view === 'forgot_email' || view === 'forgot_code' || view === 'find_account') && "Ready to sign in?"}
              <button onClick={() => {
                  if (view === 'login') handleSwitchView('signup');
                  else if (view === 'signup') handleSwitchView('login');
                  else handleSwitchView('login');
              }} className="font-bold text-primary-accent hover:underline ml-2">
                {view === 'login' && 'Sign Up'}
                {view === 'signup' && 'Log In'}
                {(view === 'forgot_email' || view === 'forgot_code' || view === 'find_account') && "Log In"}
              </button>
            </p>
        )}
      </div>
    </div>
  );
};

export default AuthModal;