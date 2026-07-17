"use client";

import { useState } from "react";

interface PromptBoxProps {
  onLessonGenerated: (lesson: string) => void;
  onWorksheetGenerated: (worksheet: string) => void;
  onQuizGenerated: (quiz: string) => void;
  onTeacherGenerated: (teacher: string) => void;
}

export default function PromptBox({
  onLessonGenerated,
  onWorksheetGenerated,
  onQuizGenerated,
  onTeacherGenerated,
}: PromptBoxProps) {

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateLesson() {
    if (!prompt.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent: "master",
          prompt,
        }),
      });

      const text = await res.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        console.error("API did not return JSON.");
        console.error("Status:", res.status);
        console.error(text);

        throw new Error(
          "Server returned non-JSON response. Check VS Code terminal logs."
        );
      }

      if (!res.ok || !data.success) {
        console.error("API Error:");
        console.error(data);

        throw new Error(
          data.error ||
          `Generation failed with status ${res.status}`
        );
      }

      const payload = data.data ?? data;

      const lessonContent =
        payload.lesson?.content ??
        payload.lesson ??
        "";

      const worksheetContent =
        payload.worksheet?.content ??
        payload.worksheet ??
        "";

      const quizContent =
        payload.quiz?.content ??
        payload.quiz ??
        "";

      const teacherContent =
        payload.teacher?.content ??
        payload.teacher ??
        "";

      if (
        !lessonContent &&
        !worksheetContent &&
        !quizContent &&
        !teacherContent
      ) {
        console.error("Unexpected API Response:");
        console.error(payload);

        throw new Error(
          "Generation completed but no content was returned."
        );
      }

      onLessonGenerated(
        typeof lessonContent === "string"
          ? lessonContent
          : JSON.stringify(lessonContent, null, 2)
      );

      onWorksheetGenerated(
        typeof worksheetContent === "string"
          ? worksheetContent
          : JSON.stringify(worksheetContent, null, 2)
      );

      onQuizGenerated(
        typeof quizContent === "string"
          ? quizContent
          : JSON.stringify(quizContent, null, 2)
      );

      onTeacherGenerated(
        typeof teacherContent === "string"
          ? teacherContent
          : JSON.stringify(teacherContent, null, 2)
      );

      setPrompt("");

    } catch (err) {

      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Generation failed."
      );

    } finally {

      setLoading(false);

    }
  }

  return (
    <div className="rounded-xl bg-slate-800 p-8 shadow-xl">

      <textarea
        className="
          h-56
          w-full
          rounded-xl
          bg-slate-700
          p-5
          text-lg
          text-white
          outline-none
          placeholder:text-slate-400
          focus:ring-2
          focus:ring-cyan-500
        "
        placeholder={`Examples:

• Fractions for Grade 5
• Introduction to Variables
• Newton's Laws
• Photosynthesis
• Cisco Networking Basics
`}
        value={prompt}
        disabled={loading}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={generateLesson}
        disabled={loading}
        className="
          mt-6
          rounded-lg
          bg-cyan-500
          px-8
          py-3
          font-semibold
          hover:bg-cyan-400
          disabled:opacity-50
        "
      >
        {loading
          ? "Generating..."
          : "Generate Lesson"}
      </button>

      {loading && (
        <p className="mt-4 text-cyan-300 animate-pulse">
          🤖 SRIMATHY is generating Lesson, Worksheet, Quiz & Teacher Notes...
        </p>
      )}

    </div>
  );
}