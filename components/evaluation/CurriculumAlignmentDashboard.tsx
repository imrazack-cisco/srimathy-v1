"use client";

import { useCallback, useEffect, useState } from "react";

type CurriculumCase = {
  id: string;
  name: string;
  grade: string | null;
  subject: string | null;
  query: string | null;
  retrieved: boolean | null;
  chapterMatch: boolean | null;
  chapter: string | null;
  rank: number | null;
  alignmentScore: number | null;
  topicCoverage: number | null;
  keywordCoverage: number | null;
};

type CurriculumResponse = {
  success: boolean;
  measured: boolean;
  sourceFile: string | null;
  generatedAt: string | null;
  benchmark?: string;
  totalCases: number;
  metrics: {
    retrievalAccuracy: number | null;
    chapterAccuracy: number | null;
    topicCoverage: number | null;
    keywordCoverage: number | null;
    overallAlignment: number | null;
  };
  cases: CurriculumCase[];
  message?: string;
};

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Not measured";
  }

  return `${value.toFixed(1)}%`;
}

function status(value: boolean | null) {
  if (value === true) return "PASS";
  if (value === false) return "FAIL";
  return "N/A";
}

function statusClass(value: boolean | null) {
  if (value === true) return "text-emerald-400";
  if (value === false) return "text-red-400";
  return "text-slate-500";
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div className="mt-3 text-2xl font-bold text-cyan-400">
        {value}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
      <div className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div className="mt-2 break-all text-sm font-semibold text-slate-200">
        {value}
      </div>
    </div>
  );
}

