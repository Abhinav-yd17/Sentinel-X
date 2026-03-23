import { useEffect, useState } from 'react';
import { eventsAPI } from '../api/services';
import { PageHeader, PageLoader, EmptyState, Table } from '../components/UI';
import { timeAgo, eventTypeIcon } from '../utils/helpers';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';

const EVENT_TYPES = [
  '', 'login_success', 'login_failure', 'logout', 'password_change',
  'mfa_failure', 'device_change', 'location_change', 'data_access',
  'data_export', 'api_request', 'suspicious_request',
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 30, type: '', flagged: '' });
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const { liveEvents } = useSocket();

  useEffect(() => { fetchEvents(); }, [filters]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.type) delete params.type;
      if (params.flagged === '') delete params.flagged;
      if (search) params.externalUserId = search;
      const { data } = await eventsAPI.list(params);
      setEvents(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Events" subtitle={`${pagination.total?.toLocaleString() || 0} total events`}>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input className="input w-48" placeholder="Search user ID…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className="btn-ghost py-2 px-3 text-xs">Search</button>
        </form>
        <select className="input w-44" value={filters.type}
          onChange={(e) => setFilters(f => ({ ...f, type: e.target.value, page: 1 }))}>
          {EVENT_TYPES.map((t) => <option key={t} value={t}>{t || 'All Types'}</option>)}
        </select>
        <select className="input w-36" value={filters.flagged}
          onChange={(e) => setFilters(f => ({ ...f, flagged: e.target.value, page: 1 }))}>
          <option value="">All Events</option>
          <option value="true">Flagged Only</option>
          <option value="false">Normal Only</option>
        </select>
      </PageHeader>

      {/* Live events banner */}
      {liveEvents.length > 0 && (
        <div className="mb-4 p-3 bg-bg-card border border-accent-cyan/20 rounded-lg flex items-center gap-3">
          <span className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" />
          <span className="text-xs font-mono text-accent-cyan">
            {liveEvents.length} new live events — <button onClick={fetchEvents} className="underline">refresh</button>
          </span>
        </div>
      )}

      {loading ? <PageLoader /> : (
        <>
          <Table headers={['Type', 'User', 'Risk', 'IP / Location', 'Device', 'Source', 'Flagged', 'Time']}>
            {events.map((ev) => (
              <tr key={ev._id} className={`border-b border-border/50 hover:bg-bg-hover transition-colors ${ev.flagged ? 'bg-red-950/10' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base">{eventTypeIcon(ev.type)}</span>
                    <span className="font-mono text-xs text-slate-400">{ev.type?.replace(/_/g, ' ')}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{ev.externalUserId}</td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-sm font-bold ${
                    ev.riskScore >= 85 ? 'text-red-400' :
                    ev.riskScore >= 65 ? 'text-orange-400' :
                    ev.riskScore >= 40 ? 'text-amber-400' : 'text-slate-500'
                  }`}>{ev.riskScore}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-mono text-xs text-slate-400">{ev.ip || '—'}</p>
                  <p className="font-mono text-xs text-slate-600">{ev.location?.city}, {ev.location?.country}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{ev.deviceType || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{ev.sourceSystem}</td>
                <td className="px-4 py-3">
                  {ev.flagged && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-red-950 text-red-400 border border-red-900">
                      🚩
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{timeAgo(ev.timestamp)}</td>
              </tr>
            ))}
          </Table>

          {events.length === 0 && <EmptyState icon="⚡" message="No events found" />}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs font-mono text-slate-500">Page {pagination.page} of {pagination.pages}</span>
              <div className="flex gap-2">
                <button className="btn-ghost py-1 px-3 text-xs" disabled={filters.page <= 1}
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
                <button className="btn-ghost py-1 px-3 text-xs" disabled={filters.page >= pagination.pages}
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
