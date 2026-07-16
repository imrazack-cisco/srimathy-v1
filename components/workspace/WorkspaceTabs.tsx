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
  ];

  return (
    <div className="mt-8 flex gap-6 border-b border-slate-700">

      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`pb-3 transition

          ${
            activeTab === tab
              ? "border-b-2 border-cyan-400 text-cyan-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {tab}
        </button>
      ))}

    </div>
  );
}