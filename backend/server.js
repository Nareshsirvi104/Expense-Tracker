const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Render (and most hosts) inject PORT via env var
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, "data.json");

// ── Helpers ───────────────────────────────────────────────────────────────────
function uuidv4() { return crypto.randomUUID(); }

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return { expenses: [], budgets: {} };
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return { expenses: [], budgets: {} }; }
}

function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }

// CORS: allow any origin in production (Vercel frontend URL is unknown at build time)
function sendJSON(res, status, body, origin) {
  const str = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  });
  res.end(str);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

function parseQuery(url) {
  const q = url.split("?")[1] || "";
  const params = {};
  for (const pair of q.split("&")) {
    const [k, v] = pair.split("=");
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || "");
  }
  return params;
}

// ── Seed ──────────────────────────────────────────────────────────────────────
function ensureSeedData() {
  const data = loadData();
  if (data.expenses.length > 0) return;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const pm = String(now.getMonth()).padStart(2, "0");
  const seeds = [
    { category: "Food",          amount: 450,  note: "Grocery run",           date: `${y}-${m}-03`  },
    { category: "Transport",     amount: 180,  note: "Uber rides",             date: `${y}-${m}-05`  },
    { category: "Bills",         amount: 1200, note: "Electricity bill",       date: `${y}-${m}-07`  },
    { category: "Entertainment", amount: 650,  note: "Netflix + Movie tickets",date: `${y}-${m}-10`  },
    { category: "Food",          amount: 320,  note: "Restaurant dinner",      date: `${y}-${m}-12`  },
    { category: "Other",         amount: 890,  note: "New headphones",         date: `${y}-${m}-14`  },
    { category: "Food",          amount: 275,  note: "Weekly groceries",       date: `${y}-${pm}-18` },
    { category: "Transport",     amount: 560,  note: "Flight booking",         date: `${y}-${pm}-22` },
    { category: "Bills",         amount: 999,  note: "Internet bill",          date: `${y}-${pm}-28` },
  ];
  data.expenses = seeds.map(s => ({ ...s, id: uuidv4() }));
  data.budgets = { Food: 3000, Transport: 2000, Bills: 5000, Entertainment: 2000, Other: 3000 };
  saveData(data);
}

ensureSeedData();

