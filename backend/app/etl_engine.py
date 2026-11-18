import io
import re
from typing import Any

import pandas as pd
from xlrd.biffh import XLRDError


class CSVProcessingError(ValueError):
    pass


MISSING_MARKERS = {"na", "n/a", "nan", "null", "none", "-"}


def _normalize_headers(headers: list[Any]) -> list[str]:
    normalized: list[str] = []
    counts: dict[str, int] = {}
    for index, header in enumerate(headers, start=1):
        name = re.sub(r"[^a-z0-9]+", "_", str(header).strip().lower()).strip("_")
        name = name or f"column_{index}"
        counts[name] = counts.get(name, 0) + 1
        if counts[name] > 1:
            name = f"{name}_{counts[name]}"
        normalized.append(name)
    return normalized


def _normalize_value(value: Any) -> str | None:
    normalized = str(value).strip()
    if not normalized or normalized.casefold() in MISSING_MARKERS:
        return None
    return normalized


def _process_frame(frame: pd.DataFrame) -> dict[str, Any]:
    if len(frame.columns) == 0:
        raise CSVProcessingError("The file must include a header row.")

    columns = _normalize_headers(list(frame.columns))
    accepted_rows: list[dict[str, Any]] = []
    quarantine_rows: list[dict[str, Any]] = []
    seen_rows: set[tuple[str | None, ...]] = set()
    empty_rows = 0
    duplicate_rows = 0
    missing_cells = 0

    for index, raw_values in enumerate(frame.itertuples(index=False, name=None), start=2):
        values = [_normalize_value(value) for value in raw_values]
        data = dict(zip(columns, values))
        if all(value is None for value in values):
            empty_rows += 1
            quarantine_rows.append(
                {"row_number": index, "reason": "Empty row", "data": data}
            )
            continue

        missing_columns = [column for column, value in data.items() if value is None]
        missing_cells += len(missing_columns)
        row_key = tuple(values)
        if row_key in seen_rows:
            duplicate_rows += 1
            quarantine_rows.append(
                {"row_number": index, "reason": "Duplicate row", "data": data}
            )
            continue

        seen_rows.add(row_key)
        accepted_rows.append(
            {
                "row_number": index,
                "data": data,
                "issues": (
                    [f"Missing value: {', '.join(missing_columns)}"]
                    if missing_columns
                    else []
                ),
            }
        )

    total_rows = len(frame.index)
    return {
        "columns": columns,
        "accepted_rows": accepted_rows,
        "quarantine_rows": quarantine_rows,
        "metrics": {
            "total_rows": total_rows,
            "accepted_rows": len(accepted_rows),
            "quarantined_rows": len(quarantine_rows),
            "duplicate_rows": duplicate_rows,
            "empty_rows": empty_rows,
            "missing_cells": missing_cells,
            "columns": len(columns),
            "column_names": columns,
        },
    }


def process_dataset(content: bytes, filename: str) -> dict[str, Any]:
    if filename.lower().endswith(".xls"):
        try:
            frame = pd.read_excel(
                io.BytesIO(content),
                dtype=str,
                keep_default_na=False,
                na_values=[],
                engine="xlrd",
            )
        except (ImportError, ValueError, OSError, XLRDError) as error:
            raise CSVProcessingError(f"Could not read the Excel file: {error}") from error
        return _process_frame(frame)

    if not filename.lower().endswith(".csv"):
        raise CSVProcessingError("Upload a .csv or .xls file.")

    try:
        frame = pd.read_csv(
            io.BytesIO(content),
            dtype=str,
            keep_default_na=False,
            skip_blank_lines=False,
            encoding="utf-8-sig",
        )
    except (pd.errors.ParserError, pd.errors.EmptyDataError, UnicodeDecodeError) as error:
        raise CSVProcessingError(f"Could not read the CSV: {error}") from error

    return _process_frame(frame)


def process_csv(content: bytes) -> dict[str, Any]:
    return process_dataset(content, "upload.csv")
