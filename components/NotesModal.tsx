import React, { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon, PencilSquareIcon } from './Icons';
import { Note } from '../types';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: Note[]) => void;
  onNoteDeleted?: (note: Note, mediaTitle: string, context: string) => void;
  mediaTitle: string;
  context?: string; // e.g. "S1 E5" or "Show Overall"
  initialNotes?: Note[];
}

const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, onSave, onNoteDeleted, mediaTitle, context = "Show Overall", initialNotes = [] }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNotes([...initialNotes].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setNewNoteText('');
    }
  }, [isOpen, initialNotes]);

  if (!isOpen) return null;

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      timestamp: new Date().toISOString(),
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setNewNoteText('');
    onSave(updatedNotes); 
  };

  const handleDeleteNote = (note: Note) => {
    const updatedNotes = notes.filter(n => n.id !== note.id);
    setNotes(updatedNotes);
    onSave(updatedNotes);
    if (onNoteDeleted) {
        onNoteDeleted(note, mediaTitle, context);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-lg h-[80vh] flex flex-col p-8 animate-fade-in relative border border-white/10" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
            <XMarkIcon className="w-5 h-5" />
        </button>
        <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter mb-1">Vault Notes</h2>
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60 truncate mb-6">{mediaTitle} &bull; {context}</p>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-6 custom-scrollbar">
            {notes.length > 0 ? notes.map(note => (
                <div key={note.id} className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-2xl -rotate-1 transform border border-yellow-300/30 dark:border-yellow-500/20 group relative transition-all hover:rotate-0">
                    <div className="flex justify-between items-start">
                        <p className="text-yellow-900 dark:text-yellow-100 whitespace-pre-wrap text-sm leading-relaxed font-medium flex-grow pr-6">{note.text}</p>
                        <button 
                            onClick={() => handleDeleteNote(note)} 
                            className="absolute top-4 right-4 p-1.5 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-500/20" 
                            title="Delete Note"
                        >
                            <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <p className="text-[9px] font-black text-yellow-700/60 dark:text-yellow-500/40 uppercase tracking-widest mt-4 text-right">Captured {new Date(note.timestamp).toLocaleDateString()}</p>
                </div>
            )) : (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                    <PencilSquareIcon className="w-12 h-12 mb-2" />
                    <p className="text-xs font-black uppercase tracking-widest">No notes in the vault</p>
                </div>
            )}
        </div>
        
        <div className="flex-shrink-0 space-y-4 pt-4 border-t border-white/5">
            <textarea
              value={newNoteText}
              onChange={e => setNewNoteText(e.target.value)}
              placeholder="Scribble something down..."
              className="w-full h-24 p-4 bg-bg-secondary rounded-2xl text-text-primary focus:outline-none border border-white/5 shadow-inner font-bold text-sm leading-relaxed"
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl text-text-secondary bg-bg-secondary font-black uppercase tracking-widest text-[10px] hover:text-text-primary transition-all"
              >
                Close
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNoteText.trim()}
                className="flex-[2] py-4 rounded-2xl text-white bg-accent-gradient font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xl"
              >
                Archive Note
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;