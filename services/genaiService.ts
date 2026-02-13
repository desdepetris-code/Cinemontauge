import { GoogleGenAI } from "@google/genai";
import { TmdbMedia } from "../types";
import { getTrending } from "./tmdbService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIRecommendations = async (historyTitles: string[]): Promise<{ recommendation: any; media: TmdbMedia }[]> => {
  try {
    const [movies, tv] = await Promise.all([
      getTrending('movie'),
      getTrending('tv')
    ]);
    
    const combined = [...movies, ...tv]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 15);

    const historyContext = historyTitles.length > 0 ? `based on my history of: ${historyTitles.slice(0, 5).join(', ')}` : 'based on current trends';

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a cinematic expert for the app CineMontauge. Recommend why a user might like these specific titles ${historyContext}. 
      
      Titles to evaluate: ${combined.map(m => m.title || m.name).join(', ')}
      
      Return a JSON array of objects with "title" and "reason" (short, punchy cinematic reason).`,
      config: {
          responseMimeType: "application/json"
      }
    });

    const aiResults = JSON.parse(response.text || '[]');
    
    return combined.map(media => {
      const match = aiResults.find((r: any) => r.title === (media.title || media.name));
      return {
        recommendation: { reason: match?.reason || "Highly rated in the registry." },
        media
      };
    });
  } catch (error) {
    console.error("Gemini Registry Error:", error);
    // Fallback to standard trending if AI fails
    const trending = await getTrending('movie');
    return trending.slice(0, 10).map(m => ({ recommendation: { reason: "Currently trending worldwide." }, media: m }));
  }
};