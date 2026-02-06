import React from 'react';
import { TrackedItem, CustomListItem } from '../types';
import CompactShowCard from './CompactShowCard';
import { TrashIcon } from './Icons';

interface ListGridProps {
    items: (TrackedItem | CustomListItem)[];
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    listId?: string;
    onRemoveItem?: (listId: string, itemId: number) => void;
    showAddedAt?: boolean;
}

const ListGrid: React.FC<ListGridProps> = ({ items, onSelect, listId, onRemoveItem, showAddedAt }) => {
    if (items.length === 0) return <p className="text-text-secondary text-center py-4">This list is empty.</p>;
    
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {items.map(item => (
                <div key={item.id} className="relative group">
                    <CompactShowCard item={item as TrackedItem} onSelect={onSelect} showAddedAt={showAddedAt} />
                    {listId && onRemoveItem && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRemoveItem(listId, item.id); }} 
                            className="absolute -top-2 -right-2 z-20 p-2.5 bg-red-600 text-white rounded-full shadow-xl hover:bg-red-500 transition-all scale-90 sm:scale-100 border-2 border-bg-primary"
                            title="Remove from list"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ListGrid;