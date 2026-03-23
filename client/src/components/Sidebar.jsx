import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/',          icon: '▣', label: 'Dashboard',  exact: true },
  { to: '/alerts',    icon: '⚠', label: 'Alerts' },
  { to: '/events',    icon: '⚡', label: 'Events' },
  { to: '/users',     icon: '◈', label: 'Users' },
  { to: '/analytics', icon: '◎', label: 'Analytics' },
  { to: '/rules',     icon: '⚙', label: 'Rules',      adminOnly: true },
  { to: '/team',      icon: '◉', label: 'Team',       adminOnly: true },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const filtered = navItems.filter(
    (n) => !n.adminOnly || user?.role === 'admin'
  );

  return (
    <aside className="w-56 min-h-screen bg-bg-secondary border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-cyan-500 flex items-center justify-center text-base shadow-md">
            🛡️
          </div>
          <span className="font-display font-bold text-lg tracking-widest text-slate-100">
            SENTINEL<span className="text-accent-cyan">X</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {filtered.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="font-mono text-base w-5 text-center">{item.icon}</span>
            <span className="font-body text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom: user + connection status */}
      <div className="px-3 py-4 border-t border-border space-y-3">
        {/* Live connection indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-card">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-mono text-xs text-slate-500">
            {connected ? 'Live feed' : 'Disconnected'}
          </span>
        </div>

        {/* User info */}
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-purple/30 border border-border flex items-center justify-center text-xs font-mono text-accent-cyan font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">{user?.name}</p>
            <p className="text-xs text-slate-600 font-mono capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-600 hover:text-red-400 transition-colors text-sm"
            title="Logout"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
