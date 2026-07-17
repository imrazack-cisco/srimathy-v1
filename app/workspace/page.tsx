"use client";

import { useState } from "react";

import Sidebar from "@/components/sidebar/Sidebar";
import PromptBox from "@/components/workspace/PromptBox";
import MarkdownViewer from "@/components/workspace/MarkdownViewer";
import WorkspaceTabs from "@/components/workspace/WorkspaceTabs";

export default function WorkspacePage() {
  const [lesson, setLesson] = useState("");
  const [worksheet, setWorksheet] = useState("");
  const [quiz, setQuiz] = useState("");
  const [teacher, setTeacher] = useState("");

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

        <div className="mt-10">
          <PromptBox
            onLessonGenerated={setLesson}
            onWorksheetGenerated={setWorksheet}
            onQuizGenerated={setQuiz}
            onTeacherGenerated={setTeacher}
          />
        </div>

        <WorkspaceTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {activeTab === "Lesson" && lesson && (
          <div className="mt-8">
            <MarkdownViewer markdown={lesson} />
          </div>
        )}

        {activeTab === "Worksheet" && worksheet && (
          <div className="mt-8">
            <MarkdownViewer markdown={worksheet} />
          </div>
        )}

        {activeTab === "Quiz" && quiz && (
          <div className="mt-8">
            <MarkdownViewer markdown={quiz} />
          </div>
        )}

        {activeTab === "Teacher Notes" && teacher && (
          <div className="mt-8">
            <MarkdownViewer markdown={teacher} />
          </div>
        )}

      </section>

    </main>
  );
}