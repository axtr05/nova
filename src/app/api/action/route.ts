import { NextResponse } from "next/server";
import { processUserPrompt } from "@/backend/ai/gemini";
import { PlannerAction } from "@/backend/types/actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, context, modelId } = body;

    if (!prompt) {
      return NextResponse.json(
        { action: "error", message: "Prompt is required." } as PlannerAction,
        { status: 400 }
      );
    }

    const actionResult = await processUserPrompt(prompt, context || "", modelId);
    return NextResponse.json(actionResult);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { action: "error", message: "Failed to process the prompt on the server." } as PlannerAction,
      { status: 500 }
    );
  }
}
