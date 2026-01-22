import { GoogleGenAI } from "@google/genai";
import { secret } from "encore.dev/config";

const geminiApiKey = secret("GEMINI_API_KEY");

const ai = new GoogleGenAI({ apiKey: geminiApiKey() });

export default ai;
