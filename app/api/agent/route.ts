import { NextRequest, NextResponse } from "next/server";
import { masterAgent } from "@/agents/master";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const prompt =
      body.prompt ??
      body.message ??
      body.input ??
      "";

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "Prompt is missing.",
        },
        { status: 400 }
      );
    }

    console.log("\n======================================");
    console.log("📩 Incoming Prompt");
    console.log("======================================");
    console.log(prompt);

    const result = await masterAgent({
      topic: prompt,
    });

    console.log("\n======================================");
    console.log("✅ MASTER RESULT");
    console.log("======================================");

    console.dir(result, { depth: null });

    console.log("\nLesson Exists    :", !!result.lesson);
    console.log("Worksheet Exists :", !!result.worksheet);
    console.log("Quiz Exists      :", !!result.quiz);
    console.log("Teacher Exists   :", !!result.teacher);

    console.log("\nLesson Length    :", result.lesson?.content?.length ?? 0);
    console.log("Worksheet Length :", result.worksheet?.content?.length ?? 0);
    console.log("Quiz Length      :", result.quiz?.content?.length ?? 0);
    console.log("Teacher Length   :", result.teacher?.content?.length ?? 0);

    console.log("\n======================================\n");

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {

    console.error("\n======================================");
    console.error("❌ ROUTE ERROR");
    console.error("======================================");
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 }
    );
  }
}