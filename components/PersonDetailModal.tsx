import React from 'react';
import { XMarkIcon } from './Icons';
import ActorDetail from '../screens/ActorDetail';
import { UserData, UserRatings, TrackedItem } from '../types';

interface PersonDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    personId: number | null;
    userData: UserData;
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
    onToggleFavoriteShow: (item: TrackedItem) => void;
    onRateItem: (mediaId: number, rating: number) => void;
    ratings: UserRatings;
    favorites: TrackedItem[];
    onToggleWeeklyFavorite: (item: TrackedItem, replacementId?: number) => void;
    weeklyFavorites: any[];
}

const PersonDetailModal: React.FC<PersonDetailModalProps> = (props) => {
    if (!props.isOpen || props.personId === null) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150] flex items-center justify-center p-0 md:p-6 animate-fade-in pt-16 md:pt-20" onClick={props.onClose}>
            <div 
                className="bg-bg-primary w-full h-full md:max-w-7xl md:h-[90vh] md:rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col relative"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={props.onClose} 
                    className="absolute top-6 right-6 p-3 bg-backdrop/50 backdrop-blur-md rounded-full text-text-primary hover:bg-bg-secondary transition-all z-[160] shadow-xl border border-white/10"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
                
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    <ActorDetail 
                        personId={props.personId}
                        onBack={props.onClose}
                        userData={props.userData}
                        onSelectShow={(id, type) => {
                            props.onSelectShow(id, type);
                            props.onClose();
                        }}
                        onToggleFavoriteShow={props.onToggleFavoriteShow}
                        onRateItem={props.onRateItem}
                        ratings={props.ratings}
                        favorites={props.favorites}
                        onToggleWeeklyFavorite={props.onToggleWeeklyFavorite}
                        weeklyFavorites={props.weeklyFavorites}
                    />
                </div>
            </div>
        </div>
    );
};

export default PersonDetailModal;