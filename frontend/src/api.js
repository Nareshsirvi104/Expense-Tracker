// In development the React proxy forwards to localhost:3001.
// In production (Vercel) set REACT_APP_API_URL to your Render backend URL,
// e.g.  REACT_APP_API_URL=https://rupee-ledger-api.onrender.com
const BASE = process.env.REACT_APP_API_URL || "";

export async function fetchExpenses(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== "All") params.set("category", filters.category);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate)   params.set("endDate",   filters.endDate);
  const res = await fetch(`${BASE}/expenses?${params}`);
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

export async function createExpense(data) {
  const res = await fetch(`${BASE}/expenses`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to create expense");
  return json;
}

export async function updateExpense(id, data) {
  const res = await fetch(`${BASE}/expenses/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update expense");
  return json;
}

export async function deleteExpense(id) {
  const res = await fetch(`${BASE}/expenses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete expense");
  return res.json();
}

export async function fetchSummary() {
  const res = await fetch(`${BASE}/summary`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function fetchBudgets() {
  const res = await fetch(`${BASE}/budgets`);
  if (!res.ok) throw new Error("Failed to fetch budgets");
  return res.json();
}

export async function updateBudgets(data) {
  const res = await fetch(`${BASE}/budgets`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update budgets");
  return res.json();
}

// Fetches CSV via fetch() so the request goes through any CORS/proxy layer,
// then triggers a Blob download – avoids the "File wasn't available on site" error.
export async function downloadCSV(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== "All") params.set("category", filters.category);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate)   params.set("endDate",   filters.endDate);
  const res = await fetch(`${BASE}/export?${params}`);
  if (!res.ok) throw new Error("Failed to export CSV");
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "expenses.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
