import { Filter, RotateCcw, Search } from "lucide-react";
import { useMemo } from "react";

const EMPTY_VALUE = "__EMPTY__";
const MAX_DROPDOWN_VALUES = 20;

export default function DataFilters({
  rows,
  columns,
  numericColumns,
  filters,
  onChange,
}) {
  const columnOptions = useMemo(() => {
    const options = {};
    for (const column of columns) {
      const distinct = new Set();
      for (const row of rows) {
        const value = row.data?.[column];
        if (value !== null && value !== undefined && value !== "") {
          distinct.add(value);
          if (distinct.size > MAX_DROPDOWN_VALUES) break;
        }
      }
      options[column] = {
        values: [...distinct],
        hasMany: distinct.size > MAX_DROPDOWN_VALUES,
      };
    }
    return options;
  }, [columns, rows]);

  function updateColumn(column, key, value) {
    const current = filters[column] || {};
    const next = { ...current, [key]: value };
    if (value === "") delete next[key];
    onChange({ ...filters, [column]: next });
  }

  const hasFilters = Object.keys(filters).some((key) =>
    key === "_search"
      ? Boolean(filters[key])
      : Object.values(filters[key] || {}).some((value) => value !== ""),
  );

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Filter size={16} className="text-teal-600" /> Filter dataset
          </div>
          <p className="mt-1 text-xs text-muted">Filters combine together; calculations update to match.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-muted sm:w-56">
            <Search size={15} />
            <input
              value={filters._search || ""}
              onChange={(event) => onChange({ ...filters, _search: event.target.value })}
              placeholder="Search all columns"
              className="w-full bg-transparent text-xs text-ink outline-none placeholder:text-slate-400"
            />
          </label>
          <button
            type="button"
            onClick={() => onChange({})}
            disabled={!hasFilters}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={13} /> Clear
          </button>
        </div>
      </div>
      {columns.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {columns.map((column) => {
            const isNumeric = numericColumns.includes(column);
            const options = columnOptions[column];
            return (
              <div key={column} className="min-w-0">
                <label className="mb-1.5 block truncate text-[11px] font-medium capitalize text-slate-500">
                  {column.replaceAll("_", " ")}
                </label>
                {isNumeric ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={filters[column]?.min ?? ""}
                      onChange={(event) => updateColumn(column, "min", event.target.value)}
                      placeholder="Min"
                      aria-label={`${column} minimum`}
                      className="w-full min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-ink outline-none focus:border-teal-500"
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="number"
                      value={filters[column]?.max ?? ""}
                      onChange={(event) => updateColumn(column, "max", event.target.value)}
                      placeholder="Max"
                      aria-label={`${column} maximum`}
                      className="w-full min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-ink outline-none focus:border-teal-500"
                    />
                  </div>
                ) : !options.hasMany ? (
                  <select
                    value={filters[column]?.value ?? ""}
                    onChange={(event) => updateColumn(column, "value", event.target.value)}
                    aria-label={`Filter ${column}`}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-ink outline-none focus:border-teal-500"
                  >
                    <option value="">All values</option>
                    <option value={EMPTY_VALUE}>Empty values</option>
                    {options.values.map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={filters[column]?.text || ""}
                    onChange={(event) => updateColumn(column, "text", event.target.value)}
                    placeholder={`Contains...`}
                    aria-label={`Filter ${column}`}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-ink outline-none focus:border-teal-500"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
