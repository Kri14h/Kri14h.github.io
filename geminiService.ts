import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL, SYSTEM_INSTRUCTION } from "../constants";
import { AnalysisResponse, TextBlock } from "../types";

export const analyzeComicPage = async (base64Image: string): Promise<TextBlock[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Define Schema for structured JSON output
  const schema = {
    type: Type.OBJECT,
    properties: {
      bubbles: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            box_2d: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: "ymin, xmin, ymax, xmax (0-1000)"
            }
          },
          required: ["text", "box_2d"]
        }
      }
    },
    required: ["bubbles"]
  };

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Analyze this comic page." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");

    const data: AnalysisResponse = JSON.parse(jsonText);
    
    return data.bubbles.map((b, i) => ({
      id: crypto.randomUUID(),
      text: b.text,
      box_2d: b.box_2d,
      order: i + 1
    }));

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};