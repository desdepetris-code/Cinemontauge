import React, { useMemo } from 'react';
import { TrackedItem, CustomList, ListVisibility } from '../../types';
import { getImageUrl } from '../../utils/imageUtils';
import { GlobeAltIcon, UsersIcon, LockClosedIcon } from '../Icons';

interface ListsWidgetProps {
    watching: TrackedItem[];
    planToWatch: TrackedItem[];
    customLists?: CustomList[];
    isOwnProfile?: boolean;
    isFollower?: boolean;
    onNavigate: () => void;
}

const ListPreview: React.FC<{ title: string; items: TrackedItem[]; visibility?: ListVisibility }> = ({ title, items, visibility }) => {
    const icon = useMemo(() => {
        if (!visibility) return null;
        if (visibility === 'public') return <GlobeAltIcon className="w-3 h-3 text-sky-400" />;
        if (visibility === 'followers') return <UsersIcon className="w-3 h-3 text-amber-400" />;
        if (visibility === 'private') return <LockClosedIcon className="w-3 h-3 text-text-secondary" />;
        return null;
    }, [visibility]);

    return (
        <div className="group/item cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <h4 className="text-[11px] font-black uppercase tracking-widest text-text-primary truncate">{title} ({items.length})</h4>
            </div>
            <div className="flex -space-x-3 mt-1 px-1">
                {items.length > 0 ? items.slice(0, 5).map((item, index) => (
                    <img 
                        key={`${item.id}-${index}`}
                        src={getImageUrl(item.poster_path, 'w92')}
                        alt={item.title}
                        className="w-10 h-14 object-cover rounded-lg border-2 border-bg-primary bg-bg-secondary shadow-md transition-transform group-hover/item:scale-105"
                        style={{ zIndex: 5 - index }}
                    />
                )) : (
                    <div className="w-10 h-14 rounded-lg border-2 border-dashed border-white/5 flex items-center justify-center bg-bg-secondary/20">
                        <span className="text-[8px] font-black opacity-20">EMPTY</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const ListsWidget: React.FC<ListsWidgetProps> = ({ watching, planToWatch, customLists = [], isOwnProfile = true, isFollower = false, onNavigate }) => {
    
    const visibleCustomLists = useMemo(() => {
        return customLists.filter(list => {
            if (isOwnProfile) return list.visibility !== 'private'; // Private lists stay in their own tab per req
            if (isFollower) return list.visibility === 'public' || list.visibility === 'followers';
            return list.visibility === 'public';
        });
    }, [customLists, isOwnProfile, isFollower]);

    return (
        <div className="bg-card-gradient rounded-[1.5rem] shadow-xl p-6 border border-white/5">
            <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-6">Collections</h3>
            <div className="space-y-8">
                <ListPreview title="Currently Watching" items={watching} />
                <ListPreview title="Plan to Watch" items={planToWatch} />
                {visibleCustomLists.map(list => (
                    <ListPreview key={list.id} title={list.name} items={list.items} visibility={list.visibility} />
                ))}
            </div>
            <button 
                onClick={onNavigate} 
                className="w-full mt-8 py-3 rounded-xl bg-bg-secondary/40 text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent hover:bg-bg-secondary transition-all"
            >
                {isOwnProfile ? 'Manage All Lists' : 'View Library'}
            </button>
        </div>
    );
};

export default ListsWidget;