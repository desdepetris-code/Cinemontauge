import React, { useState } from 'react';
import { ChevronLeftIcon, EnvelopeIcon } from '../components/Icons';
import TermsOfService from '../components/TermsOfService';
import PrivacyPolicy from '../components/PrivacyPolicy';

interface LegalProps {
  onBack: () => void;
}

type LegalTab = 'tos' | 'privacy';

const Legal: React.FC<LegalProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<LegalTab>('tos');

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 pb-20 h-full flex flex-col">
      <header className="flex items-center mb-10 relative flex-shrink-0">
        <button 
            onClick={onBack} 
            className="absolute left-0 p-4 bg-bg-secondary/60 backdrop-blur-xl rounded-2xl text-text-primary hover:text-primary-accent transition-all border border-white/10 shadow-xl group"
        >
          <ChevronLeftIcon className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="w-full text-center">
            <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter">Legal Registry</h1>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.3em] mt-1 opacity-60">Compliance & User Safety Protocols</p>
        </div>
      </header>

      <div className="flex justify-center mb-8 flex-shrink-0">
        <div className="flex p-1 bg-bg-secondary rounded-2xl border border-white/5 shadow-inner">
          <button
            onClick={() => setActiveTab('tos')}
            className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'tos' ? 'bg-accent-gradient text-on-accent shadow-lg scale-105' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'privacy' ? 'bg-accent-gradient text-on-accent shadow-lg scale-105' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Privacy Policy
          </button>
        </div>
      </div>

      <div className="flex-grow bg-card-gradient rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-white/10 overflow-hidden relative">
        <div className="absolute inset-0 bg-bg-primary/40 pointer-events-none"></div>
        <div className="relative h-full overflow-y-auto custom-scrollbar pr-4">
            {activeTab === 'tos' ? <TermsOfService /> : <PrivacyPolicy />}
        </div>
      </div>
      
      {activeTab === 'tos' && (
        <div className="mt-8 text-center flex-shrink-0">
          <a
            href="mailto:sceneit623@gmail.com?subject=CineMontauge%20DMCA%20Notice"
            className="inline-flex items-center px-10 py-4 rounded-full text-on-accent bg-accent-gradient hover:scale-105 transition-all font-black uppercase tracking-[0.2em] text-xs shadow-2xl"
          >
            <EnvelopeIcon className="w-5 h-5 mr-3" />
            Contact DMCA Agent
          </a>
        </div>
      )}
    </div>
  );
};

export default Legal;