// ── Router ────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split("?")[0];
  const method  = req.method;
  const q       = parseQuery(req.url);
  const origin  = req.headers.origin || "*";

  // Health check – Render pings this to detect the service is up
  if (method === "GET" && urlPath === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
    return res.end("ok");
  }

  // CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    });
    return res.end();
  }

  try {
    // GET /expenses
    if (method === "GET" && urlPath === "/expenses") {
      let { expenses } = loadData();
      if (q.category && q.category !== "All") expenses = expenses.filter(e => e.category === q.category);
      if (q.startDate) expenses = expenses.filter(e => e.date >= q.startDate);
      if (q.endDate)   expenses = expenses.filter(e => e.date <= q.endDate);
      expenses.sort((a, b) => (a.date < b.date ? 1 : -1));
      return sendJSON(res, 200, expenses, origin);
    }

    // POST /expenses
    if (method === "POST" && urlPath === "/expenses") {
      const body = await readBody(req);
      const { amount, category, date, note } = body;
      if (!amount || isNaN(amount) || Number(amount) <= 0)
        return sendJSON(res, 400, { error: "Amount must be a positive number." }, origin);
      if (!category)
        return sendJSON(res, 400, { error: "Category is required." }, origin);
      if (!date)
        return sendJSON(res, 400, { error: "Date is required." }, origin);
      const today = new Date().toISOString().split("T")[0];
      if (date > today)
        return sendJSON(res, 400, { error: "Date cannot be in the future." }, origin);
      const data = loadData();
      const expense = { id: uuidv4(), amount: Number(amount), category, date, note: note || "" };
      data.expenses.push(expense);
      saveData(data);
      return sendJSON(res, 201, expense, origin);
    }

    // PUT /expenses/:id  &  DELETE /expenses/:id
    const editMatch = urlPath.match(/^\/expenses\/([^/]+)$/);

    if (method === "PUT" && editMatch) {
      const id   = editMatch[1];
      const body = await readBody(req);
      const data = loadData();
      const idx  = data.expenses.findIndex(e => e.id === id);
      if (idx === -1) return sendJSON(res, 404, { error: "Not found." }, origin);
      if (body.amount !== undefined && (isNaN(body.amount) || Number(body.amount) <= 0))
        return sendJSON(res, 400, { error: "Amount must be a positive number." }, origin);
      const today = new Date().toISOString().split("T")[0];
      if (body.date && body.date > today)
        return sendJSON(res, 400, { error: "Date cannot be in the future." }, origin);
      data.expenses[idx] = {
        ...data.expenses[idx],
        ...(body.amount   !== undefined ? { amount:   Number(body.amount) } : {}),
        ...(body.category              ? { category: body.category       } : {}),
        ...(body.date                  ? { date:     body.date           } : {}),
        ...(body.note     !== undefined ? { note:     body.note          } : {}),
      };
      saveData(data);
      return sendJSON(res, 200, data.expenses[idx], origin);
    }

    if (method === "DELETE" && editMatch) {
      const id   = editMatch[1];
      const data = loadData();
      const idx  = data.expenses.findIndex(e => e.id === id);
      if (idx === -1) return sendJSON(res, 404, { error: "Not found." }, origin);
      data.expenses.splice(idx, 1);
      saveData(data);
      return sendJSON(res, 200, { success: true }, origin);
    }

    // GET /summary
    if (method === "GET" && urlPath === "/summary") {
      const { expenses } = loadData();
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const thisMonthExpenses = expenses.filter(e => e.date.startsWith(thisMonth));
      const totalThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
      const byCategory = {};
      for (const e of expenses) byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      const byCategoryThisMonth = {};
      for (const e of thisMonthExpenses) byCategoryThisMonth[e.category] = (byCategoryThisMonth[e.category] || 0) + e.amount;
      const highest = expenses.reduce((max, e) => (!max || e.amount > max.amount ? e : max), null);
      return sendJSON(res, 200, { totalThisMonth, byCategory, byCategoryThisMonth, highest }, origin);
    }

    // GET /budgets
    if (method === "GET" && urlPath === "/budgets") {
      return sendJSON(res, 200, loadData().budgets, origin);
    }

    // PUT /budgets
    if (method === "PUT" && urlPath === "/budgets") {
      const body = await readBody(req);
      const data = loadData();
      data.budgets = { ...data.budgets, ...body };
      saveData(data);
      return sendJSON(res, 200, data.budgets, origin);
    }

    // GET /export  →  CSV download
    if (method === "GET" && urlPath === "/export") {
      let { expenses } = loadData();
      if (q.category && q.category !== "All") expenses = expenses.filter(e => e.category === q.category);
      if (q.startDate) expenses = expenses.filter(e => e.date >= q.startDate);
      if (q.endDate)   expenses = expenses.filter(e => e.date <= q.endDate);
      expenses.sort((a, b) => (a.date < b.date ? 1 : -1));
      const rows = [
        ["ID", "Date", "Category", "Amount", "Note"],
        ...expenses.map(e => [
          e.id, e.date, e.category, e.amount,
          `"${(e.note || "").replace(/"/g, '""')}"`,
        ]),
      ];
      const csv = rows.map(r => r.join(",")).join("\n");
      res.writeHead(200, {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=expenses.csv",
        "Access-Control-Allow-Origin": origin,
        "Vary": "Origin",
      });
      return res.end(csv);
    }

    sendJSON(res, 404, { error: "Not found" }, origin);
  } catch (err) {
    console.error(err);
    sendJSON(res, 500, { error: "Server error" }, origin);
  }
});

server.listen(PORT, () =>
  console.log(`✅  Expense Tracker API  →  http://localhost:${PORT}`)
);
