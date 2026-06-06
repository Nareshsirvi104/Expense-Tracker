# 💰 Rupee Ledger — Expense Tracker

**Exercise 2: Mini Expense Tracker**

A full-stack expense tracking app where you can log daily spending across categories, visualise it with charts, set monthly budgets, and export records as CSV. Backend is a zero-dependency Node.js server with JSON file storage. Frontend is React with Indian Rupee (₹) formatting and an editorial design.

---

## 🌐 Live Demo

- **App:** https://expense-tracker-kohl-five.vercel.app/
- **API:** https://rupee-ledger-api.onrender.com/health

> ⚠️ Render free tier sleeps after 15 min inactivity — first load may take ~30 seconds.

---

## 🛠 Tech Stack

| | Tool | Why |
|-|------|-----|
| Backend | Node.js (no deps) | Built-in `http`/`fs`/`crypto` covers everything; nothing to install |
| Frontend | React 18 (CRA) | Functional components + hooks as required |
| Charts | Recharts | Simple declarative React charts, pie + bar toggle |
| Styling | Plain CSS | Custom properties, full control, no build plugins |
| Storage | JSON file | Simple, meets the brief; easy to swap for SQLite later |
| Hosting | Vercel + Render | Both free, auto-deploy on `git push` |

---

## 💻 How to Run Locally

> Only Node.js ≥ 18 required.

```bash
# Terminal 1 — Backend
cd backend
node server.js
# → http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm install
npm start
# → http://localhost:3000
```

The React dev server proxies API calls to port 3001 automatically.

---

## 📡 API Endpoints

Base URL: `http://localhost:3001` (local) or `https://rupee-ledger-api.onrender.com` (prod)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/expenses` | List expenses. Query: `?category=Food&startDate=2026-06-01&endDate=2026-06-30` |
| `POST` | `/expenses` | Create expense. Body: `{ amount, category, date, note? }` |
| `PUT` | `/expenses/:id` | Update expense. Body: any subset of above fields |
| `DELETE` | `/expenses/:id` | Delete expense |
| `GET` | `/summary` | Returns `{ totalThisMonth, byCategory, byCategoryThisMonth, highest }` |
| `GET` | `/budgets` | Returns `{ Food: 3000, Transport: 2000, ... }` |
| `PUT` | `/budgets` | Update budgets. Body: `{ Food: 4000 }` (partial OK) |
| `GET` | `/export` | Download filtered expenses as CSV. Same query params as `/expenses` |
| `GET` | `/health` | Returns `ok` — used by Render for liveness check |

**Validation rules:** `amount` must be positive, `date` cannot be in the future, `category` is required.

---

## 📁 Project Structure

```
rupee-ledger/
├── backend/
│   ├── server.js      # Full API — routing, validation, CRUD, CSV export
│   ├── data.json      # Auto-created on first run, seeded with demo data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js         # All pages: Dashboard, Expenses, Budgets
│   │   ├── ExpenseModal.js# Add/Edit modal with validation
│   │   ├── api.js         # All fetch() calls; reads REACT_APP_API_URL in prod
│   │   ├── utils.js       # Currency/date formatting, chart colours
│   │   ├── useToast.js    # Toast notifications
│   │   └── index.css      # All styles
│   ├── vercel.json    # SPA rewrite so refresh doesn't 404
│   └── package.json   # proxy → localhost:3001 for local dev
├── DEPLOY.md          # Step-by-step Render + Vercel guide
└── README.md
```

---

## 🔮 Next Steps

**Skipped intentionally:** authentication (brief said one user), mobile layout, recurring expenses.

**Would build next:**
- Swap `data.json` for SQLite — data survives Render redeploys
- Monthly trend line chart (last 6 months)
- Budget alerts when a category hits 80%
- Responsive mobile sidebar
