import { DailyReviewInput, Memory } from "@/types";
import { aiRouter } from "./router";
import { AIModelsSettings } from "@/frontend/types/user";
import { DAILY_REVIEW_SYSTEM_INSTRUCTION, PROMPT_VERSION, buildDailyReviewPrompt } from "./prompts/dailyReview";

export interface DailyReviewResult {
  summary: string;
  achievements: string[];
  problems: string[];
  lessons: string[];
  tomorrowFocus: string;
  memories: Omit<Memory, "id" | "createdAt" | "isPinned">[];
}

export async function processDailyReview(
  answers: DailyReviewInput,
  context: string,
  aiModels?: AIModelsSettings
): Promise<DailyReviewResult> {
  try {
    const prompt = buildDailyReviewPrompt({ answers, context });
    
    const text = await aiRouter.generate(
      "dailyReview",
      prompt,
      DAILY_REVIEW_SYSTEM_INSTRUCTION,
      PROMPT_VERSION,
      aiModels,
      0.3
    );

    const parsed = JSON.parse(text) as DailyReviewResult;
    
    return {
      summary: parsed.summary || "Daily review processed.",
      achievements: parsed.achievements || [],
      problems: parsed.problems || [],
      lessons: parsed.lessons || [],
      tomorrowFocus: parsed.tomorrowFocus || "",
      memories: parsed.memories || []
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to process daily review.");
  }
}
