// TMDB API Key. For a production app, this should be in an environment variable.
// Attempt to use VITE_TMDB_KEY from environment, fallback to hardcoded key if not present.
export const TMDB_API_KEY = (import.meta as any).env?.VITE_TMDB_KEY || 'b7922161a07780ff1d7caf291ecfa9ec';
export const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

/**
 * TRAKT CONFIGURATION
 * Link: https://trakt.tv/oauth/applications
 */
export const TRAKT_API_KEY = 'c0c359a34e4183d11f1b744d6d06ab156dc039acf4a31671fec7c20713675b59'; 
export const TRAKT_API_BASE_URL = 'https://api.trakt.tv';
export const TRAKT_REDIRECT_URI = 'https://cinemontauge-beta.vercel.app/auth/trakt/callback';

export const MAL_CLIENT_ID = 'a755b330561e298533c7c251d7cde369';
export const MAL_API_BASE_URL = 'https://api.myanimelist.net/v2';
export const MAL_AUTH_BASE_URL = 'https://myanimelist.net/v1/oauth2/authorize';
export const MAL_TOKEN_URL = 'https://myanimelist.net/v1/oauth2/token';
export const MAL_REDIRECT_URI = window.location.origin + window.location.pathname;

// --- Branded B&W SVG Placeholders ---
const logoSvgPart = `
  <defs>
    <linearGradient id="p-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#444" />
      <stop offset="100%" stop-color="#111" />
    </linearGradient>
    <linearGradient id="p-grad-text" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#888" />
      <stop offset="100%" stop-color="#444" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="#080808" stroke="#111" stroke-width="0.5" />
  <path d="M50 2L58 20H42L50 2Z" fill="#333" />
  <path d="M98 50L80 58V42L98 50Z" fill="#222" />
  <path d="M50 98L42 80H58L50 98Z" fill="#222" />
  <path d="M2 50L20 42V58L2 50Z" fill="#222" />
  <circle cx="50" cy="50" r="37" fill="black" stroke="url(#p-grad-main)" stroke-width="2" />
  <path d="M50 18L51.5 22.5H56L52.5 25L54 29.5L50 27L46 29.5L47.5 25L44 22.5H48.5L50 18Z" fill="#333" />
  <text x="50" y="52" font-family="Arial Black, sans-serif" font-size="24" font-weight="900" fill="url(#p-grad-text)" text-anchor="middle" letter-spacing="-1">SI</text>
  <text x="50" y="68" font-family="Arial Black, sans-serif" font-size="5" font-weight="900" fill="#333" text-anchor="middle" letter-spacing="1.2">SceneIt</text>
`;

const posterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 100 150" fill="none">
  <rect width="100" height="150" fill="#0a0a0a" />
  <g transform="translate(0 25)">
    ${logoSvgPart}
  </g>
</svg>`;

const backdropSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 160 90" fill="none">
  <rect width="160" height="90" fill="#0a0a0a" />
  <g transform="translate(42.5 7.5) scale(0.75)">
    ${logoSvgPart}
  </g>
</svg>`;

const profileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" fill="#0a0a0a" />
  <g transform="scale(1.0)">
    ${logoSvgPart}
  </g>
</svg>`;

export const PLACEHOLDER_POSTER = `data:image/svg+xml;base64,${btoa(posterSvg)}`;
export const PLACEHOLDER_POSTER_SMALL = PLACEHOLDER_POSTER;
export const PLACEHOLDER_BACKDROP = `data:image/svg+xml;base64,${btoa(backdropSvg)}`;
export const PLACEHOLDER_BACKDROP_LARGE = PLACEHOLDER_BACKDROP;
export const PLACEHOLDER_STILL = PLACEHOLDER_BACKDROP;
export const PLACEHOLDER_PROFILE = `data:image/svg+xml;base64,${btoa(profileSvg)}`;