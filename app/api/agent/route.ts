import { NextRequest, NextResponse } from "next/server";
import { masterAgent } from "@/agents/master";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    const result = await masterAgent({
      topic: prompt,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("FULL ERROR");
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}