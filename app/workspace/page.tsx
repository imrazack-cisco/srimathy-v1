"use client";

import { useState } from "react";

import Sidebar from "@/components/sidebar/Sidebar";
import PromptBox from "@/components/workspace/PromptBox";
import MarkdownViewer from "@/components/workspace/MarkdownViewer";
import WorkspaceTabs from "@/components/workspace/WorkspaceTabs";

export default function WorkspacePage() {
  const [lesson, setLesson] = useState("");
  const [worksheet, setWorksheet] = useState("");

  // NEW
  const [activeTab, setActiveTab] = useState("Lesson");

  return (
    <main className="flex min-h-screen bg-slate-900 text-white">

      <Sidebar />

      <section className="flex-1 p-12">

        <h1 className="text-5xl font-bold">
          Welcome back 👋
        </h1>

        <p className="mt-3 text-slate-400">
          What would you like to create today?
        </p>

        {/* Prompt */}

        <div className="mt-10">
          <PromptBox
            onLessonGenerated={setLesson}
            onWorksheetGenerated={setWorksheet}
          />
        </div>

        {/* Workspace Tabs */}

        <WorkspaceTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Lesson */}

        {activeTab === "Lesson" && lesson && (
          <div className="mt-8">
            <MarkdownViewer markdown={lesson} />
          </div>
        )}

        {/* Worksheet */}

        {activeTab === "Worksheet" && worksheet && (
          <div className="mt-8">
            <MarkdownViewer markdown={worksheet} />
          </div>
        )}

      </section>

    </main>
  );
}