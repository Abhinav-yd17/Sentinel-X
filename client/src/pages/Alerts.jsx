import { useEffect, useState } from 'react';
import { alertsAPI } from '../api/services';
import { SeverityBadge, StatusBadge, PageHeader, PageLoader, EmptyState, Table } from '../components/UI';
import { timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';

const SEVERITIES = ['', 'critical', 'high', 'medium', 'low'];
const STATUSES = ['', 'open', 'investigating', 'resolved', 'false_positive'];

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ severity: '', status: '', page: 1 });
  const [pagination, setPagination] = useState({});
  const [selected, setSelected] = useState(null);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNote, setResolveNote] = useState('');
  const { liveAlerts } = useSocket();

  useEffect(() => { fetchAlerts(); }, [filters]);
  useEffect(() => {
    if (liveAlerts.length > 0) fetchAlerts();
  }, [liveAlerts]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = { limit: 20, ...filters };
      if (!params.severity) delete params.severity;
      if (!params.status) delete params.status;
      const { data } = await alertsAPI.list(params);
      setAlerts(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load alerts'); }
    finally { setLoading(false); }
  };

  const handleStatus = async (id, status) => {
    try {
      await alertsAPI.updateStatus(id, status, resolveNote);
      toast.success(`Alert marked as ${status}`);
      setResolveModal(null);
      setResolveNote('');
      fetchAlerts();
    } catch { toast.error('Failed to update alert'); }
  };

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Alerts" subtitle={`${pagination.total || 0} total alerts`}>
        <select className="input w-36" value={filters.severity}
          onChange={(e) => setFilters(f => ({ ...f, severity: e.target.value, page: 1 }))}>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s || 'All Severities'}</option>)}
        </select>
        <select className="input w-36" value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </PageHeader>

      {loading ? <PageLoader /> : (
        <>
          <Table headers={['Severity', 'Title', 'User', 'Type', 'Risk', 'Status', 'Time', 'Actions']}>
            {alerts.map((alert) => (
              <tr key={alert._id} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
                <td className="px-4 py-3">
                  <p className="text-sm text-slate-200 font-medium max-w-xs truncate">{alert.title}</p>
                  <p className="text-xs text-slate-600 truncate max-w-xs">{alert.description?.slice(0, 60)}…</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{alert.externalUserId}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-slate-500">{alert.type?.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-sm font-bold ${alert.riskScore >= 85 ? 'text-red-400' : alert.riskScore >= 65 ? 'text-orange-400' : 'text-amber-400'}`}>
                    {alert.riskScore}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={alert.status} /></td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{timeAgo(alert.createdAt)}</td>
                <td className="px-4 py-3">
                  {alert.status === 'open' && (
                    <div className="flex gap-1">
                      <button onClick={() => handleStatus(alert._id, 'investigating')}
                        className="text-xs font-mono px-2 py-1 rounded bg-amber-950 text-amber-400 border border-amber-900 hover:bg-amber-900 transition-colors">
                        Investigate
                      </button>
                      <button onClick={() => setResolveModal(alert)}
                        className="text-xs font-mono px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 transition-colors">
                        Resolve
                      </button>
                    </div>
                  )}
                  {alert.status === 'investigating' && (
                    <div className="flex gap-1">
                      <button onClick={() => setResolveModal(alert)}
                        className="text-xs font-mono px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 transition-colors">
                        Resolve
                      </button>
                      <button onClick={() => handleStatus(alert._id, 'false_positive')}
                        className="text-xs font-mono px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 transition-colors">
                        FP
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </Table>

          {alerts.length === 0 && <EmptyState icon="✓" message="No alerts match your filters" />}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs font-mono text-slate-500">
                Page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex gap-2">
                <button className="btn-ghost py-1 px-3 text-xs"
                  disabled={filters.page <= 1}
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>
                  ← Prev
                </button>
                <button className="btn-ghost py-1 px-3 text-xs"
                  disabled={filters.page >= pagination.pages}
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setResolveModal(null)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-slate-200 mb-1">Resolve Alert</h3>
            <p className="text-sm text-slate-500 mb-4 font-mono">{resolveModal.title}</p>
            <textarea
              className="input h-24 resize-none mb-4"
              placeholder="Resolution notes (optional)…"
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={() => handleStatus(resolveModal._id, 'resolved')}>
                Mark Resolved
              </button>
              <button className="btn-ghost" onClick={() => setResolveModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
