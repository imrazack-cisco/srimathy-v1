import { NextResponse } from "next/server";
import { CircuitProvider } from "@/ai/providers/circuit";

export async function GET() {
  const start = performance.now();

  try {
    const healthy =
      await CircuitProvider.health();

    return NextResponse.json({
      success: healthy,
      provider: "CIRCUIT",
      model:
        process.env.CIRCUIT_MODEL ??
        "unknown",
      status:
        healthy
          ? "CONFIGURED"
          : "OFFLINE",
      latencyMs: Math.round(
        performance.now() - start
      ),
      testedAt:
        new Date().toISOString(),
    });

  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        provider: "CIRCUIT",
        model:
          process.env.CIRCUIT_MODEL ??
          "unknown",
        status: "OFFLINE",
        latencyMs: Math.round(
          performance.now() - start
        ),
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
        testedAt:
          new Date().toISOString(),
      },
      {
        status: 200,
      }
    );
  }
}