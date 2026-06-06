import { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import * as api from './api';
import ExpenseModal from './ExpenseModal';
import { useToast, ToastContainer } from './useToast';
import {
  CATEGORIES, formatCurrency, formatDate,
  thisMonthRange, lastMonthRange, CHART_COLORS, today,
} from './utils';

const DATE_PRESETS = [
  { label: 'All Time', value: 'all' },
  { label: 'This Month', value: 'this' },
  { label: 'Last Month', value: 'last' },
  { label: 'Custom', value: 'custom' },
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="ct-label">{payload[0].name}</div>
      <div className="ct-value">{formatCurrency(payload[0].value)}</div>
    </div>
  );
}

// ── Summary Cards ─────────────────────────────────────────────────────────────
function SummaryCards({ summary }) {
  if (!summary) return null;
  const { totalThisMonth, highest } = summary;
  const topCat = Object.entries(summary.byCategoryThisMonth || {})
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="summary-grid">
      <div className="summary-card primary">
        <div className="summary-label">Total This Month</div>
        <div className="summary-value">{formatCurrency(totalThisMonth)}</div>
        <div className="summary-sub">
          {Object.keys(summary.byCategoryThisMonth || {}).length} categories
        </div>
      </div>
      <div className="summary-card success">
        <div className="summary-label">Top Category (Month)</div>
        <div className="summary-value">
          {topCat ? <><span style={{ fontSize: 20 }}>{topCat[0]}</span></> : '—'}
        </div>
        <div className="summary-sub">{topCat ? formatCurrency(topCat[1]) : 'No data'}</div>
      </div>
      <div className="summary-card warning">
        <div className="summary-label">Highest Single Expense</div>
        <div className="summary-value">{highest ? formatCurrency(highest.amount) : '—'}</div>
        <div className="summary-sub">{highest ? `${highest.category} · ${formatDate(highest.date)}` : 'No data'}</div>
      </div>
    </div>
  );
}

