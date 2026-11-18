from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict
from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class DatasetBatch(Base):
    __tablename__ = "dataset_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    metrics_json: Mapped[str] = mapped_column(Text, nullable=False)
    accepted_json: Mapped[str] = mapped_column(Text, nullable=False)
    quarantine_json: Mapped[str] = mapped_column(Text, nullable=False)


class BatchSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    created_at: datetime
    metrics: dict[str, Any]


class DatasetResult(BatchSummary):
    accepted_rows: list[dict[str, Any]]
    quarantine_rows: list[dict[str, Any]]


class AdviceResult(BaseModel):
    advice: str
