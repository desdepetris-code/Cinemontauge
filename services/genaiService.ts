import { GoogleGenAI, Type } from "@google/genai";
import { RecommendedMovie } from "../types";

// The API key is injected from the environment.
const API_KEY = "gen-lang-client-0009750546";

if (!API_KEY) {
  // This will prevent the app from running if the key is not provided,
  // which is expected in the execution environment.
  console.error("API_KEY is not defined in the environment.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateMovieRecommendations = async (watchedMovies: string[]): Promise<RecommendedMovie[]> => {
  if (watchedMovies.length === 0 || !API_KEY) {
    return [];
  }

  const prompt = `Based on the following list of movies I've watched, recommend 5 more movies I might like. Provide only the title and the release year. Do not include any of the movies from the list I provide.

Movies I've watched:
- ${watchedMovies.join('\n- ')}

Your response must be a valid JSON array of objects, where each object has a "title" (string) and a "year" (number) property. For example: [{"title": "The Matrix", "year": 1999}]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "The title of the movie."
              },
              year: {
                type: Type.NUMBER,
                description: "The release year of the movie."
              }
            },
            required: ["title", "year"]
          }
        }
      }
    });

    const jsonText = response.text.trim();
    const recommendations = JSON.parse(jsonText);

    // Basic validation
    if (!Array.isArray(recommendations) || recommendations.some(r => typeof r.title !== 'string' || typeof r.year !== 'number')) {
        console.error("Invalid JSON structure received from AI:", recommendations);
        throw new Error("Invalid JSON structure received from AI.");
    }
    
    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations from Gemini API:", error);
    return [];
  }
};