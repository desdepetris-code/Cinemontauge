import React, { useState, useEffect } from 'react';
import { EnvelopeIcon, XMarkIcon } from './Icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (credentials: { email: string; password: string; rememberMe: boolean }) => Promise<string | null>;
  onSignup: (details: any) => Promise<string | null>;
}

const InputField: React.FC<{ type: string, placeholder: string, value: string, onChange: (val: string) => void, icon?: React.ReactNode }> = ({ type, placeholder, value, onChange, icon }) => (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full pl-10 pr-4 py-3 bg-bg-secondary/80 text-black placeholder-black/60 rounded-lg border border-transparent focus:border-primary-accent focus:outline-none focus:ring-1 focus:ring-primary-accent transition-all"
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/70">
        {icon}
      </div>
    </div>
);

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onSignup }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      if(isOpen) {
        setError(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    let authError: string | null = null;

    if (isLoginView) {
      authError = await onLogin({ email, password, rememberMe });
    } else {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      authError = await onSignup({ username, email, password });
    }

    if (authError) {
      setError(authError);
    }
    setLoading(false);
  };
  
  const handleSwitchView = () => {
      setIsLoginView(!isLoginView);
      setError(null);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-sm p-8 animate-fade-in relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary"><XMarkIcon className="w-5 h-5" /></button>
        
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-accent-gradient bg-clip-text text-transparent">SceneIt</h1>
        </div>

        <div className="bg-card-gradient rounded-xl p-6">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-6">{isLoginView ? 'Welcome Back' : 'Create Account'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-400 text-sm text-center bg-red-500/20 p-3 rounded-lg">{error}</p>}
            {!isLoginView && (
              <InputField type="text" placeholder="Username" value={username} onChange={setUsername} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5a5.5 5.5 0 0 1 5.5 5.5c0 1.57-.67 3-1.69 3.96-1.01.96-2.43 1.54-3.81 1.54s-2.8-.58-3.81-1.54C7.17 11 6.5 9.57 6.5 8a5.5 5.5 0 0 1 5.5-5.5zM12 15c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z"></path></svg>} />
            )}
            <InputField type="email" placeholder="Email" value={email} onChange={setEmail} icon={<EnvelopeIcon />} />
            <InputField type="password" placeholder="Password" value={password} onChange={setPassword} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"></path></svg>} />
            {!isLoginView && (
              <InputField type="password" placeholder="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"></path></svg>} />
            )}

            {isLoginView && (
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-bg-secondary text-primary-accent focus:ring-primary-accent"
                  />
                  <span className="ml-2">Remember me</span>
                </label>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-3 mt-4 rounded-lg bg-accent-gradient text-on-accent font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Loading...' : (isLoginView ? 'Log In' : 'Sign Up')}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-text-secondary mt-6">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}
          <button onClick={handleSwitchView} className="font-semibold text-primary-accent hover:underline ml-2">
            {isLoginView ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
