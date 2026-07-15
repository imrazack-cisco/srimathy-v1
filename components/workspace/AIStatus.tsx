export default function AIStatus() {
  return (
    <div className="bg-slate-800 rounded-3xl p-8">
      <h2 className="text-2xl font-bold mb-6">
        AI Status
      </h2>

      <div className="space-y-3">
        <p>
          <span className="text-green-400">●</span> Offline Ready
        </p>

        <p>Model: Gemma3:4B</p>

        <p>Provider: Ollama</p>

        <p className="text-cyan-400">
          Ready to generate lessons.
        </p>
      </div>
    </div>
  );
}