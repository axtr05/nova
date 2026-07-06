import { GoogleGenAI } from "@google/genai";
import { AIAnalysisResult } from "../types/actions";

const SYSTEM_INSTRUCTION = `
You are the AI Master Planner for NOVA, a premium scheduling application.
You are the AI Master Planner for NOVA, a premium scheduling application.
Your job is to analyze the user's schedule and long-term memory context, detect issues (overloads, conflicts, lack of recovery), and provide intelligent suggestions.

You will receive the user's prompt along with their current schedule context (including current date/time, priorities, tags, and completion status) and a list of their Relevant Memories (habits, goals, preferences, lessons).

Use their memories to tailor your scheduling suggestions. For example, if a memory states "I perform best in the morning", suggest morning times for high-priority tasks.

Always return a single strictly formatted JSON object matching this schema:
{
  "summary": "A brief, encouraging overview of their schedule and your analysis.",
  "warnings": ["Array of strings highlighting overloads, back-to-back intense events, or missing breaks"],
  "conflicts": ["Array of strings highlighting overlapping events"],
  "free_time": ["Array of strings highlighting large gaps where work/workouts could fit"],
  "suggestions": [
    {
      "reasoning": "Explanation of why this change is good (e.g., 'Move Workout to Wednesday for better recovery before your Interval Run.')",
      "proposed_changes": [
        // Array of PlannerAction objects exactly as specified below
      ]
    }
  ]
}

Do NOT wrap the JSON in markdown code blocks (e.g., no \`\`\`json ... \`\`\`). Just return the raw JSON object string.

Supported PlannerAction objects for proposed_changes:
1. create_event: { "action": "create_event", "title": "...", "date": "YYYY-MM-DD", "start": "HH:MM", "end": "HH:MM", "description": "...", "color": "violet" }
2. update_event: { "action": "update_event", "originalTitle": "Exact old title to match", "newTitle": "...", "newDate": "YYYY-MM-DD", "newStart": "HH:MM", "newEnd": "HH:MM" }
3. delete_event: { "action": "delete_event", "title": "Exact title to delete" }
4. mark_complete: { "action": "mark_complete", "title": "Exact title to complete" }

CRITICAL RULES:
- If the user explicitly asks to create/move an event, include that in suggestions.
- NEVER automatically modify the calendar. All actions must be inside "proposed_changes" for user approval.
- Ensure times are 24-hour HH:MM strings.
`;

export async function processUserPrompt(prompt: string, context: string, memoryContext: string = "", modelName: string = "gemini-2.5-flash"): Promise<AIAnalysisResult> {
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

  const apiModel = modelName.startsWith("gemini") ? modelName : "gemini-2.5-flash";
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: apiModel,
      contents: [
        { role: "user", parts: [{ text: `Schedule Context:\n${context}\n\nRelevant Memories:\n${memoryContext}\n\nUser Request: ${prompt}` }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2, // Slightly higher temperature for better reasoning, but still structured
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text) as AIAnalysisResult;
    
    // Ensure all arrays exist to prevent frontend mapping crashes
    return {
      summary: parsed.summary || "Analysis complete.",
      warnings: parsed.warnings || [],
      conflicts: parsed.conflicts || [],
      free_time: parsed.free_time || [],
      suggestions: parsed.suggestions || [],
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      summary: "",
      warnings: [],
      conflicts: [],
      free_time: [],
      suggestions: [],
      isError: true,
      errorMessage: "NOVA AI Engine encountered an error connecting to Gemini. Please try again."
    };
  }
}
