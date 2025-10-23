import React from 'react';

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">{children}</h2>;
const P: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="text-text-secondary mb-4">{children}</p>;
const LI: React.FC<{ children: React.ReactNode }> = ({ children }) => <li className="text-text-secondary ml-6 mb-2 list-disc">{children}</li>;
const Strong: React.FC<{ children: React.ReactNode }> = ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>;

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="prose-styles">
      <h1 className="text-3xl font-bold text-text-primary mb-4">Privacy Policy</h1>
      <P>Last updated: {new Date().toLocaleDateString()}</P>

      <P>Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.</P>

      <H2>1. Information We Collect</H2>
      <P>We collect information to provide and improve our service. This includes:</P>
      <ul>
        <LI><Strong>Data You Provide:</Strong> This includes journal entries, mood selections, and any information submitted through feedback forms.</LI>
        <LI><Strong>Usage Data:</Strong> We automatically collect data on your interactions with the app, such as which shows you track, your watch progress (which episodes you mark as watched), and your watch history. This data is stored locally on your device.</LI>
        <LI><Strong>Technical Data:</Strong> We may collect anonymous data about your device and app usage to help us identify bugs and improve performance.</LI>
      </ul>

      <H2>2. How We Use Your Information</H2>
      <P>We use the information we collect to:</P>
      <ul>
        <LI>Provide, maintain, and improve the SceneIt app.</LI>
        <LI>Personalize your experience, such as showing your watch progress.</LI>
        <LI>Calculate statistics for your profile and for achievements.</LI>
        <LI>Respond to your support requests and feedback.</LI>
        <LI>Ensure the security and stability of our service.</LI>
      </ul>
      
      <H2>3. Data Storage and Security</H2>
      <P>All of your personal tracking data, including your watch lists, progress, history, and journal entries, is stored <Strong>locally on your device's browser storage</Strong>. It is not transmitted to our servers unless you choose to use a future cloud sync feature.</P>
      <P>We take reasonable measures to protect your information, but no security system is impenetrable. The security of your data depends on you keeping your device secure.</P>

      <H2>4. Data Sharing</H2>
      <P>We do not sell, trade, or rent your personal data to third parties. As data is stored locally, we do not have access to it. If we introduce features that require data sharing (like cloud sync), we will update this policy and request your consent.</P>

      <H2>5. Your Control Over Your Data</H2>
      <P>Because your data is stored locally, you have full control over it. You can clear your data at any time through the Settings page or by clearing your browser's site data for our app. The "Export Data" feature allows you to create a backup of your information.</P>
      
      <H2>6. Changes to This Policy</H2>
      <P>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy within the app.</P>

      <H2>7. Contact Us</H2>
      <P>If you have any questions about this Privacy Policy, please contact us using the feedback form in the Settings menu.</P>
    </div>
  );
};

export default PrivacyPolicy;