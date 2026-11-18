import unittest
from unittest.mock import patch

import pandas as pd

from app.etl_engine import CSVProcessingError, process_csv, process_dataset
from app.sample_generator import generate_sample_csv


class ProcessCSVTests(unittest.TestCase):
    def test_normalizes_headers_and_quarantines_duplicate_and_empty_rows(self) -> None:
        result = process_csv(
            b"Applicant Name, District\nAsha, Pune\nAsha, Pune\n, \n"
        )

        self.assertEqual(result["columns"], ["applicant_name", "district"])
        self.assertEqual(result["metrics"]["total_rows"], 3)
        self.assertEqual(result["metrics"]["accepted_rows"], 1)
        self.assertEqual(result["metrics"]["quarantined_rows"], 2)
        self.assertEqual(
            [row["reason"] for row in result["quarantine_rows"]],
            ["Duplicate row", "Empty row"],
        )

    def test_keeps_incomplete_records_and_reports_missing_cells(self) -> None:
        result = process_csv(b"name,email\nAsha,\n")

        self.assertEqual(len(result["accepted_rows"]), 1)
        self.assertEqual(result["accepted_rows"][0]["data"]["email"], None)
        self.assertEqual(result["accepted_rows"][0]["issues"], ["Missing value: email"])
        self.assertEqual(result["metrics"]["missing_cells"], 1)

    def test_normalizes_common_missing_markers(self) -> None:
        result = process_csv(
            b"company,total_laid_off,percentage_laid_off\n"
            b"Acme,NA,N/A\n"
            b"Beta,120,0.25\n"
        )

        self.assertEqual(result["metrics"]["missing_cells"], 2)
        self.assertIsNone(result["accepted_rows"][0]["data"]["total_laid_off"])
        self.assertIsNone(result["accepted_rows"][0]["data"]["percentage_laid_off"])
        self.assertEqual(
            result["accepted_rows"][0]["issues"],
            ["Missing value: total_laid_off, percentage_laid_off"],
        )

    def test_sample_contains_processable_rows(self) -> None:
        result = process_csv(generate_sample_csv())

        self.assertEqual(result["metrics"]["columns"], 8)
        self.assertGreater(result["metrics"]["duplicate_rows"], 0)
        self.assertGreater(result["metrics"]["empty_rows"], 0)
        self.assertGreater(result["metrics"]["missing_cells"], 0)

    def test_rejects_empty_or_invalid_csv(self) -> None:
        with self.assertRaises(CSVProcessingError):
            process_csv(b"")

    def test_reads_legacy_excel_files(self) -> None:
        frame = pd.DataFrame(
            [{"Employee Name": "Asha", "Salary": "50000"}, {"Employee Name": "Ravi", "Salary": "60000"}]
        )
        with patch("app.etl_engine.pd.read_excel", return_value=frame) as read_excel:
            result = process_dataset(b"test workbook", "employees.xls")

        read_excel.assert_called_once()
        self.assertEqual(result["columns"], ["employee_name", "salary"])
        self.assertEqual(result["metrics"]["accepted_rows"], 2)

    def test_rejects_unsupported_file_types(self) -> None:
        with self.assertRaisesRegex(CSVProcessingError, r"\.csv or \.xls"):
            process_dataset(b"data", "employees.xlsx")

    def test_reports_invalid_xls_as_processing_error(self) -> None:
        with self.assertRaisesRegex(CSVProcessingError, "Could not read the Excel file"):
            process_dataset(b"not an Excel workbook", "broken.xls")


if __name__ == "__main__":
    unittest.main()
