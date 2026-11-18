import csv
import io
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from .ai_advisor import AIAdvisorError, explain_quality
from .database import Base, engine, get_db
from .etl_engine import CSVProcessingError, process_dataset
from .models import AdviceResult, BatchSummary, DatasetBatch, DatasetResult
from .sample_generator import generate_sample_csv


load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)
Base.metadata.create_all(bind=engine)
app = FastAPI(title="AutoSchema ETL", version="1.0.0")
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_UPLOAD_BYTES = 15 * 1024 * 1024


def _summary(batch: DatasetBatch) -> BatchSummary:
    return BatchSummary(
        id=batch.id,
        filename=batch.filename,
        created_at=batch.created_at,
        metrics=json.loads(batch.metrics_json),
    )


def _result(batch: DatasetBatch) -> DatasetResult:
    return DatasetResult(
        id=batch.id,
        filename=batch.filename,
        created_at=batch.created_at,
        metrics=json.loads(batch.metrics_json),
        accepted_rows=json.loads(batch.accepted_json),
        quarantine_rows=json.loads(batch.quarantine_json),
    )


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/datasets", response_model=list[BatchSummary])
def list_datasets(db: Session = Depends(get_db)) -> list[BatchSummary]:
    batches = db.scalars(
        select(DatasetBatch).order_by(desc(DatasetBatch.created_at)).limit(25)
    ).all()
    return [_summary(batch) for batch in batches]


@app.get("/api/datasets/{batch_id}", response_model=DatasetResult)
def get_dataset(batch_id: int, db: Session = Depends(get_db)) -> DatasetResult:
    batch = db.get(DatasetBatch, batch_id)
    if batch is None:
        raise HTTPException(status_code=404, detail="Dataset batch not found.")
    return _result(batch)


@app.get("/api/datasets/{batch_id}/clean.csv")
def download_clean_dataset(batch_id: int, db: Session = Depends(get_db)) -> Response:
    batch = db.get(DatasetBatch, batch_id)
    if batch is None:
        raise HTTPException(status_code=404, detail="Dataset batch not found.")

    metrics = json.loads(batch.metrics_json)
    columns = metrics["column_names"]
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=columns)
    writer.writeheader()
    for row in json.loads(batch.accepted_json):
        writer.writerow(row["data"])

    return Response(
        content=output.getvalue().encode("utf-8-sig"),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="autoschema-clean-{batch.id}.csv"'
        },
    )


@app.post("/api/datasets", response_model=DatasetResult, status_code=201)
async def upload_dataset(
    file: UploadFile = File(...), db: Session = Depends(get_db)
) -> DatasetResult:
    if not file.filename or not file.filename.lower().endswith((".csv", ".xls")):
        raise HTTPException(status_code=400, detail="Upload a .csv or .xls file.")
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Files must be 15 MB or smaller.")
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded CSV is empty.")

    try:
        processed = process_dataset(content, file.filename)
    except CSVProcessingError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    batch = DatasetBatch(
        filename=file.filename,
        metrics_json=json.dumps(processed["metrics"]),
        accepted_json=json.dumps(processed["accepted_rows"]),
        quarantine_json=json.dumps(processed["quarantine_rows"]),
        created_at=datetime.now(timezone.utc),
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return _result(batch)


@app.get("/api/sample.csv")
def download_sample() -> Response:
    return Response(
        content=generate_sample_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="autoschema-sample.csv"'},
    )


@app.post("/api/datasets/{batch_id}/advice", response_model=AdviceResult)
def get_advice(batch_id: int, db: Session = Depends(get_db)) -> AdviceResult:
    batch = db.get(DatasetBatch, batch_id)
    if batch is None:
        raise HTTPException(status_code=404, detail="Dataset batch not found.")

    try:
        advice = explain_quality(
            json.loads(batch.metrics_json).get("column_names", []),
            json.loads(batch.metrics_json),
        )
    except AIAdvisorError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return AdviceResult(advice=advice)
