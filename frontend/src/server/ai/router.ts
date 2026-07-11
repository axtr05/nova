import { GoogleGenAI } from "@google/genai";
import { AIModelsSettings } from "@/frontend/types/user";

type AIFeature = "planner" | "analytics" | "memory" | "dailyReview";

const FALLBACK_CHAINS: Record<AIFeature, string[]> = {
  planner: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-3.1-flash-lite"],
  analytics: ["gemini-2.0-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"],
  memory: ["gemini-3.1-flash-lite", "gemini-2.0-flash"],
  dailyReview: ["gemini-3.1-flash-lite", "gemini-2.0-flash"]
};

export class AIRouter {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("NOVA Error: GEMINI_API_KEY is missing.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  private getModelChain(feature: AIFeature, userConfig?: AIModelsSettings): string[] {
    // 1. Check Global Override
    if (userConfig?.globalOverride && userConfig.globalOverride !== "null") {
      return [userConfig.globalOverride];
    }

    // 2. Check Feature Override
    if (userConfig && userConfig[feature] && userConfig[feature] !== "AUTO" && userConfig[feature] !== "null") {
      return [userConfig[feature] as string];
    }

    // 3. AUTO Default
    return FALLBACK_CHAINS[feature];
  }

  public async generate(
    feature: AIFeature,
    prompt: string,
    systemInstruction: string,
    userConfig?: AIModelsSettings,
    temperature: number = 0.7,
    responseSchema?: any
  ): Promise<string> {
    const modelChain = this.getModelChain(feature, userConfig);
    let lastError: any = null;

    for (let i = 0; i < modelChain.length; i++) {
      const currentModel = modelChain[i];
      try {
        console.log(`[AI_ROUTER] Feature: ${feature} | Attempting model: ${currentModel} (Attempt ${i + 1}/${modelChain.length})`);
        
        const response = await this.ai.models.generateContent({
          model: currentModel,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature,
            ...(responseSchema ? { responseSchema } : {})
          }
        });

        console.log(`[AI_ROUTER] Success with ${currentModel}`);
        return response.text || "{}";

      } catch (error: any) {
        lastError = error;
        const status = error.status || error.code || "UNKNOWN";
        const message = error.message || String(error);
        
        console.error(`[AI_ROUTER] Request failed for ${currentModel}. Reason: ${status} - ${message}`);

        // Check if we should fallback (429 Quota, 503 Unavailable, 504 Timeout, ETIMEDOUT)
        const isTransientError = 
          status === 429 || 
          status === 503 || 
          status === 504 || 
          message.includes("ETIMEDOUT") || 
          message.includes("fetch failed");

        if (isTransientError) {
          if (i < modelChain.length - 1) {
            console.log(`[AI_ROUTER] Falling back to next model: ${modelChain[i + 1]}`);
            continue; // Try the next model
          } else {
            console.error(`[AI_ROUTER] All models exhausted for feature: ${feature}`);
            break;
          }
        } else {
          // If it's a 400 Bad Request or something structural, don't retry, just throw.
          break;
        }
      }
    }

    // If we exhaust the loop or break due to non-transient error:
    console.error(`[AI_ROUTER] Inference failed across all available models.`);
    throw lastError;
  }
}

export const aiRouter = new AIRouter();
