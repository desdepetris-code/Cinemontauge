import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="space-y-8 text-text-primary/90 leading-relaxed overflow-y-auto max-h-full pr-4 custom-scrollbar">
      <header className="mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Terms of Service</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Last updated: {new Date().toLocaleDateString()}</p>
      </header>

      <p className="text-sm font-medium">Welcome to SceneIt ("the Service"). By accessing our registry, you agree to these terms. Please read them carefully to understand your rights and responsibilities.</p>
      
      <section>
        <h2 className="text-lg font-black uppercase tracking-widest text-primary-accent mb-3">1. Identity & Eligibility</h2>
        <p className="text-sm">You must be at least 13 years of age to initialize a personal registry account. By using SceneIt, you represent and warrant that you meet this requirement and possess the legal authority to enter into this agreement.</p>
      </section>

      <section>
        <h2 className="text-lg font-black uppercase tracking-widest text-primary-accent mb-3">2. Registry Accounts</h2>
        <p className="text-sm">When you create a SceneIt account, your data is synchronized to our secure cloud registry. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account.</p>
      </section>

      <section>
        <h2 className="text-lg font-black uppercase tracking-widest text-primary-accent mb-3">3. Prohibited Conduct</h2>
        <p className="text-sm mb-3">You agree NOT to use SceneIt to:</p>
        <ul className="list-disc ml-6 space-y-2 text-sm opacity-80">
          <li>Upload, link to, or distribute unlawful, harmful, or objectionable content.</li>
          <li>Infringe on third-party intellectual property or privacy rights.</li>
          <li><strong className="text-white">Strictly prohibited: Hosting, streaming, or providing magnet/download links to copyrighted material.</strong> Our service is a tracking ledger and personal journaling tool, not a media distribution hub.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black uppercase tracking-widest text-primary-accent mb-3">4. Data Attribution & APIs</h2>
        <p className="text-sm mb-4">SceneIt interfaces with premium third-party metadata providers to enhance your experience:</p>
        <div className="space-y-4">
            <div className="p-5 bg-bg-secondary/40 rounded-[2rem] border border-white/5 shadow-inner">
                <h3 className="text-xs font-black uppercase tracking-widest text-white mb-2">The Movie Database (TMDb)</h3>
                <p className="text-xs opacity-70 leading-relaxed">SceneIt serves as a client for TMDb, providing access to titles, synopses, posters, and cast data. This product uses the TMDb API but is not endorsed or certified by TMDb.</p>
            </div>
            <div className="p-5 bg-bg-secondary/40 rounded-[2rem] border border-white/5 shadow-inner">
                <h3 className="text-xs font-black uppercase tracking-widest text-white mb-2">Trakt.tv Integration</h3>
                <p className="text-xs opacity-70 leading-relaxed">Optional one-way history imports are facilitated via Trakt.tv. We respect your external privacy and do not export your SceneIt logs back to Trakt without explicit user action.</p>
            </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-black uppercase tracking-widest text-primary-accent mb-3">5. Intellectual Property & DMCA</h2>
        <p className="text-sm">We respect the intellectual property of creators. If you believe your work has been utilized in a way that constitutes copyright infringement, please contact our designated DMCA agent at <span className="text-primary-accent font-bold">sceneit623@gmail.com</span>.</p>
      </section>

      <section>
        <h2 className="text-lg font-black uppercase tracking-widest text-primary-accent mb-3">6. The Cloud Registry</h2>
        <p className="text-sm">Authenticated users benefit from the **SceneIt Cloud Registry**, powered by Supabase. This system handles secure backups of your watch history, custom image uploads, social interactions, and cross-device synchronization.</p>
      </section>

      <section>
        <h2 className="text-lg font-black uppercase tracking-widest text-primary-accent mb-3">7. Disclaimers & Liability</h2>
        <p className="text-sm italic opacity-60 font-medium">SceneIt is provided "AS IS" and "AS AVAILABLE". We do not warrant that the service will be uninterrupted, secure, or error-free. Data loss for guest users (due to browser cache clearing) is not the responsibility of SceneIt.</p>
      </section>
    </div>
  );
};

export default TermsOfService;