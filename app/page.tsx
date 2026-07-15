"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function askSrimathy() {
    if (!message.trim()) return;

    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: message,
        }),
      });

      const data = await res.json();

      setResponse(data.content);
    } catch (err) {
      console.error(err);
      setResponse("Failed to generate response.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-10">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-5xl">

        <h1 className="text-6xl font-bold text-center">
          🎓 SRIMATHY
        </h1>

        <p className="text-center text-slate-500 mt-3 text-xl">
          Offline AI Co-Teacher
        </p>

        <textarea
          className="w-full mt-8 border rounded-xl p-5 h-64 text-lg"
          placeholder="Ask SRIMATHY anything..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          onClick={askSrimathy}
          disabled={loading}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 text-xl"
        >
          {loading ? "Thinking..." : "Ask SRIMATHY"}
        </button>

        {response && (
          <div className="mt-8 border rounded-xl p-6 whitespace-pre-wrap">
            {response}
          </div>
        )}
      </div>
    </main>
  );
}