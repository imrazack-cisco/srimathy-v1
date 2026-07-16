"use client";

import { useState } from "react";

interface PromptBoxProps {
  onLessonGenerated: (lesson: string) => void;
}

export default function PromptBox({
  onLessonGenerated,
}: PromptBoxProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateLesson() {
    if (!prompt.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      const data = await res.json();

      if (data.content) {
        onLessonGenerated(data.content);

        // Clear prompt after successful generation
        setPrompt("");
      } else {
        alert(data.error || "Generation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Unable to generate lesson.");
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
          transition
        "
        placeholder={`Examples:

• Fractions for Grade 5
• Introduction to Variables
• Newton's Laws
• Photosynthesis
• World War II
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
          flex
          items-center
          gap-3
          rounded-lg
          bg-cyan-500
          px-8
          py-3
          font-semibold
          transition-all
          hover:bg-cyan-400
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {loading && (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        )}

        {loading ? "Generating Lesson..." : "Generate"}
      </button>

      {loading && (
        <p className="mt-4 text-sm text-cyan-300 animate-pulse">
          🤖 SRIMATHY is preparing your lesson...
        </p>
      )}
    </div>
  );
}