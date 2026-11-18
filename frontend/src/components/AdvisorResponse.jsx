import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents = {
  h1: ({ children }) => <h2 className="mb-3 mt-6 text-lg font-semibold tracking-tight text-ink first:mt-0">{children}</h2>,
  h2: ({ children }) => <h3 className="mb-2 mt-6 border-b border-slate-100 pb-2 text-sm font-semibold text-ink first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-2 mt-4 text-sm font-semibold text-ink">{children}</h4>,
  p: ({ children }) => <p className="my-2 text-sm leading-6 text-slate-600">{children}</p>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">{children}</ol>,
  li: ({ children }) => <li className="pl-1 marker:text-teal-600">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="text-slate-700">{children}</em>,
  blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-teal-500 bg-teal-50/70 px-4 py-2">{children}</blockquote>,
  hr: () => <hr className="my-5 border-slate-200" />,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-max text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-slate-100 px-3 py-2 text-slate-600">{children}</td>,
  code: ({ children, className }) => (
    <code className={`${className || ""} rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-teal-800`}>
      {children}
    </code>
  ),
};

export default function AdvisorResponse({ content }) {
  return (
    <div className="max-h-[560px] overflow-y-auto border-t border-slate-100 px-5 py-5 sm:px-6">
      <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
        Gemini analysis
      </div>
      <article className="max-w-4xl">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
