import { riskBg, statusBg, severityBg } from '../utils/helpers';

// ── Risk / Severity Badge ──────────────────────────────────────
export const RiskBadge = ({ level }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold border ${riskBg(level)}`}>
    {level?.toUpperCase()}
  </span>
);

export const SeverityBadge = ({ severity }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold border ${severityBg(severity)}`}>
    {severity?.toUpperCase()}
  </span>
);

export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold border ${statusBg(status)}`}>
    {status?.replace('_', ' ').toUpperCase()}
  </span>
);

// ── Stat Card ──────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, color = 'text-slate-100', icon, trend }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <span className="text-xs font-mono text-slate-500 tracking-widest uppercase">{label}</span>
      {icon && <span className="text-lg">{icon}</span>}
    </div>
    <p className={`text-3xl font-display font-bold ${color}`}>{value ?? '—'}</p>
    {sub && <p className="text-xs text-slate-500 font-mono">{sub}</p>}
    {trend !== undefined && (
      <p className={`text-xs font-mono ${trend >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)} from yesterday
      </p>
    )}
  </div>
);

// ── Page Header ────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, children }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-100">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 font-mono mt-1">{subtitle}</p>}
    </div>
    {children && <div className="flex items-center gap-3">{children}</div>}
  </div>
);

// ── Spinner ────────────────────────────────────────────────────
export const Spinner = ({ size = 'md' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className={`${s} border-2 border-border border-t-accent-cyan rounded-full animate-spin`} />
  );
};

export const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center h-64">
    <Spinner size="lg" />
  </div>
);

// ── Empty State ────────────────────────────────────────────────
export const EmptyState = ({ icon = '◎', message = 'No data found' }) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-600">
    <span className="text-5xl mb-4 opacity-30">{icon}</span>
    <p className="font-mono text-sm">{message}</p>
  </div>
);

// ── Risk Score Ring ────────────────────────────────────────────
export const RiskRing = ({ score = 0, size = 80 }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? '#ef4444' : score >= 65 ? '#f97316' : score >= 40 ? '#f59e0b' : '#10b981';

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} stroke="#1a2332" strokeWidth="8" fill="none" />
      <circle
        cx={size/2} cy={size/2} r={radius}
        stroke={color} strokeWidth="8" fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x="50%" y="50%"
        textAnchor="middle" dominantBaseline="middle"
        className="rotate-90"
        style={{ transform: `rotate(90deg) translate(0, 0)`, transformOrigin: `${size/2}px ${size/2}px` }}
        fill={color} fontSize="18" fontWeight="700" fontFamily="JetBrains Mono, monospace"
      >
        {score}
      </text>
    </svg>
  );
};

// ── Table wrapper ──────────────────────────────────────────────
export const Table = ({ headers, children, empty }) => (
  <div className="overflow-x-auto rounded-xl border border-border">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border bg-bg-secondary">
          {headers.map((h) => (
            <th key={h} className="px-4 py-3 text-left text-xs font-mono text-slate-500 tracking-widest uppercase whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {children}
      </tbody>
    </table>
    {empty && <EmptyState message={empty} />}
  </div>
);