export default function CurriculumAlignmentDashboard() {
  const [data, setData] =
    useState<CurriculumResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [lastChecked, setLastChecked] =
    useState<Date | null>(null);

  const loadBenchmark = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else if (!data) {
          setLoading(true);
        }

        const response = await fetch(
          "/api/benchmark/curriculum-alignment",
          {
            method: "GET",
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const json =
          (await response.json()) as CurriculumResponse;

        setData(json);
        setError(null);
        setLastChecked(new Date());
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load curriculum benchmark."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [data]
  );

  /*
   * Initial load.
   */
  useEffect(() => {
    void loadBenchmark(true);
  }, []);

  /*
   * LIVE POLLING
   *
   * Every 5 seconds the dashboard asks the API
   * for the latest benchmark JSON.
   *
   * This means:
   *
   * benchmark runs
   *      ↓
   * new JSON generated
   *      ↓
   * API exposes newest result
   *      ↓
   * dashboard detects it
   *      ↓
   * metrics update automatically
   */
  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadBenchmark(false);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadBenchmark]);

  const metrics = data?.metrics;

  return (
    <section className="mt-10 rounded-2xl border border-cyan-500/20 bg-[#070d1f] p-6 shadow-xl">

      {/* ===================================================== */}
      {/* HEADER                                                */}
      {/* ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

        <div>

          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            ACADEMIC VALIDATION
          </div>

          <h2 className="mt-2 text-2xl font-bold text-white">
            📚 NCERT Curriculum Alignment
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Rigorous validation of SRIMATHY&apos;s Curriculum Mapper
            and retrieval pipeline against NCERT-aligned
            curriculum benchmarks.
          </p>

        </div>

        <div className="flex items-center gap-3">

          {/* LIVE INDICATOR */}

          <span className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400">

            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>

            LIVE

          </span>

          <span
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              data?.measured
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {data?.measured
              ? "MEASURED DATA"
              : "NOT MEASURED"}
          </span>

          <button
            onClick={() => void loadBenchmark(true)}
            disabled={refreshing}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

        </div>
      </div>

      {/* ===================================================== */}
      {/* LIVE STATUS                                           */}
      {/* ===================================================== */}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">

        <span>
          ● Auto-refresh every 5 seconds
        </span>

        {lastChecked && (
          <span>
            Last checked:{" "}
            {lastChecked.toLocaleTimeString()}
          </span>
        )}

        {data?.generatedAt && (
          <span>
            Benchmark generated:{" "}
            {new Date(
              data.generatedAt
            ).toLocaleString()}
          </span>
        )}

      </div>

      {/* ===================================================== */}
      {/* ERROR                                                 */}
      {/* ===================================================== */}

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Unable to load benchmark: {error}
        </div>
      )}

      {/* ===================================================== */}
      {/* LOADING                                               */}
      {/* ===================================================== */}

      {loading && !data && (
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="text-sm text-slate-400">
            Loading latest NCERT benchmark...
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* NO DATA                                               */}
      {/* ===================================================== */}

      {!loading &&
        data &&
        !data.measured && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">

            <div className="text-lg font-semibold text-white">
              No NCERT benchmark measured yet
            </div>

            <p className="mt-2 text-sm text-slate-400">
              Run the curriculum alignment benchmark to
              populate this dashboard with empirical results.
            </p>

          </div>
        )}

      {/* ===================================================== */}
      {/* METRICS                                               */}
      {/* ===================================================== */}

      {data?.measured && (
        <>

          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">

            <Metric
              label="Overall Alignment"
              value={formatPercent(
                metrics?.overallAlignment
              )}
            />

            <Metric
              label="Retrieval Accuracy"
              value={formatPercent(
                metrics?.retrievalAccuracy
              )}
            />

            <Metric
              label="Chapter Accuracy"
              value={formatPercent(
                metrics?.chapterAccuracy
              )}
            />

            <Metric
              label="Topic Coverage"
              value={formatPercent(
                metrics?.topicCoverage
              )}
            />

            <Metric
              label="Keyword Coverage"
              value={formatPercent(
                metrics?.keywordCoverage
              )}
            />

          </div>

          {/* ================================================= */}
          {/* META                                               */}
          {/* ================================================= */}

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

            <Info
              label="Benchmark Cases"
              value={String(
                data.totalCases
              )}
            />

            <Info
              label="Benchmark"
              value={
                data.benchmark ??
                "curriculum-alignment"
              }
            />

            <Info
              label="Latest Run"
              value={
                data.generatedAt
                  ? new Date(
                      data.generatedAt
                    ).toLocaleString()
                  : "Unknown"
              }
            />

          </div>

          {/* ================================================= */}
          {/* SOURCE                                             */}
          {/* ================================================= */}

          {data.sourceFile && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 px-5 py-4">

              <div className="text-xs uppercase tracking-wider text-slate-500">
                Measurement Source
              </div>

              <div className="mt-2 break-all font-mono text-xs text-cyan-400">
                {data.sourceFile}
              </div>

            </div>
          )}

          {/* ================================================= */}
          {/* CASE RESULTS                                      */}
          {/* ================================================= */}

          {data.cases?.length > 0 && (
            <div className="mt-7">

              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                BENCHMARK CASES
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">

                <table className="w-full min-w-[900px] text-left text-sm">

                  <thead className="bg-slate-900/80">

                    <tr className="border-b border-slate-800">

                      <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500">
                        Case
                      </th>

                      <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500">
                        Grade
                      </th>

                      <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500">
                        Subject
                      </th>

                      <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500">
                        Retrieval
                      </th>

                      <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500">
                        Chapter
                      </th>

                      <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500">
                        Rank
                      </th>

                      <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500">
                        Alignment
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {data.cases.map((item) => (

                      <tr
                        key={item.id}
                        className="border-b border-slate-800/70 last:border-0 hover:bg-slate-900/50"
                      >

                        <td className="px-4 py-4">

                          <div className="font-semibold text-slate-200">
                            {item.name}
                          </div>

                          {item.query && (
                            <div className="mt-1 max-w-md text-xs text-slate-500">
                              {item.query}
                            </div>
                          )}

                        </td>

                        <td className="px-4 py-4 text-slate-400">
                          {item.grade ?? "—"}
                        </td>

                        <td className="px-4 py-4 text-slate-400">
                          {item.subject ?? "—"}
                        </td>

                        <td
                          className={`px-4 py-4 font-semibold ${statusClass(
                            item.retrieved
                          )}`}
                        >
                          {status(item.retrieved)}
                        </td>

                        <td
                          className={`px-4 py-4 font-semibold ${statusClass(
                            item.chapterMatch
                          )}`}
                        >
                          {status(item.chapterMatch)}
                        </td>

                        <td className="px-4 py-4 text-slate-400">
                          {item.rank ?? "—"}
                        </td>

                        <td className="px-4 py-4 font-semibold text-cyan-400">
                          {item.alignmentScore !== null &&
                          item.alignmentScore !== undefined
                            ? `${item.alignmentScore.toFixed(1)}%`
                            : "—"}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>
          )}

          {/* ================================================= */}
          {/* METHODOLOGY NOTE                                  */}
          {/* ================================================= */}

          <div className="mt-7 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">

            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
              VALIDATION METHODOLOGY
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Curriculum alignment is evaluated empirically using
              predefined Grade 5 benchmark cases. Retrieval,
              chapter matching, topic coverage and keyword
              coverage are measured against the NCERT-aligned
              knowledge corpus.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">

              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="text-xs text-slate-500">
                  01
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-200">
                  Retrieval
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="text-xs text-slate-500">
                  02
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-200">
                  Chapter Match
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="text-xs text-slate-500">
                  03
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-200">
                  Topic Coverage
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="text-xs text-slate-500">
                  04
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-200">
                  Keyword Coverage
                </div>
              </div>

            </div>

          </div>

        </>
      )}

    </section>
  );
}
