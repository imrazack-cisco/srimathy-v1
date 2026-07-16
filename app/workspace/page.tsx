"use client";

import { useState } from "react";

import Sidebar from "@/components/sidebar/Sidebar";
import PromptBox from "@/components/workspace/PromptBox";
import LessonViewer from "@/components/workspace/LessonViewer";
import RecentProjects from "@/components/workspace/RecentProjects";
import AIStatus from "@/components/workspace/AIStatus";

export default function WorkspacePage() {
  const [lesson, setLesson] = useState("");

  return (
    <main className="flex h-screen bg-slate-900 text-white">

      <Sidebar />

      <section className="flex-1 overflow-y-auto p-12">

        <h1 className="text-5xl font-bold">
          Welcome back 👋
        </h1>

        <p className="mt-3 text-slate-400">
          What would you like to create today?
        </p>

        <PromptBox onLessonGenerated={setLesson} />

        <LessonViewer lesson={lesson} />

        <div className="grid grid-cols-2 gap-8 mt-10">
          <RecentProjects />
          <AIStatus />
        </div>

      </section>

    </main>
  );
}