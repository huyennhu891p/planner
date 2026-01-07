
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { QSI_VOICE } from "./constants";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert Social Media Content Strategist for QSI International Schools. 
Your tone must be: ${QSI_VOICE.tone}.
Language Requirement: ALWAYS respond and generate content in ENGLISH.

Guidelines:
- Never use pushy sales phrases like ${QSI_VOICE.donots.join(', ')}.
- Focus on: ${QSI_VOICE.priorities.join(', ')}.
- Use warm, trust-building language suitable for parents.
- Content should feel calm and steady.
`;

export const geminiService = {
  async suggestHook(topic: string): Promise<string> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 3 calm, trust-building hooks for parents about this topic: "${topic}". Focus on the child's growth. Output must be in English.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "No suggestions available.";
  },

  async rewriteCaption(caption: string, isWeekend: boolean = false, imageBase64?: string): Promise<string> {
    const ai = getAI();
    const parts: any[] = [];
    
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1] || imageBase64
        }
      });
    }

    const prompt = isWeekend 
      ? `Rewrite this caption for a weekend post in English. Keep it very short, easy to read, and calm. No internal announcements or heavy text: "${caption}"`
      : `Rewrite this caption in English using the QSI voice (${QSI_VOICE.tone}). Make it professional yet warm: "${caption}"`;
    
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || caption;
  },

  async generateShotList(topic: string): Promise<string> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a 30-45s shot list (3-6 short scenes) in English for a video about "${topic}" at a QSI school. Scenes should include classroom life, hallways, or teacher support. Tone: calm, professional.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "1. Wide shot of classroom\n2. Medium shot of student focus\n3. Close up of learning materials\n4. Teacher providing support";
  },

  async generateImage(prompt: string): Promise<string | undefined> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A professional, high-quality photograph for an international school's social media. The scene should be calm, warm, and show a positive, safe, and modern learning environment. The image should feature students or classrooms reflecting the following topic: ${prompt}. No text, logos, or sensitive information. Cinematic lighting, realistic photography style.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  }
};
