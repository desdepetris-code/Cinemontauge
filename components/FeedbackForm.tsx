import React, { useState } from 'react';

const FeedbackForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [requestType, setRequestType] = useState('General Question');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !requestType || !subject) {
      alert('Please fill out all required fields.');
      return;
    }
    const mailtoSubject = `SceneIt: ${requestType} - ${subject}`;
    const mailtoBody = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    window.location.href = `mailto:sceneit623@gmail.com?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;
    setSubmitted(true);
    
    // Clear form for politeness, in case mailto fails or user comes back
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  if (submitted) {
    return (
      <div className="p-4 m-4 text-center dark:bg-green-500/10 bg-green-500/20 text-green-700 dark:text-green-300 rounded-lg">
        <p className="font-semibold">Your message has been sent to the SceneIt support team.</p>
        <p className="text-sm">We’ll get back to you soon!</p>
      </div>
    );
  }

  const inputClass = "w-full bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="text" placeholder="Name (Optional)" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
        <input type="email" placeholder="Email (Optional)" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
      </div>
      <div className="relative">
        <select value={requestType} onChange={e => setRequestType(e.target.value)} className={`${inputClass} appearance-none`}>
            <option>Bug Report</option>
            <option>Feature Request</option>
            <option>General Question</option>
            <option>Account Help</option>
        </select>
      </div>
      <input type="text" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} className={inputClass} required/>
      <textarea placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} className={inputClass} rows={5} required></textarea>
      <button type="submit" className="w-full py-3 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity font-semibold">
        Submit Request
      </button>
    </form>
  );
};
export default FeedbackForm;