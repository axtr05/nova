import { DailyReviewInput } from "@/types";

export const PROMPT_VERSION = "1.0.0";

export const DAILY_REVIEW_SYSTEM_INSTRUCTION = `
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

export interface DailyReviewPromptParams {
  answers: DailyReviewInput;
  context: string;
}

export function buildDailyReviewPrompt({ answers, context }: DailyReviewPromptParams): string {
  return `Context (Today's Schedule):\n${context}\n\nDaily Review Answers:\n- Went Well: ${answers.wentWell}\n- Didn't Go Well: ${answers.didNotGoWell}\n- Energy: ${answers.energy}/10\n- Mood: ${answers.mood}/10\n- Remember Tomorrow: ${answers.rememberTomorrow}\n- Additional Notes: ${answers.additionalNotes}`;
}
