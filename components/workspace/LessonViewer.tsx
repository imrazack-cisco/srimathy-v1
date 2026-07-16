
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LessonViewerProps {
  lesson: string;
}

export default function LessonViewer({
  lesson,
}: LessonViewerProps) {
  if (!lesson) return null;

  return (
    <div className="mt-8 rounded-xl bg-slate-800 p-8">
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {lesson}
        </ReactMarkdown>
      </div>
    </div>
  );
}