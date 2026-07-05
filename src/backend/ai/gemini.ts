import { GoogleGenAI } from "@google/genai";
import { PlannerAction } from "../types/actions";

const SYSTEM_INSTRUCTION = `
You are the AI Action Engine for NOVA, a premium planning application.
Your job is to translate natural language user requests into strictly structured JSON actions that the planner engine can execute.

You will receive the user's prompt along with their current schedule context (including current date/time).

Always return a single JSON object.
Do NOT wrap the JSON in markdown code blocks (e.g., no \`\`\`json ... \`\`\`). Just return the raw JSON object string.

Supported actions:
1. create_event: Creates a new event. Requires title, date (YYYY-MM-DD), start (HH:MM 24h), end (HH:MM 24h). If duration is unspecified, default to 1 hour.
2. update_event: Modifies an existing event. Provide 'originalTitle' to identify the target event. Provide 'newTitle', 'newDate', 'newStart', 'newEnd' as needed.
3. delete_event: Deletes an event. Provide 'title' to identify it.
4. mark_complete: Marks an event as complete. Provide 'title' to identify it.
5. fetch_schedule: Requests to view a specific date's schedule.
6. error: Use this if the prompt is invalid, abusive, or totally unrelated to calendar management. Provide a friendly 'message' explaining why.

Example 1: "Add cycling tomorrow at 6am"
{ "action": "create_event", "title": "Cycling", "date": "2026-07-06", "start": "06:00", "end": "07:00", "message": "Added cycling to your schedule." }

Example 2: "Move my workout to 8 PM"
{ "action": "update_event", "originalTitle": "Workout", "newStart": "20:00", "newEnd": "21:00", "message": "Moved your workout to 8 PM." }

Example 3: "Delete tomorrow's meeting"
{ "action": "delete_event", "title": "Meeting", "message": "Deleted your meeting." }

Example 4: "I finished my workout"
{ "action": "mark_complete", "title": "Workout", "message": "Great job completing your workout!" }
`;

export async function processUserPrompt(prompt: string, context: string, modelName: string = "gemini-2.5-flash"): Promise<PlannerAction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      action: "error",
      message: "NOVA Error: GEMINI_API_KEY is missing. Please add it to your .env.local file."
    };
  }

  // Map our UI model IDs to actual API model names if needed
  // Using gemini-2.5-flash as default for fast action parsing
  const apiModel = modelName.startsWith("gemini") ? modelName : "gemini-2.5-flash";
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: apiModel,
      contents: [
        { role: "user", parts: [{ text: `Context:\n${context}\n\nUser Request: ${prompt}` }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.1, // Keep it highly deterministic for JSON formatting
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text) as PlannerAction;
    return parsed;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      action: "error",
      message: "NOVA AI Engine encountered an error connecting to Gemini. Please try again."
    };
  }
}
