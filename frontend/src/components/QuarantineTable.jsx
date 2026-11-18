import { useEffect, useState } from "react";

const PAGE_SIZE = 50;

export default function QuarantineTable({
  rows,
  columns,
  totalRows = rows.length,
  quarantined = false,
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [rows]);

  if (totalRows === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="font-medium text-ink">{quarantined ? "No rows in quarantine" : "No clean rows found"}</p>
        <p className="mt-1 text-sm text-muted">
          {quarantined ? "All records passed the duplicate and empty-row checks." : "Try uploading a different CSV."}
        </p>
      </div>
    );
  }

  const start = (page - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <p className="text-sm text-muted">
          {rows.length === 0 ? (
            <>No rows match the current filters ({totalRows} total).</>
          ) : (
            <>
              Showing <span className="font-semibold text-ink">{start + 1}–{Math.min(start + PAGE_SIZE, rows.length)}</span>
              {" "}of <span className="font-semibold text-ink">{rows.length}</span> matching rows
              {rows.length !== totalRows && ` (${totalRows} total)`}
            </>
          )}
        </p>
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-muted">{page} / {pageCount}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={page === pageCount}
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">CSV row</th>
              {quarantined && <th className="px-4 py-3 font-semibold">Reason</th>}
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold">{column.replaceAll("_", " ")}</th>
              ))}
              {!quarantined && <th className="px-4 py-3 font-semibold">Quality checks</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((row) => (
              <tr key={row.row_number} className="text-slate-600 hover:bg-slate-50/70">
                <td className="px-4 py-3 font-mono text-slate-400">{row.row_number}</td>
                {quarantined && (
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-700">{row.reason}</span>
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column} className="max-w-56 truncate px-4 py-3">{row.data?.[column] || <span className="text-slate-300">—</span>}</td>
                ))}
                {!quarantined && (
                  <td className="px-4 py-3">
                    {row.issues?.length ? (
                      <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">{row.issues.join(", ")}</span>
                    ) : (
                      <span className="text-teal-700">Passed</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && totalRows > 0 && <p className="px-4 py-8 text-center text-sm text-muted">No rows match the current filters.</p>}
    </div>
  );
}
