import React, { useState, useEffect } from 'react';
import { JournalEntry } from '../types';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: JournalEntry) => void;
  existingEntry: JournalEntry | null;
  episodeName: string;
}

const moods = ['😊', '😂', '😍', '😢', '🤯', '🤔', '😠'];

const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose, onSave, existingEntry, episodeName }) => {
  const [text, setText] = useState('');
  const [mood, setMood] = useState('😊');

  useEffect(() => {
    if (existingEntry) {
      setText(existingEntry.text);
      setMood(existingEntry.mood);
    } else {
      setText('');
      setMood('😊');
    }
  }, [existingEntry, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ text, mood, timestamp: new Date().toISOString() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card-gradient rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-text-primary mb-2">My Journal</h2>
        <p className="text-text-secondary mb-4">{episodeName}</p>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="How did this episode make you feel?"
          className="w-full h-40 p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
        />

        <div className="my-4">
          <label className="block text-sm font-medium text-text-secondary mb-2">Mood:</label>
          <div className="flex space-x-2">
            {moods.map(m => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`text-2xl p-2 rounded-full transition-transform transform hover:scale-110 ${mood === m ? 'bg-primary-accent/20' : 'bg-transparent'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalModal;