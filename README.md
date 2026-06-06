# 💰 Rupee Ledger — Mini Expense Tracker

A full-stack expense tracking app with a React frontend and Node.js/Express backend.

---

## Tech Stack

| Layer     | Tech                             |
|-----------|----------------------------------|
| Backend   | Node.js + Express                |
| Frontend  | React (Create React App) + hooks |
| Charts    | Recharts                         |
| Storage   | JSON file (`backend/data.json`)  |
| Styling   | Plain CSS with CSS variables     |
| Currency  | `Intl.NumberFormat` (en-IN / ₹)  |

---

## Features

### ✅ Must Have
- Add expenses with amount, category, date, optional note
- View all expenses in a table sorted by date (newest first)
- Edit and delete expenses
- Filter by category and date range (All Time / This Month / Last Month / Custom)
- Summary panel: total this month, top category, highest single expense

### 🔶 Should Have
- Pie + Bar chart (toggle) showing spending by category — Recharts
- Indian Rupee (₹) formatting via `Intl.NumberFormat`
- Form validation: no negative amounts, no future dates, category required

### 🌟 Bonus
- Export filtered expenses as CSV download
- Budget settings per category with visual progress bars
- Data persistence via JSON file (`backend/data.json`)
- Sidebar budget mini-bars for at-a-glance tracking

---

## Getting Started

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Start the backend

```bash
cd backend
node server.js
# ✅ API running on http://localhost:3001
```

### 3. Start the frontend

```bash
cd frontend
npm start
# Opens http://localhost:3000
```

The frontend proxies `/api/*` to the backend automatically via the `"proxy"` field in `frontend/package.json`.

---

## API Endpoints

| Method | Path            | Description                        |
|--------|-----------------|------------------------------------|
| GET    | /expenses       | List expenses (with filters)       |
| POST   | /expenses       | Create expense                     |
| PUT    | /expenses/:id   | Update expense                     |
| DELETE | /expenses/:id   | Delete expense                     |
| GET    | /summary        | Get summary stats                  |
| GET    | /budgets        | Get all budgets                    |
| PUT    | /budgets        | Update one or more budgets         |
| GET    | /export         | Download expenses as CSV           |

### Filter query params for GET /expenses and GET /export
- `category` — e.g. `Food`
- `startDate` — e.g. `2025-06-01`
- `endDate` — e.g. `2025-06-30`

---

## Project Structure

```
expense-tracker/
├── backend/
│   ├── server.js       # Express API
│   ├── data.json       # Auto-created on first run (seeded with demo data)
│   └── package.json
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.js          # Main app — Dashboard, Expenses, Budgets pages
│   │   ├── ExpenseModal.js # Add/Edit modal with validation
│   │   ├── api.js          # Fetch helpers
│   │   ├── utils.js        # Formatting, categories, chart colours
│   │   ├── useToast.js     # Toast notification hook + component
│   │   ├── index.css       # All styles (editorial aesthetic)
│   │   └── index.js
│   └── package.json
└── README.md
```
