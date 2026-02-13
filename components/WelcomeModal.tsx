import React, { useState } from 'react';
import { XMarkIcon, SearchIcon, SparklesIcon, ClockIcon, ChevronDownIcon, ChevronLeftIcon } from './Icons';
import Logo from './Logo';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  timezone: string;
  setTimezone: (timezone: string) => void;
  timeFormat: '12h' | '24h';
  setTimeFormat: (format: '12h' | '24h') => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, timezone, setTimezone, timeFormat, setTimeFormat }) => {
  const [activeSubView, setActiveSubView] = useState<'onboarding' | 'tos' | 'privacy'>('onboarding');

  if (!isOpen) return null;

  const timezones = [
      { id: 'America/New_York', name: 'Eastern Time (ET)' },
      { id: 'America/Chicago', name: 'Central Time (CT)' },
      { id: 'America/Denver', name: 'Mountain Time (MT)' },
      { id: 'America/Los_Angeles', name: 'Pacific Time (PT)' },
      { id: 'Europe/London', name: 'London (GMT/BST)' },
      { id: 'Europe/Berlin', name: 'Central Europe (CET)' },
      { id: 'Asia/Tokyo', name: 'Tokyo (JST)' },
      { id: 'Australia/Sydney', name: 'Sydney (AEST)' },
      { id: 'Etc/UTC', name: 'Coordinated Universal Time (UTC)' },
  ];

  const renderOnboarding = () => (
    <div className="animate-fade-in flex flex-col items-center">
        <Logo className="h-20 w-20 mx-auto mb-6 drop-shadow-2xl" />
        <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter mb-2 leading-none">CineMontauge</h2>
        <p className="text-sm text-text-secondary mb-10 font-medium leading-relaxed px-4 text-center">Your personal gallery of cinematic moments. Start tracking and journaling your favorite shows and movies today.</p>
        
        <div className="text-left w-full space-y-6 mb-10">
            <div className="text-left space-y-2">
                <label htmlFor="timezone-select" className="block text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 ml-1">Set Your Timeline (Timezone)</label>
                <div className="relative group">
                    <select 
                        id="timezone-select" 
                        value={timezone} 
                        onChange={e => setTimezone(e.target.value)} 
                        className="w-full p-4 bg-bg-secondary rounded-2xl text-text-primary border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-accent appearance-none text-sm font-bold shadow-md cursor-pointer group-hover:border-white/20 transition-all"
                    >
                        {timezones.map(tz => <option key={tz.id} value={tz.id}>{tz.name}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-text-secondary pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            <div className="text-left space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 ml-1">Preferred Format</label>
                <div className="flex p-1 bg-bg-secondary rounded-xl border border-white/10 shadow-md">
                    <button 
                        onClick={() => setTimeFormat('12h')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${timeFormat === '12h' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        12 Hour
                    </button>
                    <button 
                        onClick={() => setTimeFormat('24h')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${timeFormat === '24h' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        24 Hour
                    </button>
                </div>
            </div>
        </div>
        
        <button 
          onClick={onClose} 
          className="w-full px-8 py-5 rounded-3xl text-on-accent bg-accent-gradient hover:opacity-90 transition-all font-black uppercase tracking-[0.2em] text-xs shadow-2xl transform active:scale-95 flex items-center justify-center gap-2"
        >
          <SparklesIcon className="w-4 h-4" />
          Begin Your Montage
        </button>

        {/* POLICY FOOTER */}
        <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-text-primary/90 text-center px-4">By continuing, you agree to our policies:</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                <button 
                    onClick={() => setActiveSubView('tos')}
                    className="text-[10px] font-black uppercase tracking-widest text-primary-accent hover:text-primary-accent/80 hover:underline transition-all"
                >
                    Terms of Service
                </button>
                <span className="text-white/10 hidden sm:inline">•</span>
                <button 
                    onClick={() => setActiveSubView('privacy')}
                    className="text-[10px] font-black uppercase tracking-widest text-primary-accent hover:text-primary-accent/80 hover:underline transition-all"
                >
                    Privacy Policy
                </button>
            </div>
        </div>
    </div>
  );

  const renderLegal = () => (
      <div className="animate-fade-in flex flex-col h-full max-h-[70vh]">
          <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setActiveSubView('onboarding')}
                className="p-3 bg-bg-secondary rounded-2xl text-text-primary hover:text-primary-accent transition-all shadow-md"
              >
                  <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter">
                  {activeSubView === 'tos' ? 'Terms of Service' : 'Privacy Policy'}
              </h3>
          </div>
          <div className="flex-grow overflow-y-auto custom-scrollbar bg-bg-secondary/20 p-6 rounded-[2rem] border border-white/5 shadow-inner text-left">
              {activeSubView === 'tos' ? <TermsOfService /> : <PrivacyPolicy />}
          </div>
          <button 
            onClick={() => setActiveSubView('onboarding')}
            className="w-full mt-6 py-4 rounded-2xl bg-bg-secondary text-text-primary font-black uppercase tracking-widest text-[10px] hover:bg-bg-secondary/70 transition-all"
          >
              Back to Onboarding
          </button>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-scale-in relative border border-white/10 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {activeSubView === 'onboarding' ? renderOnboarding() : renderLegal()}
      </div>
    </div>
  );
};

export default WelcomeModal;