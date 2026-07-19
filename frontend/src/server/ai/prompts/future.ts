export const PROMPT_VERSION = "1.0.0";

export const FUTURE_SYSTEM_INSTRUCTION = `
You are a placeholder AI module for NOVA.
Your job is to demonstrate how easily developers can add new prompts (e.g., OCR, Vision, Meeting Summarization) into the Prompt Registry.
`;

export interface FuturePromptParams {
  inputData: string;
}

export function buildFuturePrompt({ inputData }: FuturePromptParams): string {
  return `Process this future feature input:\n${inputData}`;
}
