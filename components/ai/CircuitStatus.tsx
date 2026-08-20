"use client";

import { useEffect, useState } from "react";

type CircuitStatusData = {
  success: boolean;
  provider: string;
  model: string;
  status: "ONLINE" | "OFFLINE";
  response?: string;
  latencyMs?: number;
  error?: string;
  testedAt?: string;
};

export default function CircuitStatus() {
  const [data, setData] = useState<CircuitStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  async function testCircuit() {
    setLoading(true);

    try {
      const res = await fetch("/api/circuit/test", {
        cache: "no-store",
      });

      const result = await res.json();
      setData(result);
    } catch (error) {
      setData({
        success: false,
        provider: "CIRCUIT",
        model: "Unknown",
        status: "OFFLINE",
        error:
          error instanceof Error
            ? error.message
            : "Unable to reach CIRCUIT",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    testCircuit();
  }, []);

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            CIRCUIT Backup
          </h2>

          <p className="text-sm text-slate-400">
            Cisco cloud AI fallback
          </p>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
            data?.status === "ONLINE"
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          <span className="text-xs">●</span>
          {loading ? "Testing..." : data?.status}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between rounded-lg bg-slate-800/80 px-4 py-3">
          <span className="text-slate-400">Model</span>
          <span className="font-medium text-cyan-400">
            {data?.model ?? "—"}
          </span>
        </div>

        <div className="flex justify-between rounded-lg bg-slate-800/80 px-4 py-3">
          <span className="text-slate-400">Provider</span>
          <span className="font-medium text-white">
            Cisco CIRCUIT
          </span>
        </div>

        <div className="flex justify-between rounded-lg bg-slate-800/80 px-4 py-3">
          <span className="text-slate-400">Latency</span>
          <span className="font-medium text-purple-400">
            {data?.latencyMs != null
              ? `${data.latencyMs} ms`
              : "—"}
          </span>
        </div>

        <div className="flex justify-between rounded-lg bg-slate-800/80 px-4 py-3">
          <span className="text-slate-400">Test</span>
          <span
            className={
              data?.success
                ? "font-medium text-emerald-400"
                : "font-medium text-red-400"
            }
          >
            {data?.success
              ? "✓ PASSED"
              : "✕ FAILED"}
          </span>
        </div>
      </div>

      {data?.error && (
        <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          {data.error}
        </div>
      )}

      <button
        onClick={testCircuit}
        disabled={loading}
        className="mt-4 w-full rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/20 disabled:opacity-50"
      >
        {loading ? "Testing CIRCUIT..." : "Test CIRCUIT"}
      </button>
    </div>
  );
}