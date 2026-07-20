"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Clock3,
  DollarSign,
  Brain,
  Server,
  Timer,
} from "lucide-react";

type RuntimeMetrics = {
  online: boolean;
  model: string;
  installedModels: number;
  promptCount: number;
  averageResponseTime: number;
  lastResponseTime: number;
  uptime: number;
  apiCost: string;
};

export default function MetricsCard() {
  const [metrics, setMetrics] = useState<RuntimeMetrics | null>(null);

  useEffect(() => {
    load();

    const timer = setInterval(load, 2000);

    return () => clearInterval(timer);
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/runtime");

      const json = await res.json();

      setMetrics(json);
    } catch (err) {
      console.error(err);
    }
  }

  function formatUptime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}m ${secs}s`;
  }

  return (
    <div className="rounded-3xl border border-purple-500/20 bg-slate-900 p-6 shadow-xl">

      <div className="flex items-center gap-3 mb-6">

        <Activity
          size={28}
          className="text-purple-400"
        />

        <div>

          <h2 className="text-2xl font-bold">

            Live AI Metrics

          </h2>

          <p className="text-sm text-slate-400">

            Real-Time Runtime Statistics

          </p>

        </div>

      </div>

      <div className="space-y-3">

        <MetricRow
          icon={<Brain size={18} />}
          label="Current Model"
          value={metrics?.model ?? "--"}
        />

        <MetricRow
          icon={<Server size={18} />}
          label="Installed Models"
          value={`${metrics?.installedModels ?? 0}`}
        />

        <MetricRow
          icon={<Activity size={18} />}
          label="Prompt Count"
          value={`${metrics?.promptCount ?? 0}`}
        />

        <MetricRow
          icon={<Clock3 size={18} />}
          label="Last Response"
          value={`${metrics?.lastResponseTime ?? 0} ms`}
        />

        <MetricRow
          icon={<Timer size={18} />}
          label="Average Response"
          value={`${metrics?.averageResponseTime ?? 0} ms`}
        />

        <MetricRow
          icon={<Clock3 size={18} />}
          label="Uptime"
          value={formatUptime(metrics?.uptime ?? 0)}
        />

        <MetricRow
          icon={<DollarSign size={18} />}
          label="API Cost"
          value={metrics?.apiCost ?? "$0"}
        />

      </div>

      <div className="mt-6 rounded-xl border border-purple-500/20 bg-purple-500/10 p-4">

        <div className="text-sm text-purple-300">

          Dashboard refreshes automatically every 2 seconds.

        </div>

      </div>

    </div>
  );
}

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-800 p-3">

      <div className="flex items-center gap-3">

        <div className="text-purple-400">

          {icon}

        </div>

        <span>{label}</span>

      </div>

      <span className="font-bold text-purple-300">

        {value}

      </span>

    </div>
  );
}