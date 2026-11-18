import { useRef, useState } from "react";
import { ArrowDownToLine, FileUp, LoaderCircle } from "lucide-react";

import { sampleUrl } from "../api.js";

export default function UploadZone({ onUpload, loading }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function submitFile(file) {
    if (file) onUpload(file);
  }

  return (
    <section
      className={`rounded-2xl border-2 border-dashed bg-white px-6 py-8 text-center transition ${
        dragging ? "border-teal-500 bg-teal-50" : "border-slate-200"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        submitFile(event.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,text/csv,application/vnd.ms-excel"
        className="hidden"
        onChange={(event) => {
          submitFile(event.target.files[0]);
          event.target.value = "";
        }}
      />
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
        {loading ? <LoaderCircle className="animate-spin" size={23} /> : <FileUp size={23} />}
      </div>
      <h2 className="text-base font-semibold text-ink">
        {loading ? "Processing your file..." : "Drop a CSV or Excel .xls file to get started"}
      </h2>
      <p className="mt-1 text-sm text-muted">CSV or Excel .xls · up to 15 MB · your original file is never modified</p>
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="mt-5 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Choose CSV or XLS file
      </button>
      <div className="mt-4">
        <a
          href={sampleUrl()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-600"
        >
          <ArrowDownToLine size={14} />
          Download messy sample data
        </a>
      </div>
    </section>
  );
}
