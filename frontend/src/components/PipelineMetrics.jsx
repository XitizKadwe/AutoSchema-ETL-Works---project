import {
  CheckCircle2,
  Columns3,
  CopyX,
  FileStack,
  Rows3,
  TriangleAlert,
} from "lucide-react";

const cards = [
  { key: "total_rows", label: "Rows scanned", icon: Rows3, color: "text-blue-600", bg: "bg-blue-50" },
  { key: "accepted_rows", label: "Clean rows", icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50" },
  { key: "quarantined_rows", label: "Quarantined", icon: TriangleAlert, color: "text-amber-600", bg: "bg-amber-50" },
  { key: "duplicate_rows", label: "Duplicates", icon: CopyX, color: "text-violet-600", bg: "bg-violet-50" },
  { key: "missing_cells", label: "Missing values", icon: FileStack, color: "text-rose-600", bg: "bg-rose-50" },
  { key: "columns", label: "Columns mapped", icon: Columns3, color: "text-slate-600", bg: "bg-slate-100" },
];

export default function PipelineMetrics({ metrics }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map(({ key, label, icon: Icon, color, bg }) => (
        <article key={key} className="rounded-xl border border-slate-100 bg-white p-4 shadow-card">
          <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${color}`}>
            <Icon size={18} />
          </div>
          <p className="text-2xl font-semibold tracking-tight text-ink">{metrics[key] ?? 0}</p>
          <p className="mt-1 text-xs font-medium text-muted">{label}</p>
        </article>
      ))}
    </section>
  );
}
