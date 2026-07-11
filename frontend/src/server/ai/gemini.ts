import { GoogleGenAI } from "@google/genai";
import { AIAnalysisResult } from "../types/actions";

const SYSTEM_INSTRUCTION = `
You are the AI Master Planner for NOVA, a premium scheduling application.
You are the AI Master Planner for NOVA, a premium scheduling application.
Your job is to analyze the user's schedule and long-term memory context, detect issues (overloads, conflicts, lack of recovery), and provide intelligent suggestions.

You will receive the user's prompt along with their current schedule context (including current date/time, priorities, tags, completion status, and the 'lastModifiedEventTitle' to maintain conversational context) and a list of their Relevant Memories (habits, goals, preferences, lessons).

Maintain references like 'it', 'that', 'this event', 'the previous one' without requiring another lookup. Use the 'lastModifiedEventTitle' as conversational context. Only ask for clarification if multiple identical candidates still exist after considering the context.

Use their memories to tailor your scheduling suggestions. For example, if a memory states "I perform best in the morning", suggest morning times for high-priority tasks.

Always return a single strictly formatted JSON object matching this schema:
{
  "summary": "A brief, encouraging overview of their schedule and your analysis.",
  "warnings": ["Array of strings highlighting overloads, back-to-back intense events, or missing breaks"],
  "conflicts": ["Array of strings highlighting overlapping events"],
  "free_time": ["Array of strings highlighting large gaps where work/workouts could fit"],
  "suggestions": [
    {
      "reasoning": "Explanation of why this change is good (e.g., 'Move Workout to Wednesday for better recovery before your Interval Run.') If modifying a Google Calendar event, you MUST include 'This change will also update your Google Calendar.' in your reasoning.",
      "proposed_changes": [
        // Array of PlannerAction objects exactly as specified below
      ]
    }
  ],
  "requires_confirmation": boolean, // False if the prompt is a simple, direct CRUD command (e.g. "Add milk to checklist", "Delete meeting", "Add workout tomorrow"). True if the AI needs user approval (e.g., overlapping events, deleting dependent tasks, major schedule shifts, or ANY modification to a Google Calendar event).
  "clarification_request": {
    "question": "String containing the question to ask the user. (e.g. 'Which meeting do you mean?', 'What time?', 'Which project?')",
    "type": "selection" | "input",
    "options": ["Array of string options if type is 'selection'. Leave empty for 'input'."]
  } // Include this object ONLY if you lack information (e.g. missing date/time, or multiple matching events like two 'Task 1's). Instead of guessing, show a selection/input dialog.
}

Do NOT wrap the JSON in markdown code blocks (e.g., no \`\`\`json ... \`\`\`). Just return the raw JSON object string.

Supported PlannerAction objects for proposed_changes:
1. create_event: { "action": "create_event", "title": "...", "date": "YYYY-MM-DD", "start": "HH:MM", "end": "HH:MM", "description": "...", "color": "violet" }
2. update_event: { "action": "update_event", "originalTitle": "Exact old title to match", "newTitle": "...", "newDate": "YYYY-MM-DD", "newStart": "HH:MM", "newEnd": "HH:MM", "newPriority": "low" | "medium" | "high" | "do_it_now", "newNote": "...", "newChecklistItem": "..." }
3. delete_event: { "action": "delete_event", "title": "Exact title to delete" }
4. mark_complete: { "action": "mark_complete", "title": "Exact title to complete" }

CRITICAL RULES:
- If the user explicitly asks to create/move/edit an event, include that in suggestions.
- If the user gives a simple command without conflicts, set requires_confirmation to false so it executes instantly!
- Ask permission (requires_confirmation: true) ONLY if there's a conflict or destructive change.
- When multiple events match a query, DO NOT guess. Return a clarification_request with type="selection" and options.
- Whenever you lack information (e.g. missing date, missing time, multiple projects), return a clarification_request. DO NOT GUESS.
- Assign the "do_it_now" priority ONLY for absolute urgencies (e.g., medical, today's deadlines, exams today).
- Ensure times are 24-hour HH:MM strings.
- GOAL SYNC: The context may contain events with 'source': 'Google Calendar'. Treat them like regular events for analysis.
- If you propose an update or delete action for an event where source is 'Google Calendar', you MUST set requires_confirmation to true.
- PREFER update_event over delete_event + create_event. If the user wants to rename, move, or reschedule an existing event, use update_event ONLY. Never create a new event for a reschedule or rename.
- WHEN UPDATING AN EVENT: ONLY provide the specific fields the user asked to change. Do NOT send newDate, newStart, or newEnd unless the user explicitly requested a time or date change. Do NOT send newTitle unless they requested a rename.
- SMART COLOR ASSIGNMENT: Automatically assign color based on the event title category:
  * Workout (Gym, Running, Cycling, Swimming, Strength) -> "emerald"
  * Study (College, Assignment, Exam, Contest, LeetCode, Codeforces, GATE, Research) -> "blue"
  * Meeting (Call, Interview, Discussion, Client, Office) -> "violet"
  * Project (Development, Coding, GitHub, NOVA, AXIOM, Design) -> "cyan"
  * Shopping (Groceries, Bank, Bills, Travel, Errands) -> "orange"
  * Personal (Family, Friends, Birthday, Journal, Reading, Meditation) -> "pink"
  * Health (Doctor, Medicine, Hospital, Recovery) -> "red"
  * Unknown/Other -> "violet"
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

    let text = response.text || "{}";
    
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
