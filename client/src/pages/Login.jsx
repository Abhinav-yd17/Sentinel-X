import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('admin@sentinelx.dev');
  const [password, setPassword] = useState('Admin@123456');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary grid-bg flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-accent-cyan/60 mb-5 shadow-lg shadow-red-900/30">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-wide text-slate-100">
            SENTINEL<span className="text-accent-cyan">X</span>
          </h1>
          <p className="text-slate-500 font-mono text-xs tracking-widest mt-1">
            THREAT MONITORING PLATFORM
          </p>
        </div>

        {/* Card */}
        <div className="card border-border/80">
          <h2 className="font-display text-lg font-semibold text-slate-200 mb-6">
            Sign in to dashboard
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider uppercase">
                Email
              </label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sentinelx.dev"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider uppercase">
                Password
              </label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 py-2.5 text-base"
            >
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 bg-bg-secondary rounded-lg border border-border">
            <p className="text-xs font-mono text-slate-500 mb-1">Demo credentials</p>
            <p className="text-xs font-mono text-slate-400">Admin: admin@sentinelx.dev</p>
            <p className="text-xs font-mono text-slate-400">Analyst: analyst@sentinelx.dev</p>
            <p className="text-xs font-mono text-slate-400">Password: Admin@123456 / Analyst@123456</p>
          </div>
        </div>

        <p className="text-center text-xs font-mono text-slate-600 mt-6">
          SentinelX v1.0 · Secured Connection
        </p>
      </div>
    </div>
  );
}
