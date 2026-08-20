import {
  getTelemetry,
  getLatestTelemetry,
  getTelemetryMetrics,
  getTelemetryStorageInfo,
} from "@/lib/telemetry/telemetryStore";


export const dynamic =
  "force-dynamic";


export async function GET() {

  try {

    const latest =
      getLatestTelemetry();


    const metrics =
      getTelemetryMetrics();


    const history =
      getTelemetry();


    const storage =
      getTelemetryStorageInfo();


    return Response.json({

      success: true,

      latest,

      metrics,

      history,

      storage,

    });

  } catch (error) {

    console.error(
      "❌ Telemetry API error:",
      error
    );


    return Response.json(

      {
        success: false,

        error:
          "Unable to read telemetry",

      },

      {
        status: 500,
      }

    );

  }

}