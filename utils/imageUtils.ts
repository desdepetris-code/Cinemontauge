import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER, PLACEHOLDER_BACKDROP, PLACEHOLDER_STILL } from '../constants';

export const getImageUrl = (
    path: string | null | undefined, 
    size: string = 'w342',
    type: 'poster' | 'backdrop' | 'still' = 'poster'
) => {
    const placeholder = type === 'poster' ? PLACEHOLDER_POSTER : type === 'backdrop' ? PLACEHOLDER_BACKDROP : PLACEHOLDER_STILL;
    if (!path) {
        return placeholder;
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};