import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  masterAgent,
} from "@/agents/master";

import {
  RetrievalContext,
} from "@/lib/knowledge/retriever/chromaRetriever";


export async function POST(
  request: NextRequest
) {

  try {

    // ========================================================
    // 1. READ REQUEST
    // ========================================================

    const body =
      await request.json();


    const prompt =
      typeof body.prompt === "string"
        ? body.prompt.trim()
        : "";


    if (!prompt) {

      return NextResponse.json(
        {
          success: false,

          error:
            "Prompt is required.",
        },

        {
          status: 400,
        }
      );

    }


    // ========================================================
    // 2. CURRICULUM
    // ========================================================

    const curriculum =
      body.curriculum as
        | RetrievalContext
        | undefined;


    // ========================================================
    // 3. CONVERSATION HISTORY
    // ========================================================

    const history =
      Array.isArray(body.history)
        ? body.history
        : [];


    // ========================================================
    // 4. REQUEST LOGGING
    // ========================================================

    console.log(
      "\n======================================"
    );

    console.log(
      "📩 SRIMATHY AGENT REQUEST"
    );

    console.log(
      "======================================"
    );

    console.log(
      "Prompt:",
      prompt
    );

    console.log(
      "Curriculum:",
      curriculum
    );

    console.log(
      "History turns:",
      history.length
    );


    // ========================================================
    // 5. MASTER AGENT
    // ========================================================

    const result =
      await masterAgent({

        topic:
          prompt,

        curriculum:
          curriculum,

        history:
          history,

      });


    // ========================================================
    // 6. LIVE RUNTIME TELEMETRY
    // ========================================================

    console.log(
      "\n======================================"
    );

    console.log(
      "🎯 SRIMATHY ACTIVE RUNTIME"
    );

    console.log(
      "======================================"
    );

    console.log(
      "Provider:",
      result.runtime?.provider ??
      "unknown"
    );

    console.log(
      "Model:",
      result.runtime?.model ??
      "unknown"
    );

    console.log(
      "Runtime:",
      result.runtime?.runtime ??
      "unknown"
    );

    console.log(
      "Fallback:",
      result.runtime?.fallback ??
      false
    );

    console.log(
      "Latency:",
      result.runtime?.totalLatencyMs ??
      0,
      "ms"
    );

    console.log(
      "======================================"
    );


    // ========================================================
    // 7. API RESPONSE
    // ========================================================

    return NextResponse.json({

      success:
        true,

      data:
        result,

      curriculum:
        result.curriculum,

      retrieval:
        result.retrieval,

      research:
        result.research,

      runtime:
        result.runtime,

    });


  } catch (error) {

    console.error(
      "\n======================================"
    );

    console.error(
      "❌ /api/agent failed"
    );

    console.error(
      "======================================"
    );

    console.error(
      error
    );


    return NextResponse.json(

      {

        success:
          false,

        error:
          error instanceof Error
            ? error.message
            : "SRIMATHY agent failed.",

      },

      {

        status:
          500,

      }

    );

  }

}