import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

export const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export interface GenerationResult {
  imageUrl: string | null;
  prompt: string;
  status: "completed" | "failed";
  error?: string;
  generationId: string;
}

export interface GenerationRequest {
  prompt: string;
  userId: string;
  width?: number;
  height?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3";
}
