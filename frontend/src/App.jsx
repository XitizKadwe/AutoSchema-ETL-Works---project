import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Bot,
  ChevronDown,
  Database,
  FileSpreadsheet,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { cleanDatasetUrl, getDataset, listDatasets, requestAdvice, sampleUrl, uploadDataset } from "./api.js";
import { filterRows, getNumericColumns } from "./dataAnalysis.js";
import DataFilters from "./components/DataFilters.jsx";
import NumericSummary from "./components/NumericSummary.jsx";
import PipelineMetrics from "./components/PipelineMetrics.jsx";
import QuarantineTable from "./components/QuarantineTable.jsx";
import UploadZone from "./components/UploadZone.jsx";

const chartColors = ["#18a999", "#f4b740"];

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function App() {
  const [batch, setBatch] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("clean");
  const [filters, setFilters] = useState({});
  const [selectedNumericColumn, setSelectedNumericColumn] = useState("");
  const [loading, setLoading] = useState(false);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [advice, setAdvice] = useState("");
  const [error, setError] = useState("");

  async function refreshHistory() {
    const datasets = await listDatasets();
    setHistory(datasets);
    return datasets;
  }

  useEffect(() => {
    refreshHistory()
      .then((datasets) => datasets[0] && getDataset(datasets[0].id).then(setBatch))
      .catch((cause) => setError(`Could not connect to the AutoSchema API: ${cause.message}`));
  }, []);

  async function handleUpload(file) {
    setError("");
    setAdvice("");
    setLoading(true);
    try {
      const result = await uploadDataset(file);
      setBatch(result);
      setActiveTab("clean");
      setFilters({});
      setSelectedNumericColumn("");
      await refreshHistory();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  }

  async function openBatch(id) {
    setError("");
    setAdvice("");
    try {
      setBatch(await getDataset(id));
      setActiveTab("clean");
      setFilters({});
      setSelectedNumericColumn("");
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function getGeminiAdvice() {
    if (!batch) return;
    setError("");
    setAdvice("");
    setAdviceLoading(true);
    try {
      const result = await requestAdvice(batch.id);
      setAdvice(result.advice);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setAdviceLoading(false);
    }
  }

  function downloadFilteredRows() {
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [
      columns.map(escapeCsv).join(","),
      ...filteredRows.map((row) => columns.map((column) => escapeCsv(row.data?.[column])).join(",")),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `autoschema-filtered-${batch.id}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const chartData = useMemo(
    () => batch ? [
      { name: "Clean", value: batch.metrics.accepted_rows },
      { name: "Quarantined", value: batch.metrics.quarantined_rows },
    ] : [],
    [batch],
  );
  const rows = activeTab === "clean" ? batch?.accepted_rows || [] : batch?.quarantine_rows || [];
  const columns = batch?.metrics.column_names || [];
  const numericColumns = useMemo(
    () => getNumericColumns(rows, columns),
    [rows, columns],
  );
  const filteredRows = useMemo(
    () => filterRows(rows, columns, filters, numericColumns),
    [rows, columns, filters, numericColumns],
  );

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-8">
          <a href="#" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white">
              <Workflow size={21} />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight text-ink">AutoSchema <span className="text-teal-600">ETL</span></span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">Data quality workspace</span>
            </span>
          </a>
          <div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Local workspace
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1440px] gap-7 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
        <div className="min-w-0 space-y-6">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">ETL pipeline</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Data quality overview</h1>
              <p className="mt-1 text-sm text-muted">Standardize CSVs, surface anomalies, and keep clean data moving.</p>
            </div>
            <a href={sampleUrl()} className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300 sm:self-auto">
              <ArrowDownToLine size={15} /> Get sample CSV
            </a>
          </section>

          <UploadZone onUpload={handleUpload} loading={loading} />

          {error && (
            <div role="alert" className="flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} className="font-semibold">Dismiss</button>
            </div>
          )}

          {batch ? (
            <>
              <PipelineMetrics metrics={batch.metrics} />

              <DataFilters
                rows={rows}
                columns={columns}
                numericColumns={numericColumns}
                filters={filters}
                onChange={setFilters}
              />
              <NumericSummary
                rows={filteredRows}
                numericColumns={numericColumns}
                selectedColumn={selectedNumericColumn}
                onSelect={setSelectedNumericColumn}
              />

              <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FileSpreadsheet size={19} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-ink">{batch.filename}</h2>
                      <p className="mt-0.5 text-xs text-muted">Processed {formatDate(batch.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {activeTab === "clean" && (
                      <button
                        type="button"
                        onClick={downloadFilteredRows}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-300"
                      >
                        <ArrowDownToLine size={14} /> Export filtered ({filteredRows.length})
                      </button>
                    )}
                    <a
                      href={cleanDatasetUrl(batch.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-300"
                    >
                      <ArrowDownToLine size={14} /> Export clean CSV
                    </a>
                    <div className="flex rounded-lg bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab("clean")}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${activeTab === "clean" ? "bg-white text-ink shadow-sm" : "text-muted"}`}
                      >
                        Clean rows <span className="ml-1 text-slate-400">{batch.metrics.accepted_rows}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("quarantine")}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${activeTab === "quarantine" ? "bg-white text-ink shadow-sm" : "text-muted"}`}
                      >
                        Quarantine <span className="ml-1 text-slate-400">{batch.metrics.quarantined_rows}</span>
                      </button>
                    </div>
                  </div>
                </div>
                <QuarantineTable
                  rows={filteredRows}
                  totalRows={rows.length}
                  columns={columns}
                  quarantined={activeTab === "quarantine"}
                />
              </section>

              <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <Sparkles size={16} className="text-teal-600" /> AI data advisor
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted">Get cleanup suggestions from Gemini. Only column names and aggregate metrics are sent.</p>
                    </div>
                    <button
                      type="button"
                      onClick={getGeminiAdvice}
                      disabled={adviceLoading}
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                    >
                      {adviceLoading ? <LoaderCircle size={14} className="animate-spin" /> : <Bot size={14} />}
                      Ask Gemini
                    </button>
                  </div>
                  {advice && <p className="mt-4 whitespace-pre-wrap border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">{advice}</p>}
                  {!advice && <p className="mt-3 text-[11px] text-slate-400">Requires GEMINI_API_KEY on the backend. Requests are always opt-in.</p>}
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
                  <h3 className="text-sm font-semibold text-ink">Row distribution</h3>
                  <div className="mt-1 h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={62} paddingAngle={4} stroke="none">
                          {chartData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index]} />)}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 text-[11px] text-muted">
                    {chartData.map((entry, index) => (
                      <span key={entry.name} className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[index] }} />
                        {entry.name}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-xl border border-slate-100 bg-white px-5 py-6 text-center text-sm text-muted shadow-card">
              Upload a CSV to see its quality metrics, cleaned rows, and quarantined records.
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink"><Database size={16} className="text-teal-600" /> Recent datasets</div>
              <button
                type="button"
                title="Refresh history"
                onClick={() => refreshHistory().catch((cause) => setError(cause.message))}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="mt-4 space-y-1">
              {history.length ? history.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => openBatch(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-slate-50 ${batch?.id === item.id ? "bg-teal-50/70" : ""}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><FileSpreadsheet size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-ink">{item.filename}</span>
                    <span className="mt-0.5 block text-[10px] text-muted">{item.metrics.total_rows} rows · {formatDate(item.created_at)}</span>
                  </span>
                  <ChevronDown size={14} className="-rotate-90 text-slate-300" />
                </button>
              )) : (
                <p className="py-5 text-center text-xs text-muted">Your processed files will appear here.</p>
              )}
            </div>
          </section>
          <section className="rounded-2xl bg-ink p-5 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-teal-300"><Workflow size={18} /></div>
            <h3 className="mt-4 text-sm font-semibold">A safer data pipeline</h3>
            <p className="mt-2 text-xs leading-5 text-slate-300">Headers are normalized, empty and duplicate rows are quarantined, and incomplete records are flagged without discarding them.</p>
          </section>
        </aside>
      </main>
      <footer className="mx-auto max-w-[1440px] px-5 pb-8 text-center text-[11px] leading-5 text-slate-400 lg:px-8">
        <p>AutoSchema ETL · CSV content is stored locally in the configured database.</p>
        <p>
          Developed by Kshitij Kumar Kadwe ·{" "}
          <a className="hover:text-teal-700" href="mailto:shubhx1607@gmail.com">
            shubhx1607@gmail.com
          </a>
        </p>
      </footer>
    </div>
  );
}
