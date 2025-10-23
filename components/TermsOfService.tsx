import React from 'react';

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">{children}</h2>;
const P: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="text-text-secondary mb-4">{children}</p>;
const LI: React.FC<{ children: React.ReactNode }> = ({ children }) => <li className="text-text-secondary ml-6 mb-2 list-disc">{children}</li>;
const Strong: React.FC<{ children: React.ReactNode }> = ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>;

const TermsOfService: React.FC = () => {
  return (
    <div className="prose-styles">
      <h1 className="text-3xl font-bold text-text-primary mb-4">Terms of Service</h1>
      <P>Last updated: {new Date().toLocaleDateString()}</P>

      <P>Welcome to SceneIt. By using our application, you agree to these terms. Please read them carefully.</P>

      <H2>1. User Conduct</H2>
      <P>You agree not to use SceneIt to:</P>
      <ul>
        <LI>Upload, post, or link to any content that is unlawful, harmful, threatening, abusive, defamatory, or otherwise objectionable.</LI>
        <LI>Infringe on any third party's intellectual property rights, including copyright, trademark, or patent.</LI>
        <LI><Strong>Strictly prohibit hosting, streaming, or providing download/magnet links to copyrighted material for which you do not own the rights.</Strong> Our service is for personal tracking and journaling, not for distributing content.</LI>
        <LI>Attempt to disrupt or interfere with our servers or networks.</LI>
      </ul>

      <H2>2. Intellectual Property & DMCA Policy</H2>
      <P>SceneIt respects the intellectual property rights of others and expects its users to do the same. We comply with the Digital Millennium Copyright Act (DMCA).</P>
      <P>All metadata, posters, and backdrops are provided by The Movie Database (TMDB) and are used in accordance with their terms of service. SceneIt does not host or store any copyrighted video or audio content.</P>
      
      <h3 className="text-xl font-bold text-text-primary mt-4 mb-2">DMCA Takedown Notice Procedure</h3>
      <P>If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement and is accessible via the Service, please notify SceneIt's copyright agent. For your complaint to be valid under the DMCA, you must provide the following information in writing:</P>
      <ol className="list-decimal ml-6 space-y-2 text-text-secondary">
          <li>An electronic or physical signature of a person authorized to act on behalf of the copyright owner.</li>
          <li>Identification of the copyrighted work that you claim has been infringed.</li>
          <li>Identification of the material that is claimed to be infringing and where it is located on the Service.</li>
          <li>Information reasonably sufficient to permit SceneIt to contact you, such as your address, telephone number, and e-mail address.</li>
          <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or law.</li>
          <li>A statement, made under penalty of perjury, that the above information is accurate, and that you are the copyright owner or are authorized to act on behalf of the owner.</li>
      </ol>
      <P>The above information must be submitted to our designated DMCA Agent:</P>
      <div className="p-4 bg-bg-secondary rounded-lg">
        <p className="text-text-primary font-semibold">SceneIt DMCA Agent</p>
        <p className="text-text-secondary">Email: <a href="mailto:sceneit.dmca.agent@example.com" className="text-primary-accent underline">sceneit.dmca.agent@example.com</a></p>
        <p className="text-xs text-text-secondary mt-2">(This email is for DMCA notices only. For general support, please use the feedback form in Settings.)</p>
      </div>

      <H2>3. User-Generated Content</H2>
      <P>If you post content (such as journal entries or custom images), you grant SceneIt a license to use it in connection with operating the service. You are solely responsible for the content you post and must ensure you have the rights to use it. We do not permit uploading video or audio files.</P>
      
      <H2>4. Disclaimers and Limitation of Liability</H2>
      <P>SceneIt is provided "as is" without any warranties. We are not liable for any damages arising from your use of the app.</P>
      
      <H2>5. Changes to Terms</H2>
      <P>We may modify these terms at any time. We will notify you of any changes by posting the new Terms of Service in the app.</P>
    </div>
  );
};

export default TermsOfService;