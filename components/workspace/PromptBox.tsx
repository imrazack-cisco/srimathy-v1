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
      } else {
        alert(data.error || "Generation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Unable to generate lesson.");
    }

    setLoading(false);
  }

  return (
    <div className="rounded-xl bg-slate-800 p-8">

      <textarea
        className="w-full h-56 rounded-lg bg-slate-700 p-4 text-white outline-none"
        placeholder="Generate today's lesson..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={generateLesson}
        disabled={loading}
        className="mt-6 rounded-lg bg-cyan-500 px-8 py-3 font-semibold hover:bg-cyan-400 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate"}
      </button>

    </div>
  );
}