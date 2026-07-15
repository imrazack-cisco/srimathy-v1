"use client";

import { useState } from "react";

export default function PromptBox() {
  const [prompt, setPrompt] = useState("");

  async function generate() {
    if (!prompt.trim()) return;

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

    alert(data.content);
  }

  return (
    <div className="bg-slate-800 rounded-3xl p-8 mt-10">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Generate today's lesson..."
        className="w-full h-40 bg-transparent outline-none text-xl resize-none"
      />

      <button
        onClick={generate}
        className="mt-6 bg-cyan-500 hover:bg-cyan-600 px-8 py-3 rounded-xl font-semibold"
      >
        Generate
      </button>
    </div>
  );
}