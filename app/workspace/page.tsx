import Sidebar from "@/components/sidebar/Sidebar";
import PromptBox from "@/components/workspace/PromptBox";
import RecentProjects from "@/components/workspace/RecentProjects";
import AIStatus from "@/components/workspace/AIStatus";

export default function WorkspacePage() {
  return (
    <main className="flex h-screen bg-slate-900 text-white">
      <Sidebar />

      <section className="flex-1 p-12 overflow-y-auto">
        <h1 className="text-6xl font-bold">
          Welcome back 👋
        </h1>

        <p className="mt-4 text-slate-400 text-xl">
          What would you like to create today?
        </p>

        <PromptBox />

        <div className="grid grid-cols-2 gap-8 mt-10">
          <RecentProjects />
          <AIStatus />
        </div>
      </section>
    </main>
  );
}