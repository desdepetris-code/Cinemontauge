import { GoogleGenAI, Type } from "@google/genai";
import { UserData, TmdbMedia } from "../types";
import { searchMedia } from "./tmdbService";

// Initialize the Gemini API client using the environment variable API_KEY as per coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates personalized movie and TV show recommendations using Gemini 3.
 * It uses the user's recent history and favorites to provide relevant suggestions.
 */
export const getAIRecommendations = async (userData: UserData): Promise<{ recommendation: any; media: TmdbMedia }[]> => {
  // Extract recent user activity for context.
  const historyText = userData.history.slice(0, 15).map(h => `${h.title} (${h.media_type})`).join(", ");
  const favoritesText = userData.favorites.slice(0, 10).map(f => f.title).join(", ");
  
  // Construct the prompt for the Gemini model.
  const prompt = `You are a cinematic expert. Based on my watch history: ${historyText} and my favorites: ${favoritesText}, 
  recommend 12 movies or TV shows I might enjoy. Provide your response as a JSON array of objects.
  Each object should have "title", "reason" (a brief explanation), and "mediaType" (either "movie" or "tv").
  Avoid recommending titles already in my history or favorites.`;

  try {
    // FIX: Query the Gemini 3 Flash model for recommendations following the latest SDK patterns.
    // We use gemini-3-flash-preview for basic text and reasoning tasks.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Title of the recommended item" },
              reason: { type: Type.STRING, description: "Why this fits the user's taste" },
              mediaType: { type: Type.STRING, description: "Either 'movie' or 'tv'" },
            },
            required: ["title", "reason", "mediaType"],
          },
        },
      },
    });

    // FIX: Extract generated text from the response using the .text property (not a method).
    const jsonStr = response.text || "[]";
    const recommendedList = JSON.parse(jsonStr);

    // For each recommendation, search the TMDB API to get valid media metadata.
    const enrichedResults = await Promise.all(
      recommendedList.map(async (rec: any) => {
        try {
          // Attempt to find the specific media item on TMDB.
          const searchResults = await searchMedia(rec.title);
          // Look for a match that respects the intended media type (movie or tv).
          const match = searchResults.find(m => m.media_type === rec.mediaType) || searchResults[0];
          if (match) {
            return { recommendation: rec, media: match };
          }
        } catch (err) {
          console.error(`Gemini Recs: Search failed for "${rec.title}"`, err);
        }
        return null;
      })
    );

    // Return the successfully matched recommendations, filtering out any null search results.
    return enrichedResults.filter((r): r is { recommendation: any; media: TmdbMedia } => r !== null);
  } catch (error) {
    console.error("Gemini Recs: Failed to generate recommendations", error);
    throw new Error("I couldn't fetch recommendations right now. Please try again later.");
  }
};
