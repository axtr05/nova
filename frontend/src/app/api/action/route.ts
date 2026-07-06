import { NextRequest, NextResponse } from "next/server";
import { processUserPrompt } from "@/server/ai/gemini";
import { AIAnalysisResult } from "@/server/types/actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, context, memoryContext, modelId } = body;

    if (!prompt) {
      return NextResponse.json(
        { 
          summary: "", warnings: [], conflicts: [], free_time: [], suggestions: [], 
          isError: true, errorMessage: "Prompt is required." 
        } as AIAnalysisResult,
        { status: 400 }
      );
    }

    const actionResult = await processUserPrompt(prompt, context || "", memoryContext || "", modelId);
    return NextResponse.json(actionResult);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { 
        summary: "", warnings: [], conflicts: [], free_time: [], suggestions: [], 
        isError: true, errorMessage: "Failed to process the prompt on the server." 
      } as AIAnalysisResult,
      { status: 500 }
    );
  }
}
