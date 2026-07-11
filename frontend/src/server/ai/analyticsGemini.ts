import { AnalyticsSummary, ChartDataPoint, Memory, AIWeeklyReport } from "@/types";
import { aiRouter } from "./router";
import { AIModelsSettings } from "@/frontend/types/user";

const SYSTEM_INSTRUCTION = `
You are the NOVA AI Productivity Analyst. Your goal is to review the user's weekly metrics and memory context and generate a comprehensive Weekly Intelligence Report.

You will be given:
1. The Weekly Analytics Summary (completion rates, hours logged).
2. Daily breakdown chart data.
3. Top recent memories (habits, goals, daily review context).

Generate a strict JSON payload matching this exact schema:
{
  "weeklySummary": "A concise, engaging paragraph summarizing their overall week.",
  "biggestAchievement": "The standout accomplishment based on data or memories.",
  "biggestWeakness": "The primary area where they struggled.",
  "suggestedImprovements": ["Actionable tip 1", "Actionable tip 2"],
  "recommendedFocus": "What they should focus on next week.",
  "burnoutRisk": "Low" | "Medium" | "High",
  "recoveryScore": 1 to 100 integer,
  "studyAnalysis": "Brief analysis of their study patterns.",
  "workoutAnalysis": "Brief analysis of their workout consistency.",
  "smartInsights": [
    "You study best after workouts.",
    "Morning sessions have the highest completion.",
    "You skipped workouts on Thursday and Friday."
  ]
}

Ensure the insights are specific to the provided data.
`;

export async function processWeeklyAnalytics(
  summary: AnalyticsSummary,
  chartData: ChartDataPoint[],
  memories: Pick<Memory, "title" | "content" | "category" | "importance">[],
  aiModels?: AIModelsSettings
): Promise<AIWeeklyReport> {
  
  let retries = 1;
  try {
    const prompt = `Weekly Summary:
${JSON.stringify(summary, null, 2)}

Daily Chart Data:
${JSON.stringify(chartData, null, 2)}

Recent Context (Memories):
${JSON.stringify(memories, null, 2)}`;

    const text = await aiRouter.generate(
      "analytics",
      prompt,
      SYSTEM_INSTRUCTION,
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
