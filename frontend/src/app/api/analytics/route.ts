import { NextResponse } from "next/server";
import { processWeeklyAnalytics } from "@/server/ai/analyticsGemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { summary, chartData, memories, aiModels } = body;

    if (!summary || !chartData) {
      return NextResponse.json(
        { message: "Analytics data is required." },
        { status: 400 }
      );
    }

    const report = await processWeeklyAnalytics(summary, chartData, memories || [], aiModels);
    return NextResponse.json(report);
  } catch (error: any) {
    if (error.message === "Analytics is temporarily unavailable. Please try again shortly.") {
      return NextResponse.json(
        { message: error.message },
        { status: 504 }
      );
    }
    console.error("Analytics API Route Error:", error);
    return NextResponse.json(
      { message: "Failed to generate analytics report." },
      { status: 500 }
    );
  }
}
