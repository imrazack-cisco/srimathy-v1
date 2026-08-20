"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewerProps {
  markdown: string;
}

export default function MarkdownViewer({
  markdown,
}: MarkdownViewerProps) {
  if (!markdown) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center">
        <p className="text-slate-500">
          No content generated yet.
        </p>
      </div>
    );
  }

  let cleanMarkdown = markdown;

  // Handle accidental JSON wrapper:
  // {"provider":"ollama","response":"..."}
  try {
    const parsed = JSON.parse(markdown);

    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.response === "string"
    ) {
      cleanMarkdown = parsed.response;
    }
  } catch {
    // Normal Markdown — nothing to do
  }

  // Convert escaped newlines into real newlines
  cleanMarkdown = cleanMarkdown
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();

  // Remove accidental surrounding quotes
  if (
    cleanMarkdown.startsWith('"') &&
    cleanMarkdown.endsWith('"')
  ) {
    cleanMarkdown = cleanMarkdown.slice(1, -1);
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-xl">

      {/* Document header */}

      <div className="border-b border-slate-800 px-8 py-6">
        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-xl">
            🎓
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              SRIMATHY AI
            </div>

            <div className="text-sm text-slate-500">
              AI-generated teaching content
            </div>
          </div>

        </div>
      </div>

      {/* Markdown */}

      <div className="px-8 py-8 lg:px-12">

        <div
          className="
            prose
            prose-invert
            max-w-none

            prose-headings:font-semibold
            prose-headings:tracking-tight

            prose-h1:mb-6
            prose-h1:mt-0
            prose-h1:text-3xl

            prose-h2:mb-4
            prose-h2:mt-10
            prose-h2:border-b
            prose-h2:border-slate-800
            prose-h2:pb-2
            prose-h2:text-xl
            prose-h2:text-cyan-300

            prose-h3:mb-3
            prose-h3:mt-7
            prose-h3:text-lg
            prose-h3:text-slate-200

            prose-p:my-4
            prose-p:leading-7
            prose-p:text-slate-300

            prose-li:my-1
            prose-li:leading-7
            prose-li:text-slate-300

            prose-strong:text-white

            prose-code:rounded
            prose-code:bg-slate-800
            prose-code:px-1.5
            prose-code:py-0.5
            prose-code:text-cyan-300
          "
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {cleanMarkdown}
          </ReactMarkdown>
        </div>

      </div>

    </article>
  );
}