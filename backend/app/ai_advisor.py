import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen
from typing import Any


class AIAdvisorError(RuntimeError):
    pass


def explain_quality(columns: list[str], metrics: dict[str, Any]) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise AIAdvisorError("Gemini is not configured. Set GEMINI_API_KEY to enable advice.")

    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    fallback_model = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.6-flash")
    prompt = (
        "You are a careful data quality advisor. Respond in clean GitHub-flavored Markdown "
        "using exactly these sections: '## Dataset overview', '## What looks good', "
        "'## Data quality concerns', and '## Recommended next steps'. Use short paragraphs, "
        "bullets, and bold only for important findings. Give up to three prioritized actions. "
        "Use only the supplied aggregate metrics and column names; do not infer or invent "
        "row values, causes, or business meaning. State when the metrics do not support a conclusion. "
        f"Columns: {json.dumps(columns)}. Metrics: {json.dumps(metrics)}."
    )
    payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")

    try:
        result = _generate_content(model, api_key, payload)
    except HTTPError as error:
        if error.code != 503 or fallback_model == model:
            raise AIAdvisorError(_format_http_error(error, api_key)) from error
        try:
            result = _generate_content(fallback_model, api_key, payload)
        except HTTPError as fallback_error:
            raise AIAdvisorError(
                f"Gemini is temporarily unavailable: primary model returned HTTP 503 "
                f"and fallback model returned HTTP {fallback_error.code}. Try again shortly."
            ) from fallback_error
    except (URLError, TimeoutError) as error:
        raise AIAdvisorError(f"Could not reach Gemini: {error}") from error

    try:
        return result["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError) as error:
        raise AIAdvisorError("Gemini returned no advice for this dataset.") from error


def _generate_content(model: str, api_key: str, payload: bytes) -> dict[str, Any]:
    request = Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{quote(model)}:"
        "generateContent",
        data=payload,
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )
    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise AIAdvisorError("Gemini returned an unreadable response.") from error


def _format_http_error(error: HTTPError, api_key: str) -> str:
    try:
        body = json.loads(error.read().decode("utf-8"))
        message = body.get("error", {}).get("message", "")
    except (UnicodeDecodeError, json.JSONDecodeError, AttributeError):
        message = ""
    if api_key:
        message = message.replace(api_key, "[redacted]")
    detail = f": {message}" if message else ""
    return f"Gemini request failed (HTTP {error.code}){detail}"
