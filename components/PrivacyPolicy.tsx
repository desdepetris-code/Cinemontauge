import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="space-y-8 text-text-primary/90 leading-relaxed overflow-y-auto max-h-full pr-4 custom-scrollbar">
      <header className="mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Privacy Policy</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Last updated: {new Date().toLocaleDateString()}</p>
      </header>

      <p className="text-sm font-medium">Your privacy is paramount. This policy details how CineMontauge manages your cinematic data and personal identifiers.</p>

      <section>
        <h2 className="text-lg font-black uppercase tracking-widest text-primary-accent mb-3">1. Data Collection</h2>
        <ul className="list-disc ml-6 space-y-3 text-sm opacity-80">
          <li><strong className="text-white">Identity Log:</strong> We store your username, email address, and encrypted authentication tokens for Registry accounts.</li>
          <li><strong className="text-white">Archive Metadata:</strong> Your watch history, progress, ratings, and custom list configurations are tracked to provide the core experience.</li>
          <li><strong className="text-white">Personalized Assets:</strong> Any custom images, avatars, or backdrops you upload are stored securely in our Cloud Storage.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black uppercase tracking-widest text-primary-accent mb-3">2. Utilization of Data</h2>
        <p className="text-sm">Data is used strictly to power the CineMontauge experience: visualizing your progress, calculating personalized stats, facilitating social interactions, and ensuring your library follows you across devices.</p>
      </section>

      <section>
        <h2 className="text-lg font-black uppercase tracking-widest text-primary-accent mb-3">3. Storage & Infrastructure</h2>
        <p className="text-sm mb-3">We utilize a multi-layered storage approach:</p>
        <ul className="list-disc ml-6 space-y-3 text-sm opacity-80">
          <li><strong className="text-white">Local Cache:</strong> Immediate storage for rapid UI performance.</li>
          <li><strong className="text-white">Cloud Registry:</strong> For authenticated users, data is synced to our secure Supabase-powered infrastructure. This ensures data persistence even if local storage is cleared.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black uppercase tracking-widest text-primary-accent mb-3">4. Third-Party Data Exchange</h2>
        <p className="text-sm">CineMontauge does not sell user data. We interface with the following strictly for metadata purposes:</p>
        <ul className="list-disc ml-6 space-y-2 text-sm opacity-80">
          <li><span className="text-white font-bold">TMDb:</span> For title metadata (No personal user data is ever shared).</li>
          <li><span className="text-white font-bold">Trakt:</span> For optional, user-initiated history synchronization.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black uppercase tracking-widest text-primary-accent mb-3">5. Contact & Inquiries</h2>
        <p className="text-sm">Privacy-related inquiries or data deletion requests can be submitted directly to our engineering team at <span className="text-primary-accent font-bold">sceneit623@gmail.com</span>.</p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;