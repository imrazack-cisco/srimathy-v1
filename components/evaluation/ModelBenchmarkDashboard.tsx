"use client";

const benchmarks = [
  {
    provider: "OLLAMA",
    model: "Gemma 3 4B Q3_K_M",
    latency: 6733,
    latencyLabel: "6.733 s",
    tokens: "82.2 tok/s",
    mode: "Offline",
    description: "Local quantized model",
  },
  {
    provider: "OLLAMA",
    model: "Gemma 3 4B Q4_K_M",
    latency: 7277,
    latencyLabel: "7.277 s",
    tokens: "83.2 tok/s",
    mode: "Offline",
    description: "Higher-precision local model",
  },
  {
    provider: "CIRCUIT",
    model: "Gemini 3.1 Flash Lite",
    latency: 711,
    latencyLabel: "0.711 s",
    tokens: "Cloud",
    mode: "Online",
    description: "Cisco CIRCUIT cloud inference",
  },
];

export default function ModelBenchmarkDashboard() {
  const q3 = benchmarks[0];
  const q4 = benchmarks[1];
  const circuit = benchmarks[2];

  const q3Speedup = (q3.latency / circuit.latency).toFixed(1);
  const q4Speedup = (q4.latency / circuit.latency).toFixed(1);

  const q3VsQ4 =
    (((q4.latency - q3.latency) / q4.latency) * 100).toFixed(1);

  return (
    <section className="mt-10 rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>

            <h2 className="text-xl font-bold text-white">
              Q3 Model Evaluation
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-400">
            Empirical comparison of local quantized models and Cisco CIRCUIT.
          </p>
        </div>

        <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300">
          BENCHMARK COMPLETE
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-400">
            Fastest
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            0.711 s
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Cisco CIRCUIT
          </p>

          <p className="mt-3 text-sm text-cyan-300">
            {q4Speedup}× faster than Gemma Q4
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-400">
            Best Offline Latency
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            6.733 s
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Gemma 3 4B Q3_K_M
          </p>

          <p className="mt-3 text-sm text-cyan-300">
            {q3VsQ4}% faster than Q4
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-400">
            Local Throughput
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            83.2 tok/s
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Gemma 3 4B Q4_K_M
          </p>

          <p className="mt-3 text-sm text-cyan-300">
            Highest local throughput
          </p>
        </div>

      </div>

      {/* Comparison table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-700">

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">

            <thead className="bg-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-4">Provider</th>
                <th className="px-5 py-4">Model</th>
                <th className="px-5 py-4">Mode</th>
                <th className="px-5 py-4">Avg Latency</th>
                <th className="px-5 py-4">Throughput</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700">

              {benchmarks.map((benchmark) => (
                <tr
                  key={benchmark.model}
                  className="bg-slate-900 transition hover:bg-slate-800"
                >
                  <td className="px-5 py-4 font-semibold text-white">
                    {benchmark.provider}
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-200">
                      {benchmark.model}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {benchmark.description}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        benchmark.mode === "Offline"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-blue-500/10 text-blue-300"
                      }`}
                    >
                      {benchmark.mode}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-semibold text-white">
                    {benchmark.latencyLabel}
                  </td>

                  <td className="px-5 py-4 text-slate-300">
                    {benchmark.tokens}
                  </td>
                </tr>
              ))}

            </tbody>

          </table>
        </div>

      </div>

      {/* Performance comparison */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">

          <p className="text-sm font-semibold text-cyan-300">
            ⚡ CIRCUIT Performance
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Cisco CIRCUIT achieved an average latency of{" "}
            <strong className="text-white">0.711 seconds</strong>,
            approximately{" "}
            <strong className="text-white">{q3Speedup}×</strong>{" "}
            faster than Gemma Q3 and{" "}
            <strong className="text-white">{q4Speedup}×</strong>{" "}
            faster than Gemma Q4 in this benchmark.
          </p>

        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">

          <p className="text-sm font-semibold text-emerald-300">
            🔒 Offline Capability
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Gemma 3 4B Q3_K_M provides a fully local inference option,
            enabling SRIMATHY to continue operating without cloud
            connectivity or external inference services.
          </p>

        </div>

      </div>

      {/* Model selection */}
      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/60 p-5">

        <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          SRIMATHY Model Strategy
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">

          <div>
            <p className="text-xs text-slate-500">
              OFFLINE
            </p>

            <p className="mt-1 font-semibold text-white">
              Gemma 3 4B Q3_K_M
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Lower latency / local inference
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              ONLINE
            </p>

            <p className="mt-1 font-semibold text-white">
              Cisco CIRCUIT
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Lowest measured latency
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              EMBEDDINGS
            </p>

            <p className="mt-1 font-semibold text-white">
              nomic-embed-text
            </p>

            <p className="mt-1 text-xs text-slate-400">
              768-dimensional semantic retrieval
            </p>
          </div>

        </div>

      </div>

      {/* Methodology */}
      <div className="mt-5 text-xs leading-5 text-slate-500">

        <strong className="text-slate-400">
          Benchmark methodology:
        </strong>{" "}
        Three educational prompts were executed against each model.
        Latency represents measured end-to-end model generation time
        for the benchmark run. Local models were executed through
        Ollama; CIRCUIT was executed through the Cisco CIRCUIT provider.
        Results are empirical measurements from the SRIMATHY development
        environment and are intended for comparative evaluation rather
        than absolute hardware-independent performance claims.

      </div>

    </section>
  );
}
