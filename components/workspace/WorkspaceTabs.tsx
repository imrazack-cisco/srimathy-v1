"use client";

interface WorkspaceTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function WorkspaceTabs({
  activeTab,
  onTabChange,
}: WorkspaceTabsProps) {

  const tabs = [
    "Lesson",
    "Worksheet",
    "Quiz",
    "Teacher Notes",
    "🎙 Voice",
  ];

  return (
    <div className="mt-8 flex gap-6 border-b border-slate-700">

      {tabs.map((tab) => {

        const active =
          activeTab === tab;

        return (
          <button
            key={tab}
            onClick={() =>
              onTabChange(tab)
            }
            className={`border-b-2 px-1 pb-4 text-base font-medium transition ${
              active
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        );

      })}

    </div>
  );
}
