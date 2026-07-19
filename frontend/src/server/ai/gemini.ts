import { GoogleGenAI } from "@google/genai";
import { AIAnalysisResult } from "../types/actions";
import { aiRouter } from "./router";
import { AIModelsSettings } from "@/frontend/types/user";
import { PLANNER_SYSTEM_INSTRUCTION, PROMPT_VERSION, buildPlannerPrompt } from "./prompts/planner";

export async function processUserPrompt(prompt: string, context: string, memoryContext: string = "", aiModels?: AIModelsSettings): Promise<AIAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      summary: "",
      warnings: [],
      conflicts: [],
      free_time: [],
      suggestions: [],
      isError: true,
      errorMessage: "NOVA Error: GEMINI_API_KEY is missing. Please add it to your .env.local file."
    };
  }

  try {
    const combinedPrompt = buildPlannerPrompt({ prompt, context, memoryContext });
    
    let text = await aiRouter.generate(
      "planner",
      combinedPrompt,
      PLANNER_SYSTEM_INSTRUCTION,
      PROMPT_VERSION,
      aiModels,
      0.2
    );
    
    // Strip markdown formatting if Gemini included it despite instructions
    if (text.startsWith("```json")) {
      text = text.substring(7);
    } else if (text.startsWith("```")) {
      text = text.substring(3);
    }
    if (text.endsWith("```")) {
      text = text.substring(0, text.length - 3);
    }
    
    // Fallback: extract the JSON object using regex if there's trailing text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const parsed = JSON.parse(text) as AIAnalysisResult;
    
    // Ensure all arrays exist to prevent frontend mapping crashes
    return {
      summary: parsed.summary || "Analysis complete.",
      warnings: parsed.warnings || [],
      conflicts: parsed.conflicts || [],
      free_time: parsed.free_time || [],
      suggestions: parsed.suggestions || [],
      requires_confirmation: parsed.requires_confirmation ?? true,
      clarification_request: parsed.clarification_request
    };
  } catch (error: any) {
    // Only log non-429 errors to avoid triggering Next.js Dev Overlay for rate limits
    if (error?.status !== 429 && !(error?.message && error.message.includes("429"))) {
      console.error("Gemini Error:", error);
    }
    
    if (error?.status === 429 || (error?.message && error.message.includes("429"))) {
      return {
        summary: "",
        warnings: [],
        conflicts: [],
        free_time: [],
        suggestions: [],
        requires_confirmation: true,
        isError: true,
        errorMessage: "Google AI Speed Limit Exceeded (Free Tier is limited to 15 requests per minute). Your daily quota is fine, but please wait 30 seconds before sending another request."
      };
    }

    return {
      summary: "",
      warnings: [],
      conflicts: [],
      free_time: [],
      suggestions: [],
      requires_confirmation: true,
      isError: true,
      errorMessage: "NOVA AI Engine encountered an error connecting to Gemini. Please try again."
    };
  }
}
