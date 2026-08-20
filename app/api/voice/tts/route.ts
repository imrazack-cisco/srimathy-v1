import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const text =
      String(body.text || "").trim();

    if (!text) {
      return NextResponse.json(
        {
          error: "No text supplied.",
        },
        { status: 400 }
      );
    }

    /*
     * ============================================================
     * CIRCUIT TTS
     * ============================================================
     *
     * We deliberately do NOT send this to CIRCUIT_URL because
     * the existing CIRCUIT_URL is a text-generation endpoint.
     *
     * Once Cisco gives us the CIRCUIT TTS endpoint/schema,
     * configure:
     *
     * CIRCUIT_TTS_URL=
     * CIRCUIT_TTS_MODEL=gemini-3.1-flash-tts-preview
     *
     * ============================================================
     */

    const ttsUrl =
      process.env.CIRCUIT_TTS_URL;

    const ttsModel =
      process.env.CIRCUIT_TTS_MODEL ||
      "gemini-3.1-flash-tts-preview";

    if (!ttsUrl) {
      return NextResponse.json(
        {
          error:
            "CIRCUIT_TTS_URL is not configured.",
        },
        { status: 503 }
      );
    }

    const apiKey =
      process.env.CIRCUIT_API_KEY;

    const appKey =
      process.env.CIRCUIT_APP_KEY;

    if (!apiKey || !appKey) {
      return NextResponse.json(
        {
          error:
            "CIRCUIT credentials are incomplete.",
        },
        { status: 500 }
      );
    }

    const start =
      performance.now();

    /*
     * IMPORTANT:
     *
     * This payload is intentionally isolated here.
     *
     * We should populate it according to the actual
     * CIRCUIT TTS contract rather than assuming that
     * the existing text endpoint accepts audio.
     */

    const response = await fetch(
      ttsUrl,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
          Accept:
            "application/json",
          "api-key": apiKey,
        },

        body: JSON.stringify({
          model: ttsModel,

          input: text,

          response_format: {
            type: "audio",
          },

          generation_config: {
            speech_config: {
              voice_config: {
                prebuilt_voice_config: {
                  voice_name:
                    "Kore",
                },
              },

              language_code:
                "en-IN",
            },
          },

          user: JSON.stringify({
            appkey: appKey,
          }),
        }),
      }
    );

    const latencyMs =
      Math.round(
        performance.now() -
          start
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "CIRCUIT TTS ERROR:",
        data
      );

      return NextResponse.json(
        {
          error:
            `CIRCUIT TTS failed: HTTP ${response.status}`,
        },
        {
          status: response.status,
        }
      );
    }

    /*
     * Gemini-style response.
     *
     * Depending on the CIRCUIT proxy,
     * this may be returned as inlineData
     * or output_audio.
     */

    const audioBase64 =
      data?.candidates?.[0]
        ?.content?.parts?.find(
          (part: any) =>
            part?.inlineData?.data
        )?.inlineData?.data ??
      data?.output_audio?.data ??
      data?.audio?.data;

    if (!audioBase64) {
      console.error(
        "CIRCUIT TTS returned no audio:",
        data
      );

      return NextResponse.json(
        {
          error:
            "CIRCUIT TTS returned no audio.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      provider:
        "Cisco CIRCUIT / Gemini TTS",

      model: ttsModel,

      latencyMs,

      mimeType:
        "audio/wav",

      audioBase64,
    });

  } catch (error: any) {
    console.error(
      "TTS ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "TTS failed.",
      },
      { status: 500 }
    );
  }
}