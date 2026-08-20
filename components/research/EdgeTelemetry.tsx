"use client";

import { useEffect, useState } from "react";


/* ============================================================
   TYPES
   ============================================================ */

interface AgentTelemetry {
  name: string;

  latency: number;

  status:
    | "success"
    | "error"
    | string;
}


interface TelemetryRecord {
  id: string;

  timestamp: string;

  model: string;

  provider: string;

  runtime:
    | "offline"
    | "online"
    | string;

  totalLatency: number;

  agents: AgentTelemetry[];

  success: boolean;
}


interface TelemetryMetrics {
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


interface TelemetryResponse {
  success: boolean;

  latest:
    | TelemetryRecord
    | null;

  metrics:
    | TelemetryMetrics
    | null;

  history: TelemetryRecord[];

  storage?: {
    file: string;

    records: number;

    maxRecords: number;
  };

  error?: string;
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function EdgeTelemetry() {

  const [
    data,
    setData
  ] =
    useState<TelemetryResponse | null>(
      null
    );


  const [
    loading,
    setLoading
  ] =
    useState(true);


  const [
    error,
    setError
  ] =
    useState("");


  /* ==========================================================
     LOAD TELEMETRY
     ========================================================== */

  async function loadTelemetry() {

    try {

      const response =
        await fetch(
          "/api/telemetry",
          {
            cache: "no-store",
          }
        );


      if (!response.ok) {

        throw new Error(
          `Telemetry API returned ${response.status}`
        );

      }


      const json:
        TelemetryResponse =
        await response.json();


      setData(json);

      setError("");

    } catch (err) {

      console.error(
        "Telemetry fetch failed:",
        err
      );

      setError(
        "Telemetry unavailable"
      );

    } finally {

      setLoading(false);

    }

  }


  /* ==========================================================
     LIVE REFRESH
     ========================================================== */

  useEffect(() => {

    loadTelemetry();


    /*
     * Refresh every 2 seconds.
     *
     * This allows the workspace to automatically
     * pick up new Master Agent measurements.
     */

    const timer =
      setInterval(
        loadTelemetry,
        2000
      );


    return () =>
      clearInterval(
        timer
      );

  }, []);


  /* ==========================================================
     CURRENT DATA
     ========================================================== */

  const latest =
    data?.latest ?? null;


  const metrics =
    data?.metrics ?? null;


  /* ==========================================================
     LOADING STATE
     ========================================================== */

  if (loading) {

    return (

      <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-6">

        <div className="flex items-center gap-3">

          <div className="h-3 w-3 animate-pulse rounded-full bg-cyan-400" />

          <p className="text-slate-400">
            Loading edge telemetry...
          </p>

        </div>

      </div>

    );

  }


  /* ==========================================================
     MAIN PANEL
     ========================================================== */

  return (

    <div className="rounded-2xl border border-cyan-900/60 bg-slate-950/40 p-6">


      {/* ====================================================== */}
      {/* HEADER                                                 */}
      {/* ====================================================== */}

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Research Instrumentation
          </p>


          <h2 className="mt-2 text-2xl font-bold text-white">
            Edge AI Telemetry
          </h2>


          <p className="mt-1 text-sm text-slate-400">

            Live measurements from SRIMATHY&apos;s
            local multi-agent execution pipeline

          </p>

        </div>


        <div className="flex items-center gap-2">

          <div className="flex items-center gap-2 rounded-full border border-emerald-700 bg-emerald-950/50 px-3 py-1 text-xs font-semibold text-emerald-400">

            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

            LIVE

          </div>

        </div>

      </div>


      {/* ====================================================== */}
      {/* ERROR                                                  */}
      {/* ====================================================== */}

      {error && (

        <div className="mt-5 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">

          {error}

        </div>

      )}


      {/* ====================================================== */}
      {/* NO DATA                                                */}
      {/* ====================================================== */}

      {!latest ? (

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">

          <div className="text-3xl">
            🔬
          </div>


          <p className="mt-3 text-slate-300">

            No telemetry recorded yet.

          </p>


          <p className="mt-2 text-sm text-slate-500">

            Generate content using the Master Agent
            to begin recording edge performance.

          </p>

        </div>

      ) : (

        <>

          {/* ================================================== */}
          {/* LATEST REQUEST METRICS                             */}
          {/* ================================================== */}

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

            <Metric
              label="Model"
              value={latest.model}
            />


            <Metric
              label="Runtime"
              value={
                latest.runtime === "offline"
                  ? "100% Local"
                  : latest.runtime
              }
            />


            <Metric
              label="Total Latency"
              value={`${Math.round(
                latest.totalLatency
              )} ms`}
            />


            <Metric
              label="Status"
              value={
                latest.success
                  ? "Successful"
                  : "Failed"
              }
            />

          </div>


          {/* ================================================== */}
          {/* RESEARCH STATISTICS                               */}
          {/* ================================================== */}

          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">

            <Metric
              label="Requests"
              value={String(
                metrics?.requests ?? 0
              )}
            />


            <Metric
              label="Average"
              value={
                metrics
                  ? `${Math.round(
                      metrics.averageLatency
                    )} ms`
                  : "—"
              }
            />


            <Metric
              label="p50"
              value={
                metrics
                  ? `${Math.round(
                      metrics.p50Latency
                    )} ms`
                  : "—"
              }
            />


            <Metric
              label="p95"
              value={
                metrics
                  ? `${Math.round(
                      metrics.p95Latency
                    )} ms`
                  : "—"
              }
            />

          </div>


          {/* ================================================== */}
          {/* SECOND STATISTICS ROW                             */}
          {/* ================================================== */}

          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">

            <Metric
              label="p99"
              value={
                metrics
                  ? `${Math.round(
                      metrics.p99Latency
                    )} ms`
                  : "—"
              }
            />


            <Metric
              label="Minimum"
              value={
                metrics
                  ? `${Math.round(
                      metrics.minimumLatency
                    )} ms`
                  : "—"
              }
            />


            <Metric
              label="Maximum"
              value={
                metrics
                  ? `${Math.round(
                      metrics.maximumLatency
                    )} ms`
                  : "—"
              }
            />


            <Metric
              label="Success Rate"
              value={
                metrics &&
                metrics.requests > 0
                  ? `${Math.round(
                      (
                        metrics.successfulRequests /
                        metrics.requests
                      ) * 100
                    )}%`
                  : "—"
              }
            />

          </div>


          {/* ================================================== */}
          {/* AGENT EXECUTION BREAKDOWN                         */}
          {/* ================================================== */}

          <div className="mt-7">


            <div className="mb-3 flex items-center justify-between">

              <h3 className="font-semibold text-white">

                Agent Execution Breakdown

              </h3>


              <span className="text-xs text-slate-500">

                Latest request

              </span>

            </div>


            <div className="space-y-3">

              {latest.agents.map(
                (agent) => {

                  const percentage =
                    latest.totalLatency > 0
                      ? Math.min(
                          100,
                          (
                            agent.latency /
                            latest.totalLatency
                          ) * 100
                        )
                      : 0;


                  return (

                    <div
                      key={agent.name}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                    >

                      <div className="flex items-center justify-between">


                        {/* Agent */}

                        <div>

                          <p className="font-medium text-slate-200">

                            {agent.name}

                          </p>


                          <p className="mt-1 text-xs text-emerald-400">

                            ● {agent.status}

                          </p>

                        </div>


                        {/* Latency */}

                        <div className="text-right">

                          <p className="font-mono text-sm font-semibold text-cyan-300">

                            {Math.round(
                              agent.latency
                            )}{" "}
                            ms

                          </p>

                        </div>

                      </div>


                      {/* Latency bar */}

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">

                        <div
                          className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                          style={{
                            width:
                              `${percentage}%`,
                          }}
                        />

                      </div>


                      {/* Percentage */}

                      <div className="mt-1 text-right text-[10px] text-slate-600">

                        {percentage.toFixed(
                          1
                        )}
                        % of request

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          </div>


          {/* ================================================== */}
          {/* EXPERIMENT INFORMATION                            */}
          {/* ================================================== */}

          <div className="mt-6 border-t border-slate-800 pt-4">


            <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-slate-500">


              <span>

                Provider:{" "}

                <strong className="text-slate-300">

                  {latest.provider}

                </strong>

              </span>


              <span>

                Runtime:{" "}

                <strong className="text-slate-300">

                  {latest.runtime === "offline"
                    ? "Local / Offline"
                    : latest.runtime}

                </strong>

              </span>


              <span>

                Request:{" "}

                <strong className="font-mono text-slate-300">

                  {latest.id}

                </strong>

              </span>


              <span>

                Last measurement:{" "}

                <strong className="text-slate-300">

                  {new Date(
                    latest.timestamp
                  ).toLocaleTimeString()}

                </strong>

              </span>

            </div>

          </div>


          {/* ================================================== */}
          {/* PERSISTENCE INFORMATION                           */}
          {/* ================================================== */}

          {data?.storage && (

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-3">

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                    Local Research Store

                  </p>


                  <p className="mt-1 text-xs text-slate-400">

                    {data.storage.records} of{" "}
                    {data.storage.maxRecords} observations persisted

                  </p>

                </div>


                <div className="rounded-full border border-cyan-900 bg-cyan-950/40 px-3 py-1 text-xs text-cyan-400">

                  DEVICE LOCAL

                </div>

              </div>

            </div>

          )}

        </>

      )}

    </div>

  );
}


/* ============================================================
   METRIC CARD
   ============================================================ */

function Metric({
  label,
  value,
}: {
  label: string;

  value: string;
}) {

  return (

    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">

      <p className="text-xs uppercase tracking-wide text-slate-500">

        {label}

      </p>


      <p className="mt-2 text-lg font-semibold text-cyan-300">

        {value}

      </p>

    </div>

  );
}