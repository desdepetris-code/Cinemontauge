import React, { useState } from 'react';
import { SparklesIcon } from './Icons';
import Logo from './Logo';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onComplete: (data: { username: string; password: string }) => Promise<string | null>;
}

const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ isOpen, onComplete }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await onComplete({ username, password });
    if (result) {
      setError(result);
      setLoading(false);
    }
  };

  const inputClass = "w-full p-4 bg-bg-secondary rounded-2xl text-text-primary placeholder-text-secondary/50 focus:outline-none border border-white/10 focus:border-primary-accent transition-all font-bold shadow-inner mb-4";

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-bg-primary rounded-[3rem] shadow-2xl w-full max-w-md p-10 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent-gradient"></div>
        
        <div className="text-center mb-8">
            <Logo className="w-16 h-16 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.5)]" />
            <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter leading-none mb-2">Almost There!</h2>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest opacity-60">Complete your CineMontauge Registry</p>
        </div>

        <div className="bg-primary-accent/5 rounded-2xl p-4 mb-8 border border-primary-accent/10">
            <p className="text-[10px] text-text-secondary leading-relaxed font-medium text-center italic">
                Choose a unique handle and set a password. This lets you log in via Google OR Email in the future.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="animate-slide-in-up">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-xs font-bold text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-2 mb-1 block">Unique Username</label>
            <input
              type="text"
              placeholder="cinemaster_99"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className={inputClass}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-2 mb-1 block">Master Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-2 mb-1 block">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>

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
                Establish Identity
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-[8px] font-black text-text-secondary/30 uppercase tracking-[0.3em] text-center">
            Secured by Supabase Auth Registry
        </p>
      </div>
    </div>
  );
};

export default CompleteProfileModal;