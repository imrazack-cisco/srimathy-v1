export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-[700px]">

        <h1 className="text-5xl font-bold text-center">
          🎓 SRIMATHY
        </h1>

        <p className="text-center text-gray-600 mt-4">
          Offline AI Co-Teacher
        </p>

        <textarea
          placeholder="Ask SRIMATHY anything..."
          className="mt-8 w-full h-40 border rounded-xl p-4"
        />

        <button
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3"
        >
          Ask SRIMATHY
        </button>

      </div>
    </main>
  );
}