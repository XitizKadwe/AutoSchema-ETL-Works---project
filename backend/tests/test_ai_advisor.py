import json
import io
import os
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request

from app.ai_advisor import AIAdvisorError, explain_quality


class _FakeResponse:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return json.dumps(
            {
                "candidates": [
                    {"content": {"parts": [{"text": "Check missing values first."}]}}
                ]
            }
        ).encode("utf-8")


class ExplainQualityTests(unittest.TestCase):
    def test_requires_an_api_key(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(AIAdvisorError, "GEMINI_API_KEY"):
                explain_quality(["name"], {"total_rows": 1})

    def test_sends_advice_request_and_reads_response(self) -> None:
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key-not-real"}, clear=True):
            with patch("app.ai_advisor.urlopen", return_value=_FakeResponse()) as urlopen:
                advice = explain_quality(["name"], {"total_rows": 1})

        self.assertEqual(advice, "Check missing values first.")
        request = urlopen.call_args.args[0]
        self.assertIsInstance(request, Request)
        self.assertIn("/models/gemini-3.8-flash:generateContent", request.full_url)
        self.assertEqual(request.get_header("X-goog-api-key"), "test-key-not-real")

    def test_falls_back_when_primary_model_is_unavailable(self) -> None:
        unavailable = HTTPError(
            "https://example.invalid",
            503,
            "Unavailable",
            {},
            io.BytesIO(b'{"error":{"message":"High demand"}}'),
        )
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key-not-real"}, clear=True):
            with patch(
                "app.ai_advisor.urlopen",
                side_effect=[unavailable, _FakeResponse()],
            ) as urlopen:
                advice = explain_quality(["salary"], {"total_rows": 1})

        self.assertEqual(advice, "Check missing values first.")
        self.assertEqual(urlopen.call_count, 2)
        fallback_request = urlopen.call_args.args[0]
        self.assertIn("/models/gemini-3.6-flash:generateContent", fallback_request.full_url)


if __name__ == "__main__":
    unittest.main()
