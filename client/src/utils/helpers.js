import { formatDistanceToNow, format } from 'date-fns';

export const timeAgo = (date) => {
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); }
  catch { return '—'; }
};

export const formatDate = (date, fmt = 'MMM dd, HH:mm') => {
  try { return format(new Date(date), fmt); }
  catch { return '—'; }
};

export const riskColor = (level) => ({
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
  low: 'text-emerald-400',
}[level] || 'text-slate-400');

export const riskBg = (level) => ({
  critical: 'bg-red-950 border-red-900 text-red-400',
  high: 'bg-orange-950 border-orange-900 text-orange-400',
  medium: 'bg-amber-950 border-amber-900 text-amber-400',
  low: 'bg-emerald-950 border-emerald-900 text-emerald-400',
}[level] || 'bg-slate-900 border-slate-800 text-slate-400');

export const severityColor = (s) => riskColor(s);
export const severityBg = (s) => riskBg(s);

export const statusBg = (s) => ({
  open: 'bg-red-950 text-red-400 border-red-900',
  investigating: 'bg-amber-950 text-amber-400 border-amber-900',
  resolved: 'bg-emerald-950 text-emerald-400 border-emerald-900',
  false_positive: 'bg-slate-900 text-slate-400 border-slate-800',
}[s] || 'bg-slate-900 text-slate-400 border-slate-800');

export const eventTypeIcon = (type) => ({
  login_success: '✓',
  login_failure: '✗',
  logout: '→',
  password_change: '🔑',
  mfa_failure: '⚠',
  mfa_success: '🔐',
  device_change: '📱',
  location_change: '📍',
  permission_change: '🛡',
  data_access: '📂',
  data_export: '📤',
  api_request: '⚡',
  account_lockout: '🔒',
  suspicious_request: '⚠',
  custom: '●',
}[type] || '●');

export const truncate = (str, n = 30) =>
  str?.length > n ? str.slice(0, n) + '…' : str;
