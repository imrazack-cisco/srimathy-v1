"use client";

import {
  Brain,
  Cpu,
  Sparkles,
  ShieldCheck,
  Wifi,
  Activity,
} from "lucide-react";

export default function DashboardHeader() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl">

      {/* Background Glow */}

      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between">

        {/* LEFT */}

        <div>

          <div className="flex items-center gap-5">

            <div className="rounded-2xl bg-cyan-500/20 p-4">

              <Brain
                size={44}
                className="text-cyan-400"
              />

            </div>

            <div>

              <h1 className="text-5xl font-extrabold tracking-tight">

                SRIMATHY AI Studio

              </h1>

              <p className="mt-3 text-lg text-slate-300">

                Offline-First Autonomous Multi-Agent Educational Platform

              </p>

            </div>

          </div>

          {/* Feature Badges */}

          <div className="mt-8 flex flex-wrap gap-3">

            <Badge
              icon={<Cpu size={16} />}
              title="Gemma 3 4B"
            />

            <Badge
              icon={<Sparkles size={16} />}
              title="Multi-Agent AI"
            />

            <Badge
              icon={<Wifi size={16} />}
              title="Offline First"
            />

            <Badge
              icon={<ShieldCheck size={16} />}
              title="Local Inference"
            />

          </div>

        </div>

        {/* RIGHT */}

        <div className="mt-8 lg:mt-0">

          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">

            <div className="flex items-center gap-3">

              <Activity
                size={20}
                className="text-green-400"
              />

              <span className="font-semibold text-green-400">

                AI Runtime Online

              </span>

            </div>

            <div className="mt-6 space-y-3 text-sm">

              <Info
                label="Model"
                value="Gemma 3 4B"
              />

              <Info
                label="Inference"
                value="Ollama"
              />

              <Info
                label="Execution"
                value="Offline"
              />

              <Info
                label="Version"
                value="v1.0"
              />

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

function Badge({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2">

      <div className="text-cyan-400">

        {icon}

      </div>

      <span className="font-medium">

        {title}

      </span>

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
    <div className="flex justify-between gap-8">

      <span className="text-slate-400">

        {label}

      </span>

      <span className="font-semibold">

        {value}

      </span>

    </div>
  );
}