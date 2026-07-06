import { NextResponse } from "next/server";
import { processWeeklyAnalytics } from "@/server/ai/analyticsGemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { summary, chartData, memories, modelId } = body;

    if (!summary || !chartData) {
      return NextResponse.json(
        { message: "Analytics data is required." },
        { status: 400 }
      );
    }

    const report = await processWeeklyAnalytics(summary, chartData, memories || [], modelId);
    return NextResponse.json(report);
  } catch (error) {
    console.error("Analytics API Route Error:", error);
    return NextResponse.json(
      { message: "Failed to generate analytics report." },
      { status: 500 }
    );
  }
}
