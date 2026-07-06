import { NextRequest, NextResponse } from "next/server";
import { processDailyReview } from "@/server/ai/memoryGemini";
import { DailyReviewInput } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { answers, context, modelId } = body as { answers: DailyReviewInput, context: string, modelId: string };

    if (!answers) {
      return NextResponse.json(
        { message: "Answers are required." },
        { status: 400 }
      );
    }

    const reviewResult = await processDailyReview(answers, context || "", modelId);
    return NextResponse.json(reviewResult);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { message: "Failed to process the daily review." },
      { status: 500 }
    );
  }
}
