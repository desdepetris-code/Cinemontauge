import React, { useState, useEffect, useMemo } from 'react';
import { UserData, MediaUpdate } from '../types';
import { checkForUpdates } from '../services/updateService';
import { ClockIcon, SparklesIcon, FireIcon, ChevronRightIcon, BellIcon } from '../components/Icons';
import { getImageUrl } from '../utils/imageUtils';

interface UpdatesScreenProps {
    userData: UserData;
    onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
    onAddNotifications: (notifications: any[]) => void;
}

const UpdateCard: React.FC<{ update: MediaUpdate; onClick: () => void }> = ({ update, onClick }) => {
    const icon = update.type === 'stale' ? <ClockIcon className="w-5 h-5 text-amber-400" /> : 
                 update.type === 'revival' ? <FireIcon className="w-5 h-5 text-red-500" /> : 
                 <SparklesIcon className="w-5 h-5 text-blue-400" />;

    return (
        <div 
            onClick={onClick}
            className="group flex gap-4 p-4 bg-bg-secondary/30 rounded-2xl border border-white/5 hover:border-primary-accent/30 transition-all cursor-pointer shadow-lg"
        >
            <img src={getImageUrl(update.poster_path, 'w185')} alt="" className="w-20 h-30 rounded-xl object-cover bg-bg-secondary shadow-md" />
            <div className="flex-grow flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                    {icon}
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">{update.type}</span>
                </div>
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tight group-hover:text-primary-accent transition-colors">{update.title}</h3>
                <p className="text-sm text-text-secondary mt-1 font-medium leading-relaxed">{update.description}</p>
            </div>
            <div className="flex items-center">
                <ChevronRightIcon className="w-6 h-6 text-text-secondary/20 group-hover:text-primary-accent transition-colors" />
            </div>
        </div>
    );
};

const UpdatesScreen: React.FC<UpdatesScreenProps> = ({ userData, onSelectShow, onAddNotifications }) => {
    const [updates, setUpdates] = useState<MediaUpdate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUpdates = async () => {
            setLoading(true);
            const { updates: foundUpdates, notifications } = await checkForUpdates(userData);
            setUpdates(foundUpdates);
            if (notifications.length > 0) {
                onAddNotifications(notifications);
            }
            setLoading(false);
        };
        fetchUpdates();
    }, [userData.history.length, userData.completed.length]);

    const sections = useMemo(() => {
        return {
            stale: updates.filter(u => u.type === 'stale'),
            revivals: updates.filter(u => u.type === 'revival'),
            sequels: updates.filter(u => u.type === 'sequel'),
            nostalgia: updates.filter(u => u.type === 'nostalgia_added' || u.type === 'nostalgia_released'),
        };
    }, [updates]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-bg-secondary/50 rounded-2xl"></div>
                ))}
            </div>
        );
    }

    if (updates.length === 0) {
        return (
            <div className="text-center py-20 bg-bg-secondary/10 rounded-3xl border-4 border-dashed border-white/5">
                <BellIcon className="w-16 h-16 text-text-secondary/20 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">No Current Updates</h2>
                <p className="mt-2 text-text-secondary font-medium px-10">Your library is currently up to date! Check back later for new seasons, sequels, and series activity.</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in">
            {sections.nostalgia.length > 0 && (
                <section>
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-purple-400" />
                        Registry Nostalgia
                    </h2>
                    <div className="space-y-4">
                        {sections.nostalgia.map(u => <UpdateCard key={u.id} update={u} onClick={() => onSelectShow(u.mediaId, u.mediaType)} />)}
                    </div>
                </section>
            )}

            {sections.revivals.length > 0 && (
                <section>
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                        <FireIcon className="w-6 h-6 text-red-500" />
                        Series Revivals
                    </h2>
                    <div className="space-y-4">
                        {sections.revivals.map(u => <UpdateCard key={u.id} update={u} onClick={() => onSelectShow(u.mediaId, u.mediaType)} />)}
                    </div>
                </section>
            )}

            {sections.sequels.length > 0 && (
                <section>
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-blue-400" />
                        New Installments
                    </h2>
                    <div className="space-y-4">
                        {sections.sequels.map(u => <UpdateCard key={u.id} update={u} onClick={() => onSelectShow(u.mediaId, u.mediaType)} />)}
                    </div>
                </section>
            )}

            {sections.stale.length > 0 && (
                <section>
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                        <ClockIcon className="w-6 h-6 text-amber-400" />
                        Paused Journeys
                    </h2>
                    <div className="space-y-4">
                        {sections.stale.map(u => <UpdateCard key={u.id} update={u} onClick={() => onSelectShow(u.mediaId, u.mediaType)} />)}
                    </div>
                </section>
            )}
        </div>
    );
};

export default UpdatesScreen;