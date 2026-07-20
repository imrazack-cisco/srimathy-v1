"use client";

import DashboardHeader from "@/components/ai/DashboardHeader";
import RuntimeCard from "@/components/ai/RuntimeCard";
import HealthCard from "@/components/ai/HealthCard";
import MetricsCard from "@/components/ai/MetricsCard";



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

        <DashboardHeader />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

    <RuntimeCard />

    <HealthCard />

</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

    <MetricsCard />

</div>



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