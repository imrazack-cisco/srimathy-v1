"use client";

import { useState } from "react";

interface PromptBoxProps {
  onLessonGenerated: (lesson: string) => void;
  onWorksheetGenerated?:(worksheet:string)=>void;
}

export default function PromptBox({
  onLessonGenerated,
  onWorksheetGenerated,
}: PromptBoxProps): import("react").JSX.Element {
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
          agent: "curriculum",
          prompt: prompt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed.");
      }

      // Curriculum Agent returns:
      // {
      //   title: "...",
      //   content: "..."
      // }

      onLessonGenerated(data.content);

      if (
  onWorksheetGenerated
) {
  console.log(
    "Worksheet Agent ready."
  );
}

      setPrompt("");
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Unable to generate lesson."
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
          transition
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

        {loading ? "Generating Lesson..." : "Generate Lesson"}
      </button>

      {loading && (
        <p className="mt-4 animate-pulse text-sm text-cyan-300">
          🤖 SRIMATHY Curriculum Agent is creating your lesson...
        </p>
      )}
    </div>
  );
}