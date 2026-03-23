import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, alertsAPI } from '../api/services';
import { useSocket } from '../hooks/useSocket';
import { StatCard, SeverityBadge, StatusBadge, RiskBadge, PageLoader, RiskRing } from '../components/UI';
import { timeAgo, eventTypeIcon } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { liveEvents, liveAlerts, connected } = useSocket();

  useEffect(() => {
    fetchAll();
  }, []);

  // Refresh alerts when new live alert comes in
  useEffect(() => {
    if (liveAlerts.length > 0) {
      fetchAlerts();
      fetchOverview();
    }
  }, [liveAlerts]);

  const fetchAll = async () => {
    try {
      await Promise.all([fetchOverview(), fetchTopUsers(), fetchAlerts(), fetchTrend()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    const { data } = await analyticsAPI.overview();
    setOverview(data.data);
  };

  const fetchTopUsers = async () => {
    const { data } = await analyticsAPI.topRiskyUsers(5);
    setTopUsers(data.data);
  };

  const fetchAlerts = async () => {
    const { data } = await alertsAPI.list({ limit: 8, status: 'open' });
    setRecentAlerts(data.data);
  };

  const fetchTrend = async () => {
    const { data } = await analyticsAPI.threatTrend();
    // Normalize to 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    data.data.forEach(({ _id, count }) => {
      if (hours[_id.hour]) hours[_id.hour].count += count;
    });
    setTrendData(hours.map((h) => ({ ...h, label: `${h.hour}:00` })));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100">
            Threat Overview
          </h1>
          <p className="text-sm text-slate-500 font-mono mt-0.5">
            Real-time security monitoring dashboard
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-card rounded-lg border border-border">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-mono text-xs text-slate-400">
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Alerts" value={overview?.openAlerts} icon="🔔"
          color={overview?.openAlerts > 0 ? 'text-red-400' : 'text-emerald-400'} />
        <StatCard label="Critical Alerts" value={overview?.criticalAlerts} icon="🚨"
          color={overview?.criticalAlerts > 0 ? 'text-red-400' : 'text-emerald-400'} />
        <StatCard label="High Risk Users" value={overview?.highRiskUsers} icon="👤"
          color={overview?.highRiskUsers > 0 ? 'text-amber-400' : 'text-emerald-400'} />
        <StatCard label="Events (24h)" value={overview?.events24h} icon="⚡"
          sub={`${overview?.flaggedEvents24h} flagged`} color="text-accent-cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Threat trend chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-200">Alert Trend (24h)</h2>
            <span className="text-xs font-mono text-slate-500">Hourly</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#0f1623', border: '1px solid #1a2332', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#22d3ee' }}
              />
              <Area type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2}
                fill="url(#cg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Live event feed */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-slate-200">Live Feed</h2>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex-1 space-y-1 overflow-hidden">
            {liveEvents.length === 0 && (
              <p className="text-xs font-mono text-slate-600 text-center py-6">
                Waiting for events…
              </p>
            )}
            {liveEvents.slice(0, 8).map((ev, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                <span className={`font-mono text-xs ${ev.flagged ? 'text-red-400' : 'text-slate-500'}`}>
                  {eventTypeIcon(ev.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-slate-300 truncate">{ev.externalUserId}</p>
                  <p className="text-xs text-slate-600 truncate">{ev.type}</p>
                </div>
                <span className={`text-xs font-mono font-semibold ${ev.riskScore >= 65 ? 'text-red-400' : ev.riskScore >= 40 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {ev.riskScore}
                </span>
              </div>
            ))}
          </div>
          <Link to="/events" className="text-xs font-mono text-accent-cyan hover:underline mt-3 text-right">
            View all →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent open alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-200">Open Alerts</h2>
            <Link to="/alerts" className="text-xs font-mono text-accent-cyan hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {recentAlerts.length === 0 && (
              <p className="text-xs font-mono text-slate-600 text-center py-6">No open alerts 🎉</p>
            )}
            {recentAlerts.map((alert) => (
              <Link key={alert._id} to={`/alerts`} className="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary hover:bg-bg-hover transition-colors border border-border/50 block">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  alert.severity === 'critical' ? 'bg-red-500 pulse-ring' :
                  alert.severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate">{alert.title}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{timeAgo(alert.createdAt)}</p>
                </div>
                <SeverityBadge severity={alert.severity} />
              </Link>
            ))}
          </div>
        </div>

        {/* Top risky users */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-200">Top Risk Users</h2>
            <Link to="/users" className="text-xs font-mono text-accent-cyan hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {topUsers.map((user, i) => (
              <Link key={user._id} to={`/users`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg-hover transition-colors block">
                <span className="text-xs font-mono text-slate-600 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-slate-200 truncate">
                    {user.displayName || user.externalUserId}
                  </p>
                  <p className="text-xs text-slate-600">{user.totalAlerts} alerts · {timeAgo(user.lastSeen)}</p>
                </div>
                <RiskRing score={user.currentRiskScore} size={44} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={overview?.totalUsers} icon="◈" color="text-slate-200" />
        <StatCard label="Total Events" value={overview?.totalEvents?.toLocaleString()} icon="⚡" color="text-slate-200" />
        <StatCard label="Total Alerts" value={overview?.totalAlerts} icon="🔔" color="text-slate-200" />
        <StatCard label="Flagged (24h)" value={overview?.flaggedEvents24h} icon="🚩" color="text-amber-400" />
      </div>
    </div>
  );
}
