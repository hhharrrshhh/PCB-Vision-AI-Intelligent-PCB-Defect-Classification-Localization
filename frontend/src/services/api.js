// frontend/src/services/api.js

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

// ── Timeout helper ──────────────────────────────────────────────────────────
function withTimeout(promise, ms = 30000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out. The backend may be busy.")), ms)
    ),
  ]);
}

// ── Inspect ─────────────────────────────────────────────────────────────────
/**
 * Sends a PCB image to the FastAPI backend for defect detection + repair analysis.
 */
export async function uploadAndInspectPCB(imageFile) {
  const formData = new FormData();
  formData.append("file", imageFile);

  const fetchPromise = fetch(`${API_BASE_URL}/inspection/inspect`, {
    method: "POST",
    body: formData,
  });

  const response = await withTimeout(fetchPromise, 60000); // 60s for inference

  if (!response.ok) {
    let detail = "PCB inspection failed.";
    try {
      const err = await response.json();
      detail = err.detail || detail;
    } catch (_) { /* ignore parse error */ }
    throw new Error(detail);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error("Backend returned an unsuccessful response.");
  }
  return data;
}

// ── Health ───────────────────────────────────────────────────────────────────
/**
 * Checks backend operational status and model readiness.
 */
export async function checkBackendHealth() {
  const response = await withTimeout(
    fetch(`${API_BASE_URL}/inspection/health`),
    5000
  );
  if (!response.ok) {
    throw new Error("Backend service is unreachable.");
  }
  return await response.json();
}

// ── History ──────────────────────────────────────────────────────────────────
/**
 * Fetch paginated inspection history (newest first).
 */
export async function getHistory(limit = 50, offset = 0) {
  const response = await withTimeout(
    fetch(`${API_BASE_URL}/inspection/history?limit=${limit}&offset=${offset}`),
    10000
  );
  if (!response.ok) {
    throw new Error("Failed to load inspection history.");
  }
  return await response.json();
}

// ── Analytics ────────────────────────────────────────────────────────────────
/**
 * Fetch aggregated analytics data computed from all stored inspections.
 */
export async function getAnalytics() {
  const response = await withTimeout(
    fetch(`${API_BASE_URL}/inspection/analytics`),
    10000
  );
  if (!response.ok) {
    throw new Error("Failed to load analytics data.");
  }
  return await response.json();
}