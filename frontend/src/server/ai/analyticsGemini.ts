import { AnalyticsSummary, ChartDataPoint, Memory, AIWeeklyReport } from "@/types";
import { aiRouter } from "./router";
import { AIModelsSettings } from "@/frontend/types/user";
import { ANALYTICS_SYSTEM_INSTRUCTION, PROMPT_VERSION, buildAnalyticsPrompt } from "./prompts/analytics";

export async function processWeeklyAnalytics(
  summary: AnalyticsSummary,
  chartData: ChartDataPoint[],
  memories: Pick<Memory, "title" | "content" | "category" | "importance">[],
  aiModels?: AIModelsSettings
): Promise<AIWeeklyReport> {
  
  let retries = 1;
  try {
    const prompt = buildAnalyticsPrompt({ summary, chartData, memories });

    const text = await aiRouter.generate(
      "analytics",
      prompt,
      ANALYTICS_SYSTEM_INSTRUCTION,
      PROMPT_VERSION,
      aiModels,
      0.2
    );

    return JSON.parse(text) as AIWeeklyReport;
  } catch (error: any) {
    const isTimeout = error.message?.toLowerCase().includes("timeout") || error.code === "ETIMEDOUT" || error.status === 504;
    
    console.error("Gemini Analytics Error:", error);
    if (isTimeout) {
      throw new Error("Analytics is temporarily unavailable. Please try again shortly.");
    }
    throw new Error("Failed to generate weekly analytics report.");
  }
}
