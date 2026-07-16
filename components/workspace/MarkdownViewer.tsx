import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

export default function MarkdownViewer({ content }: Props) {
  return (
    <article
      className="
      prose
      prose-invert
      max-w-none
      prose-headings:text-cyan-300
      prose-p:text-slate-200
      prose-strong:text-white
      prose-code:text-yellow-300
      prose-pre:bg-slate-950
      prose-li:text-slate-200
      prose-hr:border-slate-700
      prose-blockquote:border-cyan-500
      prose-blockquote:text-slate-300
      "
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </article>
  );
}