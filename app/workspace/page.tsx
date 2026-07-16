"use client";

import { useState, useRef, useEffect } from "react";

import Sidebar from "@/components/sidebar/Sidebar";
import PromptBox from "@/components/workspace/PromptBox";
import MarkdownViewer from "@/components/workspace/MarkdownViewer";
import RecentProjects from "@/components/workspace/RecentProjects";
import AIStatus from "@/components/workspace/AIStatus";

export default function WorkspacePage() {

  const [lesson, setLesson] = useState("");

  const [worksheet, setWorksheet] = useState("");

  const lessonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lesson) {
      lessonRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [lesson]);

  return (
    <main className="flex min-h-screen bg-slate-900 text-white">

      <Sidebar />

      <section className="flex-1 overflow-y-auto p-12">

        <h1 className="text-5xl font-bold">
          Welcome back 👋
        </h1>

        <p className="mt-3 text-slate-400">
          What would you like to create today?
        </p>

        <PromptBox onLessonGenerated={setLesson} 
        onWorksheetGenerated={setWorksheet} 
        />

        {lesson && (

          <div
            ref={lessonRef}
            className="mt-10 rounded-xl bg-slate-800 p-8"
          >

            <h2 className="mb-6 text-3xl font-bold">
              📘 Lesson
            </h2>

            <MarkdownViewer content={lesson} />

          </div>

        )}

        {worksheet && (

          <div className="mt-10 rounded-xl bg-slate-800 p-8">

            <h2 className="mb-6 text-3xl font-bold">
              📝 Worksheet
            </h2>

            <MarkdownViewer content={worksheet} />

          </div>

        )}

        <div className="mt-10 grid grid-cols-2 gap-8">

          <RecentProjects />

          <AIStatus />

        </div>

      </section>

    </main>
  );
}