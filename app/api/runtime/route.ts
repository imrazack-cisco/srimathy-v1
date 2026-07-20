import { NextResponse } from "next/server";
import { runtimeMetrics } from "@/app/lib/runtimeMetrics";

const OLLAMA = "http://localhost:11434/api/tags";

export async function GET() {

  try {

    const res = await fetch(OLLAMA);

    const data = await res.json();

    runtimeMetrics.currentModel =
      data.models?.[0]?.name ?? "";

    return NextResponse.json({

      online: true,

      model: runtimeMetrics.currentModel,

      installedModels:
        data.models?.length ?? 0,

      promptCount:
        runtimeMetrics.promptCount,

      averageResponseTime:
        runtimeMetrics.averageResponseTime,

      lastResponseTime:
        runtimeMetrics.lastResponseTime,

      uptime:
        runtimeMetrics.uptimeSeconds,

      apiCost: "$0"

    });

  } catch {

    return NextResponse.json({

      online: false,

      model: "Offline",

      installedModels: 0,

      promptCount:
        runtimeMetrics.promptCount,

      averageResponseTime:
        runtimeMetrics.averageResponseTime,

      lastResponseTime:
        runtimeMetrics.lastResponseTime,

      uptime:
        runtimeMetrics.uptimeSeconds,

      apiCost: "$0"

    });

  }

}