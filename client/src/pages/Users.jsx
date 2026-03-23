import { useEffect, useState } from 'react';
import { usersAPI } from '../api/services';
import { RiskBadge, PageHeader, PageLoader, EmptyState, RiskRing } from '../components/UI';
import { timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, riskLevel: '', accountStatus: '', search: '' });
  const [pagination, setPagination] = useState({});
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 20 };
      if (!params.riskLevel) delete params.riskLevel;
      if (!params.accountStatus) delete params.accountStatus;
      if (!params.search) delete params.search;
      const { data } = await usersAPI.list(params);
      setUsers(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const viewUser = async (user) => {
    setSelected(user);
    setDetailLoading(true);
    try {
      const { data } = await usersAPI.risk(user.externalUserId);
      setDetail(data.data);
    } catch { toast.error('Failed to load user details'); }
    finally { setDetailLoading(false); }
  };

  const updateStatus = async (externalUserId, status) => {
    try {
      await usersAPI.updateStatus(externalUserId, status);
      toast.success(`User ${status}`);
      fetchUsers();
      setSelected(null);
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="p-6 animate-fade-in flex gap-4">
      {/* Left: user list */}
      <div className="flex-1 min-w-0">
        <PageHeader title="Monitored Users" subtitle={`${pagination.total || 0} tracked users`}>
          <input className="input w-48" placeholder="Search user…"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
          <select className="input w-36" value={filters.riskLevel}
            onChange={(e) => setFilters(f => ({ ...f, riskLevel: e.target.value, page: 1 }))}>
            <option value="">All Risk</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </PageHeader>

        {loading ? <PageLoader /> : (
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user._id}
                onClick={() => viewUser(user)}
                className={`card-hover cursor-pointer flex items-center gap-4 ${selected?._id === user._id ? 'border-accent-cyan/40 bg-bg-hover' : ''}`}>
                <RiskRing score={user.currentRiskScore} size={52} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-mono text-sm text-slate-200 font-semibold truncate">
                      {user.displayName || user.externalUserId}
                    </p>
                    <RiskBadge level={user.riskLevel} />
                    {user.accountStatus !== 'active' && (
                      <span className="text-xs font-mono text-amber-400 bg-amber-950 border border-amber-900 px-1.5 py-0.5 rounded">
                        {user.accountStatus}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                    <span>{user.sourceSystem}</span>
                    <span>·</span>
                    <span>{user.totalEvents} events</span>
                    <span>·</span>
                    <span>{user.totalAlerts} alerts</span>
                    <span>·</span>
                    <span>{timeAgo(user.lastSeen)}</span>
                  </div>
                </div>
              </div>
            ))}
            {users.length === 0 && <EmptyState icon="◈" message="No users found" />}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs font-mono text-slate-500">Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button className="btn-ghost py-1 px-3 text-xs" disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
              <button className="btn-ghost py-1 px-3 text-xs" disabled={filters.page >= pagination.pages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Right: user detail panel */}
      {selected && (
        <div className="w-80 shrink-0 space-y-4 animate-slide-up">
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-slate-200">
                  {selected.displayName || selected.externalUserId}
                </h3>
                <p className="text-xs font-mono text-slate-500">{selected.externalUserId}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300 text-lg">×</button>
            </div>

            <div className="flex justify-center mb-4">
              <RiskRing score={selected.currentRiskScore} size={80} />
            </div>

            <div className="space-y-2 text-xs font-mono">
              {[
                ['Source', selected.sourceSystem],
                ['Risk Level', selected.riskLevel?.toUpperCase()],
                ['Status', selected.accountStatus],
                ['Total Events', selected.totalEvents],
                ['Total Alerts', selected.totalAlerts],
                ['Last Seen', timeAgo(selected.lastSeen)],
                ['Last Country', selected.lastKnownCountry || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-600">{k}</span>
                  <span className="text-slate-300">{v}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-2">
              {selected.accountStatus === 'active' && (
                <button onClick={() => updateStatus(selected.externalUserId, 'suspended')}
                  className="w-full text-xs font-mono py-2 rounded-lg bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 transition-colors">
                  Suspend User
                </button>
              )}
              {selected.accountStatus === 'suspended' && (
                <button onClick={() => updateStatus(selected.externalUserId, 'active')}
                  className="w-full text-xs font-mono py-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 transition-colors">
                  Reactivate User
                </button>
              )}
            </div>
          </div>

          {/* Recent events */}
          {detailLoading ? (
            <div className="card flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-border border-t-accent-cyan rounded-full animate-spin" />
            </div>
          ) : detail && (
            <div className="card">
              <h4 className="font-mono text-xs text-slate-500 tracking-widest uppercase mb-3">Recent Events</h4>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {detail.recentEvents?.slice(0, 15).map((ev) => (
                  <div key={ev._id} className="flex items-center gap-2 text-xs">
                    <span className={`font-mono ${ev.flagged ? 'text-red-400' : 'text-slate-500'}`}>
                      {ev.type?.replace(/_/g, ' ')}
                    </span>
                    <span className="flex-1 text-right font-mono text-slate-600">{timeAgo(ev.timestamp)}</span>
                    <span className={`font-mono font-bold ${ev.riskScore >= 65 ? 'text-red-400' : 'text-slate-500'}`}>
                      {ev.riskScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
