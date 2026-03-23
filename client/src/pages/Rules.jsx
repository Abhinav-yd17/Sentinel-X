import { useEffect, useState } from 'react';
import { rulesAPI } from '../api/services';
import { PageHeader, PageLoader, EmptyState, SeverityBadge } from '../components/UI';
import { timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_RULE = {
  name: '', description: '', type: 'threshold', severity: 'medium',
  thresholdCount: 5, thresholdWindowMinutes: 10,
  riskScoreIncrement: 20, alertType: 'custom_rule', alertTitle: '',
  applyToEventTypes: [], enabled: true,
};

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_RULE);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const { data } = await rulesAPI.list();
      setRules(data.data);
    } catch { toast.error('Failed to load rules'); }
    finally { setLoading(false); }
  };

  const handleToggle = async (id) => {
    try {
      await rulesAPI.toggle(id);
      setRules(rules.map(r => r._id === id ? { ...r, enabled: !r.enabled } : r));
      toast.success('Rule updated');
    } catch { toast.error('Failed to toggle rule'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await rulesAPI.delete(id);
      setRules(rules.filter(r => r._id !== id));
      toast.success('Rule deleted');
    } catch { toast.error('Failed to delete rule'); }
  };

  const openEdit = (rule) => {
    setEditing(rule._id);
    setForm({ ...rule });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        const { data } = await rulesAPI.update(editing, form);
        setRules(rules.map(r => r._id === editing ? data.data : r));
        toast.success('Rule updated');
      } else {
        const { data } = await rulesAPI.create(form);
        setRules([...rules, data.data]);
        toast.success('Rule created');
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_RULE);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Detection Rules" subtitle={`${rules.length} rules configured`}>
        <button className="btn-primary" onClick={() => { setForm(EMPTY_RULE); setEditing(null); setShowForm(true); }}>
          + New Rule
        </button>
      </PageHeader>

      {loading ? <PageLoader /> : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule._id} className={`card flex items-start gap-4 ${!rule.enabled ? 'opacity-50' : ''}`}>
              {/* Toggle */}
              <button
                onClick={() => handleToggle(rule._id)}
                className={`w-10 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${rule.enabled ? 'bg-accent-cyan' : 'bg-bg-hover border border-border'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-auto ${rule.enabled ? 'translate-x-2' : '-translate-x-1'}`} />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-display font-semibold text-slate-200">{rule.name}</h3>
                  <SeverityBadge severity={rule.severity} />
                  <span className="text-xs font-mono text-slate-600 bg-bg-secondary px-2 py-0.5 rounded border border-border">
                    {rule.type}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-2">{rule.description}</p>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                  {rule.thresholdCount && (
                    <span>Threshold: {rule.thresholdCount} in {rule.thresholdWindowMinutes}m</span>
                  )}
                  <span>+{rule.riskScoreIncrement} risk pts</span>
                  <span>Triggered: {rule.triggerCount || 0}x</span>
                  {rule.lastTriggeredAt && <span>Last: {timeAgo(rule.lastTriggeredAt)}</span>}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(rule)}
                  className="text-xs font-mono px-3 py-1.5 rounded border border-border text-slate-400 hover:border-accent-cyan/50 hover:text-accent-cyan transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(rule._id)}
                  className="text-xs font-mono px-3 py-1.5 rounded border border-red-900 text-red-400 hover:bg-red-950 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {rules.length === 0 && <EmptyState icon="⚙" message="No rules configured" />}
        </div>
      )}

      {/* Rule Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-lg my-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display font-semibold text-slate-200 text-lg">
                {editing ? 'Edit Rule' : 'New Detection Rule'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Detection Rule" />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Description</label>
                <textarea className="input h-16 resize-none" value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Type</label>
                  <select className="input" value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
                    {['threshold', 'pattern', 'frequency', 'geo', 'time_based'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Severity</label>
                  <select className="input" value={form.severity} onChange={(e) => setForm(f => ({ ...f, severity: e.target.value }))}>
                    {['low', 'medium', 'high', 'critical'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(form.type === 'threshold') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Count</label>
                    <input type="number" className="input" value={form.thresholdCount}
                      onChange={(e) => setForm(f => ({ ...f, thresholdCount: parseInt(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Window (min)</label>
                    <input type="number" className="input" value={form.thresholdWindowMinutes}
                      onChange={(e) => setForm(f => ({ ...f, thresholdWindowMinutes: parseInt(e.target.value) }))} />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Alert Type</label>
                  <input className="input" value={form.alertType} onChange={(e) => setForm(f => ({ ...f, alertType: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Risk Score +</label>
                  <input type="number" min="0" max="100" className="input" value={form.riskScoreIncrement}
                    onChange={(e) => setForm(f => ({ ...f, riskScoreIncrement: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Alert Title</label>
                <input className="input" value={form.alertTitle} onChange={(e) => setForm(f => ({ ...f, alertTitle: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button className="btn-primary flex-1" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : editing ? 'Update Rule' : 'Create Rule'}
              </button>
              <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
