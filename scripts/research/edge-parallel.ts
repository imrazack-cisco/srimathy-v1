import { masterAgent } from "@/agents/master";
import {
  getTelemetryMetrics,
  getTelemetry,
} from "@/lib/telemetry/telemetryStore";


/* ============================================================
   SRIMATHY EDGE BASELINE EXPERIMENT
   ============================================================

   Purpose:
   Establish a reproducible latency baseline for the
   offline-first SRIMATHY Master Agent.

   Experiment:
   - Controlled educational prompts
   - Sequential multi-agent orchestration
   - Local Ollama inference
   - Persistent telemetry
   - p50 / p95 / p99 measurement

   ============================================================ */


const EXPERIMENT_NAME =
  "sequential-master-agent-baseline";


const PROMPTS = [

  "Explain the water cycle for Grade 5 students.",

  "Explain photosynthesis for Grade 6 students.",

  "Explain fractions for Grade 5 students.",

  "Explain the solar system for Grade 6 students.",

  "Explain gravity for Grade 7 students.",

  "Explain the states of matter for Grade 6 students.",

  "Explain the food chain for Grade 5 students.",

  "Explain the human digestive system for Grade 7 students.",

  "Explain evaporation and condensation for Grade 6 students.",

  "Explain renewable and non-renewable energy for Grade 7 students.",

];


async function main() {

  console.log("\n");
  console.log(
    "=================================================="
  );
  console.log(
    "🔬 SRIMATHY EDGE BASELINE EXPERIMENT"
  );
  console.log(
    "=================================================="
  );

  console.log(
    `Experiment: ${EXPERIMENT_NAME}`
  );

  console.log(
    `Requests: ${PROMPTS.length}`
  );

  console.log(
    "Runtime: Ollama Local"
  );

  console.log(
    "Orchestration: Sequential"
  );

  console.log(
    "=================================================="
  );


  const experimentStart =
    Date.now();


  /*
   * Capture telemetry count before
   * experiment begins.
   */

  const before =
    getTelemetry().length;


  console.log(
    `\nExisting telemetry records: ${before}`
  );


  /* ==========================================================
     RUN CONTROLLED REQUESTS
     ========================================================== */

  for (
    let i = 0;
    i < PROMPTS.length;
    i++
  ) {

    const prompt =
      PROMPTS[i];


    console.log("\n");
    console.log(
      "--------------------------------------------------"
    );

    console.log(
      `🧪 Experiment Request ${i + 1}/${PROMPTS.length}`
    );

    console.log(
      `Prompt: ${prompt}`
    );

    console.log(
      "--------------------------------------------------"
    );


    const requestStart =
      Date.now();


    try {

      await masterAgent({
        topic: prompt,
      });


      const requestLatency =
        Date.now() -
        requestStart;


      console.log(
        `✅ Request ${i + 1} completed`
      );

      console.log(
        `⏱ End-to-end runtime: ${requestLatency} ms`
      );


    } catch (error) {

      console.error(
        `❌ Request ${i + 1} failed`
      );

      console.error(
        error
      );

    }

  }


  /* ==========================================================
     EXPERIMENT SUMMARY
     ========================================================== */

  const experimentDuration =
    Date.now() -
    experimentStart;


  const after =
    getTelemetry().length;


  const newRecords =
    after -
    before;


  const metrics =
    getTelemetryMetrics();


  console.log("\n");
  console.log(
    "=================================================="
  );

  console.log(
    "📊 EXPERIMENT COMPLETE"
  );

  console.log(
    "==================================================");


  console.log(
    `Experiment             : ${EXPERIMENT_NAME}`
  );

  console.log(
    `Requests attempted     : ${PROMPTS.length}`
  );

  console.log(
    `New telemetry records  : ${newRecords}`
  );

  console.log(
    `Experiment duration    : ${experimentDuration} ms`
  );


  console.log("\n");
  console.log(
    "LATENCY STATISTICS"
  );

  console.log(
    "--------------------------------------------------"
  );


  console.log(
    `Average latency        : ${metrics.averageLatency} ms`
  );

  console.log(
    `p50 latency            : ${metrics.p50Latency} ms`
  );

  console.log(
    `p95 latency            : ${metrics.p95Latency} ms`
  );

  console.log(
    `p99 latency            : ${metrics.p99Latency} ms`
  );

  console.log(
    `Minimum latency        : ${metrics.minimumLatency} ms`
  );

  console.log(
    `Maximum latency        : ${metrics.maximumLatency} ms`
  );


  console.log("\n");
  console.log(
    "RELIABILITY"
  );

  console.log(
    "--------------------------------------------------"
  );


  console.log(
    `Successful requests    : ${metrics.successfulRequests}`
  );

  console.log(
    `Failed requests        : ${metrics.failedRequests}`
  );


  const successRate =
    metrics.requests > 0
      ? (
          metrics.successfulRequests /
          metrics.requests
        ) * 100
      : 0;


  console.log(
    `Success rate           : ${successRate.toFixed(1)}%`
  );


  console.log(
    "=================================================="
  );


  console.log(
    "\n💾 Results persisted in:"
  );

  console.log(
    "data/research/telemetry.json"
  );


  console.log(
    "\n🔬 Sequential baseline established."
  );


  console.log(
    "==================================================\n"
  );

}


main().catch(
  (error) => {

    console.error(
      "\n❌ Experiment failed:"
    );

    console.error(
      error
    );

    process.exit(
      1
    );

  }
);