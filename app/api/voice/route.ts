import {
  NextRequest,
  NextResponse,
} from "next/server";


const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL ||
  "gemma3:4b";


function getOllamaGenerateUrl(): string {

  const configured =
    (
      process.env.OLLAMA_URL ||
      "http://localhost:11434/api/generate"
    ).replace(
      /\/+$/,
      ""
    );

  if (
    configured.endsWith(
      "/api/generate"
    )
  ) {

    return configured;

  }

  if (
    configured.endsWith("/api")
  ) {

    return `${configured}/generate`;

  }

  return `${configured}/api/generate`;

}


export async function POST(
  request: NextRequest
) {

  const start =
    performance.now();

  try {

    const body =
      await request.json();

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    const grade =
      body.grade || "5";

    const subject =
      body.subject || "Mathematics";

    const board =
      body.board || "NCERT";

    const book =
      body.book || "Math Mela";


    if (!question) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Voice question is required.",
        },
        {
          status: 400,
        }
      );

    }


    const ollamaUrl =
      getOllamaGenerateUrl();


    console.log("");

    console.log(
      "======================================"
    );

    console.log(
      "🎙 SRIMATHY VOICE ENGINE"
    );

    console.log(
      "======================================"
    );

    console.log(
      "Provider : Ollama Local"
    );

    console.log(
      "Model    :",
      OLLAMA_MODEL
    );

    console.log(
      "Question :",
      question
    );


    const system = `
You are SRIMATHY, a friendly AI teacher for school students.

Curriculum:
Grade: ${grade}
Subject: ${subject}
Board: ${board}
Book: ${book}

Answer the student's question clearly and conversationally.

Rules:
- Keep the answer appropriate for Grade ${grade}.
- Explain mathematics step by step.
- Do not invent textbook-specific facts.
- Prefer concise spoken explanations.
- Do not use markdown tables.
- Avoid very long answers.
- Speak naturally as if talking directly to the student.
`;


    const response =
      await fetch(
        ollamaUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Accept":
              "application/json",
          },

          body:
            JSON.stringify({

              model:
                OLLAMA_MODEL,

              prompt:
                system +
                "\n\nStudent question:\n" +
                question,

              stream:
                false,

              options: {

                temperature:
                  0.4,

                num_predict:
                  300,

              },

            }),

        }
      );


    const raw =
      await response.text();


    const latencyMs =
      Math.round(
        performance.now() -
        start
      );


    if (
      !response.ok
    ) {

      throw new Error(
        `Ollama failed: HTTP ${response.status} ${raw.slice(0, 300)}`
      );

    }


    let data: any;

    try {

      data =
        JSON.parse(raw);

    } catch {

      throw new Error(
        "Ollama returned invalid JSON."
      );

    }


    const answer =
      data?.response?.trim() ||
      "";


    if (!answer) {

      throw new Error(
        "Ollama returned an empty response."
      );

    }


    console.log(
      "======================================"
    );

    console.log(
      "✅ VOICE GENERATION SUCCESS"
    );

    console.log(
      "Provider : Ollama Local"
    );

    console.log(
      "Model    :",
      OLLAMA_MODEL
    );

    console.log(
      "Latency  :",
      `${latencyMs} ms`
    );

    console.log(
      "======================================"
    );


    return NextResponse.json({

      success:
        true,

      answer,

      provider:
        "Ollama Local",

      model:
        OLLAMA_MODEL,

      aiLatencyMs:
        latencyMs,

      runtime:
        "OFFLINE",

    });

  } catch (error) {

    console.error(
      "❌ /api/voice failed:",
      error
    );


    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Voice AI failed.",

      },
      {
        status: 500,
      }
    );

  }

}
