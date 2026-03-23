import { useEffect, useState } from 'react';
import { analyticsAPI } from '../api/services';
import { PageHeader, PageLoader, StatCard } from '../components/UI';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#22d3ee', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [geo, setGeo] = useState([]);
  const [resolution, setResolution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [ov, tr, tu, et, ge, re] = await Promise.all([
        analyticsAPI.overview(),
        analyticsAPI.threatTrend(),
        analyticsAPI.topRiskyUsers(8),
        analyticsAPI.eventTypes(),
        analyticsAPI.geoDistribution(),
        analyticsAPI.alertResolution(),
      ]);
      setOverview(ov.data.data);

      // Normalize trend to 24 hours
      const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, alerts: 0 }));
      tr.data.data.forEach(({ _id, count }) => { hours[_id.hour].alerts += count; });
      setTrend(hours);

      setTopUsers(tu.data.data);
      setEventTypes(et.data.data.slice(0, 8).map(d => ({ name: d._id, count: d.count, avgRisk: Math.round(d.avgRisk) })));
      setGeo(ge.data.data.slice(0, 8));
      setResolution(re.data.data.map(d => ({ name: d._id, value: d.count })));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Analytics" subtitle="Security insights and threat statistics" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Events" value={overview?.totalEvents?.toLocaleString()} icon="⚡" color="text-accent-cyan" />
        <StatCard label="Total Alerts" value={overview?.totalAlerts} icon="🔔" color="text-red-400" />
        <StatCard label="Open Alerts" value={overview?.openAlerts} icon="⚠" color="text-amber-400" />
        <StatCard label="High Risk Users" value={overview?.highRiskUsers} icon="◈" color="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alert trend */}
        <div className="card">
          <h3 className="font-display font-semibold text-slate-200 mb-4">Alert Volume (24h)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} fill="url(#ag)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Event type breakdown */}
        <div className="card">
          <h3 className="font-display font-semibold text-slate-200 mb-4">Event Types</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={eventTypes} layout="vertical">
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#22d3ee" radius={[0, 4, 4, 0]}>
                {eventTypes.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top risky users */}
        <div className="card lg:col-span-2">
          <h3 className="font-display font-semibold text-slate-200 mb-4">Top Risky Users</h3>
          <div className="space-y-2">
            {topUsers.map((user, i) => (
              <div key={user._id} className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-600 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-slate-300 truncate">
                      {user.displayName || user.externalUserId}
                    </span>
                    <span className={`font-mono text-xs font-bold ml-2 ${
                      user.currentRiskScore >= 85 ? 'text-red-400' :
                      user.currentRiskScore >= 65 ? 'text-orange-400' : 'text-amber-400'
                    }`}>{user.currentRiskScore}</span>
                  </div>
                  <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${user.currentRiskScore}%`,
                        background: user.currentRiskScore >= 85 ? '#ef4444' : user.currentRiskScore >= 65 ? '#f97316' : '#f59e0b'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert resolution pie */}
        <div className="card">
          <h3 className="font-display font-semibold text-slate-200 mb-4">Alert Status</h3>
          {resolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={resolution} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  dataKey="value" nameKey="name" paddingAngle={2}>
                  {resolution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#94a3b8' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs font-mono text-slate-600 text-center py-10">No alert data yet</p>
          )}
        </div>
      </div>

      {/* Geo distribution */}
      <div className="card">
        <h3 className="font-display font-semibold text-slate-200 mb-4">Event Origin (Top Countries)</h3>
        {geo.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {geo.map((item, i) => (
              <div key={item._id} className="p-3 bg-bg-secondary rounded-lg border border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-slate-200">{item._id || 'Unknown'}</span>
                  <span className="font-mono text-xs text-accent-cyan">{item.count}</span>
                </div>
                <div className="h-1 bg-bg-hover rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${Math.min(100, (item.count / geo[0].count) * 100)}%`,
                      background: COLORS[i % COLORS.length]
                    }}
                  />
                </div>
                {item.flaggedCount > 0 && (
                  <p className="text-xs font-mono text-red-400 mt-1">{item.flaggedCount} flagged</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-mono text-slate-600 text-center py-6">No geo data yet — ingest some events to see distribution</p>
        )}
      </div>
    </div>
  );
}
