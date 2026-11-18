# AutoSchema ETL

A local CSV and Excel `.xls` data-quality workspace built with FastAPI, SQLite, React, and Tailwind.

## Features

- Upload CSV or legacy Excel `.xls` files (up to 15 MB), normalize column names, trim cell whitespace, and treat common `NA`/`N/A`/`null` markers as missing values.
- Quarantine fully empty and exact duplicate rows; flag incomplete records without dropping them.
- Review pipeline metrics, searchable clean/quarantined rows, and recent processing history.
- Export the accepted, normalized records as a clean CSV.
- Filter rows by column values, text, or numeric ranges; calculate count, average, sum, minimum, and maximum for detected numeric columns on the filtered results; export the filtered clean rows.
- Download a synthetic sample CSV with intentional duplicates, blank records, and missing values.
- Optionally request Gemini recommendations in a formatted, readable report with a visual quality summary. The request sends only normalized column names and aggregate metrics, never row contents.

## Run locally

Backend (Python 3.10+):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`; interactive API documentation is at `http://127.0.0.1:8000/docs`. SQLite data is stored in `backend/autoschema.db`.

Frontend (Node.js 18+):

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Set `VITE_API_URL` if the API runs at a different URL.

## Configuration

- `DATABASE_URL` — SQLite connection URL; defaults to a local database in `backend/autoschema.db`.
- `CORS_ORIGINS` — comma-separated frontend origins; defaults to `http://localhost:5173,http://127.0.0.1:5173`.
- `GEMINI_API_KEY` — optional; enables the **Ask Gemini** action. Set it in the backend shell or in `backend/.env` as `GEMINI_API_KEY=your-key`.
- `GEMINI_MODEL` — optional Gemini model name; defaults to `gemini-3.8-flash`.
- `GEMINI_FALLBACK_MODEL` — optional fallback used if the primary Gemini model returns a temporary 503; defaults to `gemini-3.6-flash`.

Gemini advice is opt-in. Uploaded rows are persisted in the configured database and are not included in the Gemini request. For local setup, copy `backend/.env.example` to `backend/.env` and add your key. Never commit `.env` or share its contents.

## Test

From `backend`, run `python -m unittest discover -s tests`.
