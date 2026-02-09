import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  // Fix: Removed constructor and property initialization to follow the strict "const ai = new GoogleGenAI({apiKey: process.env.API_KEY});" 
  // requirement inside methods to ensure fresh instance and direct API key usage.
  
  async refineText(text: string, instruction: string) {
    // Fix: Using process.env.API_KEY directly as required by the SDK guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Refine the following text based on this instruction: "${instruction}". \n\nText: ${text}`,
        config: {
          temperature: 0.7,
        },
      });
      // Fix: Using .text property instead of .text() method
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return null;
    }
  }

  async generateDraft(topic: string) {
    // Fix: Using process.env.API_KEY directly as required by the SDK guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a professional document draft about: ${topic}. Use clear headings and professional tone.`,
      });
      // Fix: Using .text property instead of .text() method
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return null;
    }
  }
}

export const gemini = new GeminiService();