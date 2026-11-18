const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // Keep the HTTP status when the server does not return JSON.
    }
    throw new Error(message);
  }
  return response.json();
}

export function listDatasets() {
  return request("/api/datasets");
}

export function getDataset(id) {
  return request(`/api/datasets/${id}`);
}

export function uploadDataset(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/api/datasets", { method: "POST", body: form });
}

export function requestAdvice(id) {
  return request(`/api/datasets/${id}/advice`, { method: "POST" });
}

export function sampleUrl() {
  return `${API_URL}/api/sample.csv`;
}

export function cleanDatasetUrl(id) {
  return `${API_URL}/api/datasets/${id}/clean.csv`;
}
