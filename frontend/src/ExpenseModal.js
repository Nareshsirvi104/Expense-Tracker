import { useState, useEffect } from 'react';
import { CATEGORIES, today } from './utils';

const EMPTY = { amount: '', category: '', date: today(), note: '' };

export default function ExpenseModal({ expense, onSave, onClose, loading }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (expense) {
      setForm({ amount: String(expense.amount), category: expense.category, date: expense.date, note: expense.note || '' });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [expense]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      errs.amount = 'Enter a positive amount.';
    if (!form.category)
      errs.category = 'Select a category.';
    if (!form.date)
      errs.date = 'Date is required.';
    else if (form.date > today())
      errs.date = 'Date cannot be in the future.';
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ amount: Number(form.amount), category: form.category, date: form.date, note: form.note });
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">{expense ? 'Edit Expense' : 'New Expense'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="0.00"
                className={errors.amount ? 'error' : ''}
              />
              {errors.amount && <span className="field-error">{errors.amount}</span>}
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={errors.category ? 'error' : ''}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <span className="field-error">{errors.category}</span>}
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                max={today()}
                onChange={e => set('date', e.target.value)}
                className={errors.date ? 'error' : ''}
              />
              {errors.date && <span className="field-error">{errors.date}</span>}
            </div>
            <div className="form-group full">
              <label>Note (optional)</label>
              <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="What was this for?" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : expense ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}
