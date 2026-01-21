/**
 * SceneIt Owner-Provided Airtime Overrides
 * 
 * This is the source of truth for all manual airtime entries provided via chat.
 * Format:
 * [tmdbId]: { 
 *    time: "HH:MM", // 24h format
 *    provider: "Platform Name",
 *    notes: "Optional context",
 *    episodes: {
 *       "S1E1": "HH:MM", // Override for specific episode
 *    }
 * }
 */
export const AIRTIME_OVERRIDES: Record<number, { 
    time: string; 
    provider: string; 
    notes?: string; 
    episodes?: Record<string, string>;
}> = {
    // Examples of how data would be populated from chat:
    // 1399: { time: "21:00", provider: "HBO" }, // Game of Thrones
    // 63333: { time: "03:01", provider: "Netflix" }, // Westworld
};
