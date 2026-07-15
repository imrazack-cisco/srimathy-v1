"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  BrainCircuit,
  BarChart3,
  Settings,
  GraduationCap,
} from "lucide-react";

const menu = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/workspace",
  },
  {
    icon: BrainCircuit,
    label: "Workspace",
    href: "/workspace",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    href: "/analytics",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-slate-950 text-white flex flex-col border-r border-slate-800">
      <div className="flex items-center gap-3 px-8 py-8 text-3xl font-bold">
        <GraduationCap className="text-cyan-400" />
        SRIMATHY
      </div>

      <nav className="flex flex-col mt-8 gap-2 px-4">
        {menu.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-4 rounded-xl px-5 py-4 hover:bg-slate-800 transition"
          >
            <item.icon size={22} />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}