"use client";

import {
  CheckCircle2,
  Server,
  Brain,
  FileText,
  BookOpen,
  ClipboardList,
  GraduationCap,
} from "lucide-react";

const services = [
  {
    icon: <Server size={18} />,
    name: "Ollama Service",
    status: "Running",
  },
  {
    icon: <Brain size={18} />,
    name: "Master Agent",
    status: "Healthy",
  },
  {
    icon: <BookOpen size={18} />,
    name: "Lesson Agent",
    status: "Ready",
  },
  {
    icon: <ClipboardList size={18} />,
    name: "Quiz Agent",
    status: "Ready",
  },
  {
    icon: <GraduationCap size={18} />,
    name: "Teacher Agent",
    status: "Ready",
  },
  {
    icon: <FileText size={18} />,
    name: "Markdown Renderer",
    status: "Online",
  },
];

export default function HealthCard() {
  return (
    <div className="rounded-3xl border border-green-500/20 bg-slate-900 p-6 shadow-xl">

      <div className="flex items-center gap-3 mb-6">

        <CheckCircle2
          size={28}
          className="text-green-400"
        />

        <div>

          <h2 className="text-2xl font-bold">
            System Health
          </h2>

          <p className="text-sm text-slate-400">
            Runtime Components
          </p>

        </div>

      </div>

      <div className="space-y-3">

        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between rounded-xl bg-slate-800 p-3"
          >
            <div className="flex items-center gap-3">

              <div className="text-green-400">
                {service.icon}
              </div>

              <span>{service.name}</span>

            </div>

            <div className="flex items-center gap-2">

              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />

              <span className="font-semibold text-green-400">
                {service.status}
              </span>

            </div>

          </div>
        ))}

      </div>

      <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/10 p-4">

        <div className="text-sm text-green-300">

          ✓ All AI services are operational.

        </div>

      </div>

    </div>
  );
}