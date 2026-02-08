import React from 'react';
import { XMarkIcon } from './Icons';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: string) => void;
  options: string[];
}

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose, onSelect, options }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in relative border border-white/10" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
            <XMarkIcon className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-text-primary mb-4">Report an Issue</h2>
        <div className="space-y-2">
          {options.map(option => (
            <button
              key={option}
              onClick={() => onSelect(option)}
              className="w-full text-left p-3 rounded-md bg-bg-secondary hover:brightness-125 transition-colors text-text-primary"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportIssueModal;