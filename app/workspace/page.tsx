import Sidebar from "@/components/sidebar/Sidebar";

export default function WorkspacePage() {
  return (
    <main className="flex h-screen bg-slate-900 text-white">
      <Sidebar />

      <section className="flex-1 p-12">
        <h1 className="text-5xl font-bold">
          Welcome back 👋
        </h1>

        <p className="mt-3 text-slate-400">
          What would you like to create today?
        </p>
      </section>
    </main>
  );
}