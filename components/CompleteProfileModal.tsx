import React, { useState, useEffect } from 'react';
import { SparklesIcon, LockClosedIcon, UserIcon, CheckCircleIcon, EnvelopeIcon } from './Icons';
import Logo from './Logo';

interface CompleteProfileModalProps {
  isOpen: boolean;
  missingUsername: boolean;
  missingPassword: boolean;
  missingEmail: boolean;
  onComplete: (data: { username?: string; password?: string; email?: string }) => Promise<string | null>;
}

const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ isOpen, missingUsername, missingPassword, missingEmail, onComplete }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateUsername = (val: string) => {
    const regex = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':",.<>/?]+$/;
    return regex.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: { username?: string; password?: string; email?: string } = {};

    if (missingUsername) {
      if (username.length < 3) {
        setError("Username must be at least 3 characters.");
        return;
      }
      if (!validateUsername(username)) {
        setError("Username contains invalid characters.");
        return;
      }
      payload.username = username;
    }

    if (missingEmail) {
      if (!email.includes('@')) {
        setError("Please enter a valid email address.");
        return;
      }
      payload.email = email;
    }

    if (missingPassword) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      payload.password = password;
    }

    setLoading(true);
    const result = await onComplete(payload);
    if (result) {
      setError(result);
      setLoading(false);
    }
  };

  const inputClass = "w-full p-4 pl-12 bg-bg-secondary rounded-2xl text-text-primary placeholder-text-secondary/50 focus:outline-none border border-white/10 focus:border-primary-accent transition-all font-bold shadow-inner mb-4";

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-bg-primary rounded-[3rem] shadow-2xl w-full max-w-md p-10 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent-gradient"></div>
        
        <div className="text-center mb-8">
            <Logo className="w-16 h-16 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.5)]" />
            <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter leading-none mb-2">Finish sign up</h2>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest opacity-60">Finish setting up your account</p>
        </div>

        <div className="bg-primary-accent/5 rounded-2xl p-4 mb-8 border border-primary-accent/10">
            <p className="text-[10px] text-text-secondary leading-relaxed font-medium text-center italic">
                Choose a unique handle to identify yourself as on CineMontauge.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="animate-slide-in-up">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-xs font-bold text-red-400">{error}</p>
            </div>
          )}

          {missingUsername && (
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-2 mb-1 block">Enter a username</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="CinemaFanatic123"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                  className={inputClass}
                  required
                />
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 -mt-2 w-5 h-5 text-text-secondary/50" />
              </div>
            </div>
          )}

          {missingEmail && (
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-2 mb-1 block">add an email below:</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 -mt-2 w-5 h-5 text-text-secondary/50" />
              </div>
            </div>
          )}

          {missingPassword && (
            <>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-2 mb-1 block">Create password:</label>
                <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={inputClass}
                      required
                    />
                    <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 -mt-2 w-5 h-5 text-text-secondary/50" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-2 mb-1 block">Confirm password:</label>
                <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={inputClass}
                      required
                    />
                    <CheckCircleIcon className="absolute left-4 top-1/2 -translate-y-1/2 -mt-2 w-5 h-5 text-text-secondary/50" />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 mt-4 rounded-[1.5rem] bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-xs shadow-2xl transform transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Finish sign up
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-[8px] font-black text-text-secondary/30 uppercase tracking-[0.3em] text-center">
            Registry Verification v3.2
        </p>
      </div>
    </div>
  );
};

export default CompleteProfileModal;