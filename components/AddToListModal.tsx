import React, { useState } from 'react';
import { TmdbMedia, CustomList, CustomListItem, TrackedItem, WatchStatus } from '../types';
import { ChevronRightIcon, XMarkIcon, CheckCircleIcon, PlusIcon, ListBulletIcon } from './Icons';

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToAdd: TmdbMedia | TrackedItem | null;
  customLists: CustomList[];
  onAddToList: (listId: string, item: CustomListItem) => void;
  onCreateAndAddToList: (listName: string, item: CustomListItem) => void;
  onGoToDetails: (id: number, media_type: 'tv' | 'movie') => void;
  onUpdateLists: (item: TrackedItem, oldStatus: WatchStatus | null, newStatus: WatchStatus | null) => void;
  activeStandardStatus?: WatchStatus | null;
}

const AddToListModal: React.FC<AddToListModalProps> = ({ isOpen, onClose, itemToAdd, customLists, onAddToList, onCreateAndAddToList, onGoToDetails }) => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [newListName, setNewListName] = useState('');

    if (!isOpen || !itemToAdd) return null;

    const resetAndClose = () => {
        setView('list');
        setNewListName('');
        onClose();
    };
    
    const trackedItem: TrackedItem = {
        id: itemToAdd.id,
        title: itemToAdd.title || (itemToAdd as TmdbMedia).name || 'Untitled',
        media_type: itemToAdd.media_type,
        poster_path: itemToAdd.poster_path,
        genre_ids: itemToAdd.genre_ids,
    };

    const handleAdd = (listId: string) => {
        onAddToList(listId, trackedItem as CustomListItem);
        resetAndClose();
    };

    const handleCreate = () => {
        if (!newListName.trim()) {
            alert("Please enter a list name.");
            return;
        }
        onCreateAndAddToList(newListName.trim(), trackedItem as CustomListItem);
        resetAndClose();
    };
    
    const handleGoToDetailsClick = () => {
        onGoToDetails(itemToAdd.id, itemToAdd.media_type);
        resetAndClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[110] p-4" onClick={resetAndClose}>
            <div className="bg-bg-primary rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-fade-in relative border border-white/10 flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={resetAndClose} className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
                    <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter mb-1">Add to List</h2>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60 truncate">Organize into your collections</p>
                </div>

                <button
                    onClick={handleGoToDetailsClick}
                    className="w-full flex items-center justify-between p-4 mb-6 rounded-2xl bg-bg-secondary/40 border border-white/5 hover:border-white/10 transition-all group shadow-inner"
                >
                    <span className="text-xs font-black uppercase tracking-widest text-text-primary group-hover:text-primary-accent transition-colors">Go to Details</span>
                    <ChevronRightIcon className="w-5 h-5 text-text-secondary group-hover:text-primary-accent transition-all" />
                </button>

                {view === 'list' ? (
                    <>
                        <div className="flex-grow space-y-2 mb-6 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                            {customLists.length > 0 ? (
                                customLists.map(list => {
                                    const isAlreadyInList = list.items.some(i => i.id === itemToAdd.id);
                                    return (
                                        <button
                                            key={list.id}
                                            onClick={() => handleAdd(list.id)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                                isAlreadyInList 
                                                    ? 'bg-primary-accent/10 border-primary-accent shadow-md' 
                                                    : 'bg-bg-secondary/20 border-white/5 text-text-primary hover:bg-bg-secondary'
                                            }`}
                                        >
                                            <span className={`text-xs font-bold uppercase tracking-tight ${isAlreadyInList ? 'text-primary-accent' : 'text-text-primary'}`}>{list.name}</span>
                                            {isAlreadyInList && <CheckCircleIcon className="w-5 h-5 text-primary-accent" />}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 opacity-40">
                                    <ListBulletIcon className="w-10 h-10 mx-auto mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No custom lists created yet.</p>
                                </div>
                            )}
                        </div>
                        
                        <button
                            onClick={() => setView('create')}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent-gradient text-on-accent font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity shadow-xl"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Create New Collection
                        </button>
                    </>
                ) : (
                    <div className="animate-fade-in">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-3 block">New Collection Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Oscar Winners..."
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            className="w-full p-4 bg-bg-secondary rounded-2xl text-text-primary focus:outline-none border border-white/10 shadow-inner mb-6 font-bold"
                            autoFocus
                        />
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={handleCreate} 
                                className="w-full py-4 rounded-2xl bg-accent-gradient text-on-accent font-black uppercase tracking-widest text-xs hover:opacity-90 shadow-xl"
                            >
                                Confirm & Create
                            </button>
                            <button 
                                onClick={() => setView('list')} 
                                className="w-full py-3 rounded-2xl text-text-secondary bg-bg-secondary font-black uppercase tracking-widest text-[10px] hover:text-text-primary transition-all"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddToListModal;