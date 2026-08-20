import fs from "fs";
import path from "path";


/* ============================================================
   TYPES
   ============================================================ */

export interface AgentTelemetry {
  name: string;

  latency: number;

  status:
    | "success"
    | "error";
}


export interface TelemetryRecord {

  id: string;

  timestamp: string;

  model: string;

  provider: string;

  runtime:
    | "offline"
    | "online";

  totalLatency: number;

  agents: AgentTelemetry[];

  success: boolean;
}


export interface TelemetryMetrics {

  requests: number;

  successfulRequests: number;

  failedRequests: number;

  averageLatency: number;

  p50Latency: number;

  p95Latency: number;

  p99Latency: number;

  minimumLatency: number;

  maximumLatency: number;
}


/* ============================================================
   PERSISTENCE
   ============================================================ */

const DATA_DIRECTORY =
  path.join(
    process.cwd(),
    "data",
    "research"
  );


const DATA_FILE =
  path.join(
    DATA_DIRECTORY,
    "telemetry.json"
  );


const MAX_RECORDS = 1000;


/* ============================================================
   ENSURE STORAGE EXISTS
   ============================================================ */

function ensureStorage() {

  if (
    !fs.existsSync(
      DATA_DIRECTORY
    )
  ) {

    fs.mkdirSync(
      DATA_DIRECTORY,
      {
        recursive: true,
      }
    );

  }


  if (
    !fs.existsSync(
      DATA_FILE
    )
  ) {

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        [],
        null,
        2
      ),
      "utf-8"
    );

  }

}


/* ============================================================
   READ ALL RECORDS
   ============================================================ */

function readRecords(): TelemetryRecord[] {

  ensureStorage();


  try {

    const raw =
      fs.readFileSync(
        DATA_FILE,
        "utf-8"
      );


    if (!raw.trim()) {
      return [];
    }


    const parsed =
      JSON.parse(raw);


    if (
      !Array.isArray(parsed)
    ) {

      console.warn(
        "Telemetry store is not an array. Resetting."
      );

      return [];

    }


    return parsed as TelemetryRecord[];

  } catch (error) {

    console.error(
      "❌ Failed to read telemetry store:",
      error
    );

    return [];

  }

}


/* ============================================================
   WRITE ALL RECORDS
   ============================================================ */

function writeRecords(
  records: TelemetryRecord[]
) {

  ensureStorage();


  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      records,
      null,
      2
    ),
    "utf-8"
  );

}


/* ============================================================
   RECORD TELEMETRY
   ============================================================ */

export function recordTelemetry(
  record: TelemetryRecord
) {

  const records =
    readRecords();


  records.unshift(
    record
  );


  /*
   * Keep the latest 1000
   * experimental observations.
   */

  const trimmed =
    records.slice(
      0,
      MAX_RECORDS
    );


  writeRecords(
    trimmed
  );


  console.log(
    "💾 Telemetry persisted:",
    record.id
  );

}


/* ============================================================
   GET ALL TELEMETRY
   ============================================================ */

export function getTelemetry(): TelemetryRecord[] {

  return readRecords();

}


/* ============================================================
   GET LATEST
   ============================================================ */

export function getLatestTelemetry():
  TelemetryRecord | null {

  const records =
    readRecords();


  return (
    records[0] ??
    null
  );

}


/* ============================================================
   PERCENTILE CALCULATION
   ============================================================ */

function percentile(
  values: number[],
  percentileValue: number
): number {

  if (
    values.length === 0
  ) {

    return 0;

  }


  const sorted =
    [...values].sort(
      (a, b) => a - b
    );


  const index =
    Math.ceil(
      (percentileValue / 100) *
        sorted.length
    ) - 1;


  return Math.round(
    sorted[
      Math.max(
        0,
        Math.min(
          index,
          sorted.length - 1
        )
      )
    ]
  );

}


/* ============================================================
   CALCULATE RESEARCH METRICS
   ============================================================ */

export function getTelemetryMetrics():
  TelemetryMetrics {

  const records =
    readRecords();


  if (
    records.length === 0
  ) {

    return {

      requests: 0,

      successfulRequests: 0,

      failedRequests: 0,

      averageLatency: 0,

      p50Latency: 0,

      p95Latency: 0,

      p99Latency: 0,

      minimumLatency: 0,

      maximumLatency: 0,

    };

  }


  const latencies =
    records
      .map(
        (record) =>
          record.totalLatency
      )
      .filter(
        (latency) =>
          Number.isFinite(
            latency
          )
      );


  if (
    latencies.length === 0
  ) {

    return {

      requests: records.length,

      successfulRequests:
        records.filter(
          (record) =>
            record.success
        ).length,

      failedRequests:
        records.filter(
          (record) =>
            !record.success
        ).length,

      averageLatency: 0,

      p50Latency: 0,

      p95Latency: 0,

      p99Latency: 0,

      minimumLatency: 0,

      maximumLatency: 0,

    };

  }


  const total =
    latencies.reduce(
      (sum, latency) =>
        sum + latency,
      0
    );


  const average =
    total /
    latencies.length;


  return {

    requests:
      records.length,

    successfulRequests:
      records.filter(
        (record) =>
          record.success
      ).length,

    failedRequests:
      records.filter(
        (record) =>
          !record.success
      ).length,

    averageLatency:
      Math.round(
        average
      ),

    p50Latency:
      percentile(
        latencies,
        50
      ),

    p95Latency:
      percentile(
        latencies,
        95
      ),

    p99Latency:
      percentile(
        latencies,
        99
      ),

    minimumLatency:
      Math.min(
        ...latencies
      ),

    maximumLatency:
      Math.max(
        ...latencies
      ),

  };

}


/* ============================================================
   CLEAR TELEMETRY
   ============================================================ */

export function clearTelemetry() {

  writeRecords([]);

  console.log(
    "🗑️ Research telemetry cleared."
  );

}


/* ============================================================
   STORAGE INFORMATION
   ============================================================ */

export function getTelemetryStorageInfo() {

  const records =
    readRecords();


  return {

    file:
      DATA_FILE,

    records:
      records.length,

    maxRecords:
      MAX_RECORDS,

  };

}