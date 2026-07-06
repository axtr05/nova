import { GoogleGenAI } from "@google/genai";
import { DailyReviewInput, Memory } from "@/types";

export interface DailyReviewResult {
  summary: string;
  achievements: string[];
  problems: string[];
  lessons: string[];
  tomorrowFocus: string;
  memories: Omit<Memory, "id" | "createdAt" | "isPinned">[];
}

const SYSTEM_INSTRUCTION = `
You are the AI Memory Core for NOVA. Your job is to process the user's Daily Review and extract meaningful, long-term memories.

You will receive the user's Daily Review answers and their schedule context.

Return a strict JSON payload matching this schema:
{
  "summary": "A warm, encouraging wrap-up of their day.",
  "achievements": ["List of things they accomplished"],
  "problems": ["List of struggles or obstacles they faced"],
  "lessons": ["Key takeaways or lessons learned"],
  "tomorrowFocus": "What they should prioritize tomorrow based on their input",
  "memories": [
    {
      "title": "Short descriptive title",
      "content": "Detailed context of the memory",
      "category": "Goal" | "Habit" | "Reminder" | "Lesson" | "Preference" | "Project" | "Deadline" | "Health" | "Study" | "General",
      "importance": 1 to 10 (integer),
      "source": "Daily Review YYYY-MM-DD"
    }
  ]
}

Guidelines for extracting memories:
- DO NOT create generic memories. Only extract highly specific, meaningful data (e.g., "Struggles to workout after 6PM" -> Preference, importance: 8).
- If the user mentions a new deadline, extract it as a Deadline memory.
- If the user achieved a milestone, extract it as a Goal memory.
- Rate the importance based on how critical it is for future scheduling.
`;

export async function processDailyReview(
  answers: DailyReviewInput,
  context: string,
  modelName: string = "gemini-2.5-flash"
): Promise<DailyReviewResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("NOVA Error: GEMINI_API_KEY is missing.");
  }

  const apiModel = modelName.startsWith("gemini") ? modelName : "gemini-2.5-flash";
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Context (Today's Schedule):\n${context}\n\nDaily Review Answers:\n- Went Well: ${answers.wentWell}\n- Didn't Go Well: ${answers.didNotGoWell}\n- Energy: ${answers.energy}/10\n- Mood: ${answers.mood}/10\n- Remember Tomorrow: ${answers.rememberTomorrow}\n- Additional Notes: ${answers.additionalNotes}`;
    
    const response = await ai.models.generateContent({
      model: apiModel,
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.3,
      }
    });

    const text = response.text || "{}";
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
