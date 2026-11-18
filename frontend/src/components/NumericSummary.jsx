import { Calculator } from "lucide-react";
import { getNumericSummary } from "../dataAnalysis.js";

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

const summaryCards = [
  ["count", "Values"],
  ["average", "Average"],
  ["sum", "Sum"],
  ["minimum", "Minimum"],
  ["maximum", "Maximum"],
];

export default function NumericSummary({ rows, numericColumns, selectedColumn, onSelect }) {
  if (!numericColumns.length) {
    return (
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Calculator size={16} className="text-teal-600" /> Numeric calculations
        </h2>
        <p className="mt-2 text-xs text-muted">No numeric columns were detected in these rows.</p>
      </section>
    );
  }

  const column = numericColumns.includes(selectedColumn) ? selectedColumn : numericColumns[0];
  const stats = getNumericSummary(rows, column);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Calculator size={16} className="text-teal-600" /> Numeric calculations
          </h2>
          <p className="mt-1 text-xs text-muted">Calculated from the currently filtered rows.</p>
        </div>
        <select
          value={column}
          onChange={(event) => onSelect(event.target.value)}
          aria-label="Select numeric column for calculations"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-teal-500 sm:w-56"
        >
          {numericColumns.map((numericColumn) => (
            <option key={numericColumn} value={numericColumn}>{numericColumn.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {summaryCards.map(([key, label]) => (
          <div key={key} className="rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-1 break-all text-lg font-semibold text-ink">
              {stats ? numberFormat.format(stats[key]) : "—"}
            </p>
          </div>
        ))}
      </div>
      {!stats && <p className="mt-3 text-xs text-amber-700">No numeric values match the current filters.</p>}
    </section>
  );
}
