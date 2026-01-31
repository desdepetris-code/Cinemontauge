
import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="prose-styles">
      <h1 className="text-3xl font-bold text-text-primary mb-4">Privacy Policy</h1>
      <p className="text-text-secondary mb-4">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="text-text-secondary mb-4">Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use the SceneIt application ("the Service").</p>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">1. Information We Collect</h2>
      <p className="text-text-secondary mb-4">We collect information to provide and improve our service. This includes:</p>
      <ul>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">Account Information:</strong> If you create an account, we store the username, email, and password you provide. This information is stored locally within your browser's storage.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">Data You Provide:</strong> This includes journal entries, mood selections, custom list details, and any information submitted through feedback forms.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">Usage Data:</strong> We automatically collect data on your interactions with the app, such as which shows you track and your watch progress. This data is also stored locally on your device.</li>
      </ul>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">2. How We Use Your Information</h2>
      <p className="text-text-secondary mb-4">We use the information we collect to:</p>
      <ul>
        <li className="text-text-secondary ml-6 mb-2 list-disc">Provide, maintain, and improve the SceneIt app.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc">Personalize your experience, such as showing your watch progress and generating stats.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc">Allow you to back up and sync your data using third-party services you authorize.</li>
      </ul>
      
      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">3. Data Storage and Security</h2>
      <p className="text-text-secondary mb-4">All of your personal tracking data is stored <strong className="font-semibold text-text-primary">locally on your device's browser storage</strong>. It is not transmitted to our servers unless you explicitly choose to use a cloud sync feature.</p>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">4. Data Sharing and Third-Party Services</h2>
      <p className="text-text-secondary mb-4">We do not sell, trade, or rent your personal data to third parties. Data is only shared with third-party services when you explicitly authorize it for features like backup and import.</p>
      <ul>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">Trakt.tv:</strong> We use this for optional data import. We do not share your SceneIt data with Trakt.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">The Movie Database (TMDB):</strong> We use the TMDB API to fetch metadata. We do not send any of your personal data to TMDB.</li>
      </ul>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">5. Contact Us</h2>
      <p className="text-text-secondary mb-4">If you have any questions about this Privacy Policy, please contact us at <a href="mailto:sceneit623@gmail.com" className="text-primary-accent underline">sceneit623@gmail.com</a>.</p>
    </div>
  );
};

export default PrivacyPolicy;