// ── Expense Table ─────────────────────────────────────────────────────────────
function ExpenseTable({ expenses, onEdit, onDelete }) {
  if (!expenses.length) return (
    <div className="empty-state">
      <div className="empty-icon">📋</div>
      <p>No expenses found. Add one to get started!</p>
    </div>
  );

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Note</th>
          <th style={{ width: 80 }}></th>
        </tr>
      </thead>
      <tbody>
        {expenses.map(e => (
          <tr key={e.id}>
            <td className="td-date">{formatDate(e.date)}</td>
            <td><span className={`cat-badge cat-${e.category}`}>{e.category}</span></td>
            <td className="td-amount">{formatCurrency(e.amount)}</td>
            <td className="td-note">{e.note || <span style={{ opacity: 0.3 }}>—</span>}</td>
            <td>
              <button className="action-btn" title="Edit" onClick={() => onEdit(e)}>✏️</button>
              <button className="action-btn delete" title="Delete" onClick={() => onDelete(e.id)}>🗑</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Budget Page ───────────────────────────────────────────────────────────────
function BudgetsPage({ budgets, summary, onSaveBudget, toast }) {
  const [edits, setEdits] = useState({});

  function setEdit(cat, val) { setEdits(e => ({ ...e, [cat]: val })); }

  async function save(cat) {
    const val = Number(edits[cat]);
    if (!val || val <= 0) { toast('Enter a valid budget amount.', 'error'); return; }
    await onSaveBudget({ [cat]: val });
    setEdits(e => { const n = { ...e }; delete n[cat]; return n; });
    toast(`Budget for ${cat} updated!`, 'success');
  }

  return (
    <div>
      <div className="page-title">Budget Settings</div>
      <div className="page-sub">Set monthly spending limits per category and track progress.</div>
      <div className="budget-grid">
        {CATEGORIES.map(cat => {
          const spent = summary?.byCategoryThisMonth?.[cat] || 0;
          const budget = budgets?.[cat] || 0;
          const pct = budget ? Math.min((spent / budget) * 100, 100) : 0;
          const over = budget && spent > budget;
          const warn = budget && pct > 75 && !over;
          const cls = over ? 'over' : warn ? 'warn' : 'ok';
          const editVal = edits[cat] !== undefined ? edits[cat] : (budget || '');

          return (
            <div key={cat} className="budget-card">
              <div className="budget-card-header">
                <div className="budget-cat-name">{cat}</div>
                <span className={`cat-badge cat-${cat}`}>{cat}</span>
              </div>
              <div className="budget-amounts">
                <span>Spent: <span className="budget-spent-num">{formatCurrency(spent)}</span></span>
                <span>Budget: {budget ? formatCurrency(budget) : 'Not set'}</span>
              </div>
              {budget > 0 && (
                <>
                  <div className="budget-track">
                    <div className={`budget-fill ${cls}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={`budget-status ${cls}`}>
                    {over ? `Over by ${formatCurrency(spent - budget)}!` : warn ? `${Math.round(pct)}% used — watch out!` : `${Math.round(pct)}% used`}
                  </div>
                </>
              )}
              <div className="budget-edit-row">
                <input
                  type="number"
                  min="0"
                  value={editVal}
                  onChange={e => setEdit(cat, e.target.value)}
                  placeholder="Set budget (₹)"
                />
                <button className="btn-save-budget" onClick={() => save(cat)}>Save</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('dashboard'); // 'dashboard' | 'expenses' | 'budgets'
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState({});
  const [filters, setFilters] = useState({ category: 'All', preset: 'all', startDate: '', endDate: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [saving, setSaving] = useState(false);
  const [chartType, setChartType] = useState('pie');
  const { toasts, addToast } = useToast();

  const loadExpenses = useCallback(async () => {
    try {
      const data = await api.fetchExpenses({
        category: filters.category,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      setExpenses(data);
    } catch { addToast('Failed to load expenses', 'error'); }
  }, [filters, addToast]);

  const loadSummary = useCallback(async () => {
    try { setSummary(await api.fetchSummary()); } catch {}
  }, []);

  const loadBudgets = useCallback(async () => {
    try { setBudgets(await api.fetchBudgets()); } catch {}
  }, []);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);
  useEffect(() => { loadSummary(); loadBudgets(); }, [loadSummary, loadBudgets]);

  function applyPreset(preset) {
    let startDate = '', endDate = '';
    if (preset === 'this') { const r = thisMonthRange(); startDate = r.startDate; endDate = r.endDate; }
    else if (preset === 'last') { const r = lastMonthRange(); startDate = r.startDate; endDate = r.endDate; }
    setFilters(f => ({ ...f, preset, startDate, endDate }));
  }

  async function handleSave(formData) {
    setSaving(true);
    try {
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, formData);
        addToast('Expense updated!', 'success');
      } else {
        await api.createExpense(formData);
        addToast('Expense added!', 'success');
      }
      setModalOpen(false);
      setEditingExpense(null);
      loadExpenses();
      loadSummary();
    } catch (e) {
      addToast(e.message, 'error');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.deleteExpense(id);
      addToast('Expense deleted.', 'default');
      loadExpenses();
      loadSummary();
    } catch { addToast('Failed to delete.', 'error'); }
  }

  function openAdd() { setEditingExpense(null); setModalOpen(true); }
  function openEdit(e) { setEditingExpense(e); setModalOpen(true); }

  // Chart data from summary (all time for pie, this month for context)
  const chartData = Object.entries(summary?.byCategory || {}).map(([name, value]) => ({ name, value }));
  const thisMonthChartData = Object.entries(summary?.byCategoryThisMonth || {}).map(([name, value]) => ({ name, value }));

  // Budget mini-bars (sidebar)
  const budgetBars = CATEGORIES.map(cat => {
    const spent = summary?.byCategoryThisMonth?.[cat] || 0;
    const budget = budgets?.[cat] || 0;
    const pct = budget ? Math.min((spent / budget) * 100, 100) : 0;
    const cls = budget && spent > budget ? 'over' : budget && pct > 75 ? 'warn' : 'ok';
    return { cat, spent, budget, pct, cls };
  }).filter(b => b.budget > 0);

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-logo">Rupee <span>Ledger</span></div>
        <div className="topbar-tagline">Expense Tracker</div>
        <div className="topbar-spacer" />
        <button className="btn-add-top" onClick={openAdd}>＋ Add Expense</button>
      </header>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-label">Navigation</div>
          {[
            { id: 'dashboard', icon: '📊', label: 'Dashboard' },
            { id: 'expenses', icon: '📋', label: 'All Expenses' },
            { id: 'budgets', icon: '🎯', label: 'Budgets' },
          ].map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
              <span className="nav-icon">{item.icon}</span> {item.label}
            </button>
          ))}
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-section">
          <div className="sidebar-label">This Month by Category</div>
          <div className="cat-summary-list">
            {thisMonthChartData.length ? thisMonthChartData.sort((a, b) => b.value - a.value).map(({ name, value }) => (
              <div key={name} className="cat-summary-item">
                <span className="cat-summary-name">{name}</span>
                <span className="cat-summary-amt">{formatCurrency(value)}</span>
              </div>
            )) : <div style={{ fontSize: 12, color: 'var(--ink-faint)', padding: '8px 0' }}>No data this month</div>}
          </div>
        </div>

        {budgetBars.length > 0 && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section">
              <div className="sidebar-label">Budget Progress</div>
              <div className="budget-mini">
                {budgetBars.map(({ cat, pct, cls }) => (
                  <div key={cat} className="budget-mini-item">
                    <div className="budget-mini-header">
                      <span className="budget-mini-cat">{cat}</span>
                      <span className="budget-mini-pct">{Math.round(pct)}%</span>
                    </div>
                    <div className="budget-bar-track">
                      <div className={`budget-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Main content */}
      <main className="main-content">
        {page === 'dashboard' && (
          <div>
            <div className="page-title">Dashboard</div>
            <div className="page-sub">Your spending overview at a glance.</div>

            <SummaryCards summary={summary} />

            <div className="content-row">
              {/* Chart */}
              <div className="chart-card">
                <div className="card-header">
                  <div className="card-title">Spending by Category</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['pie', 'bar'].map(t => (
                      <button
                        key={t}
                        onClick={() => setChartType(t)}
                        style={{
                          background: chartType === t ? 'var(--ink)' : 'var(--paper-warm)',
                          color: chartType === t ? 'var(--paper)' : 'var(--ink-light)',
                          border: 'none',
                          borderRadius: 6,
                          padding: '5px 12px',
                          fontSize: 12,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >{t}</button>
                    ))}
                  </div>
                </div>
                <div className="card-body">
                  {chartData.length ? (
                    <ResponsiveContainer width="100%" height={280}>
                      {chartType === 'pie' ? (
                        <PieChart>
                          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={3}>
                            {chartData.map(({ name }) => (
                              <Cell key={name} fill={CHART_COLORS[name] || '#aaa'} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend formatter={v => <span style={{ fontSize: 12 }}>{v}</span>} />
                        </PieChart>
                      ) : (
                        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {chartData.map(({ name }) => (
                              <Cell key={name} fill={CHART_COLORS[name] || '#aaa'} />
                            ))}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state" style={{ padding: 40 }}>
                      <div className="empty-icon">📊</div>
                      <p>No data to chart yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent expenses */}
              <div className="table-card">
                <div className="card-header">
                  <div className="card-title">Recent Expenses</div>
                  <button className="btn-reset" onClick={() => setPage('expenses')} style={{ fontSize: 12 }}>View all →</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <ExpenseTable
                    expenses={expenses.slice(0, 8)}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {page === 'expenses' && (
          <div>
            <div className="page-title">All Expenses</div>
            <div className="page-sub">Browse, filter, edit, and export your spending records.</div>

            <div className="table-card">
              <div className="card-header">
                <div className="card-title">Transactions</div>
                <button
                  onClick={() => api.downloadCSV({ category: filters.category, startDate: filters.startDate, endDate: filters.endDate }).catch(() => addToast('Export failed', 'error'))}
                  className="btn-export"
                >
                  ⬇ Export CSV
                </button>
              </div>
              <div className="card-body">
                {/* Filters */}
                <div className="filters-bar">
                  <select className="filter-select" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  {DATE_PRESETS.map(p => (
                    <button
                      key={p.value}
                      className="filter-select"
                      style={{
                        background: filters.preset === p.value ? 'var(--ink)' : undefined,
                        color: filters.preset === p.value ? 'var(--paper)' : undefined,
                        cursor: 'pointer',
                      }}
                      onClick={() => applyPreset(p.value)}
                    >{p.label}</button>
                  ))}

                  {filters.preset === 'custom' && (
                    <div className="filter-date-pair">
                      <input type="date" className="filter-input" max={today()} value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
                      <span>–</span>
                      <input type="date" className="filter-input" max={today()} value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
                    </div>
                  )}

                  <button className="btn-reset" onClick={() => setFilters({ category: 'All', preset: 'all', startDate: '', endDate: '' })}>Clear</button>
                </div>

                <div style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 12 }}>
                  {expenses.length} expense{expenses.length !== 1 ? 's' : ''} · Total: <strong style={{ color: 'var(--ink)' }}>{formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}</strong>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <ExpenseTable expenses={expenses} onEdit={openEdit} onDelete={handleDelete} />
                </div>
              </div>
            </div>
          </div>
        )}

        {page === 'budgets' && (
          <BudgetsPage
            budgets={budgets}
            summary={summary}
            onSaveBudget={async (data) => {
              const updated = await api.updateBudgets(data);
              setBudgets(updated);
            }}
            toast={addToast}
          />
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <ExpenseModal
          expense={editingExpense}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingExpense(null); }}
          loading={saving}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
