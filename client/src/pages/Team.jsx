import { useEffect, useState } from 'react';
import { usersAPI, authAPI } from '../api/services';
import { PageHeader, PageLoader, EmptyState } from '../components/UI';
import { timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  admin: 'text-red-400 bg-red-950 border-red-900',
  analyst: 'text-amber-400 bg-amber-950 border-amber-900',
  viewer: 'text-slate-400 bg-slate-900 border-slate-800',
};

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'analyst' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.portalUsers();
      setUsers(data.data);
    } catch { toast.error('Failed to load team'); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await authAPI.register(form);
      toast.success('User created');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'analyst' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await usersAPI.deletePortal(id);
      setUsers(users.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Team" subtitle="Portal users with dashboard access">
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add User</button>
      </PageHeader>

      {loading ? <PageLoader /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((user) => (
            <div key={user._id} className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 border border-border flex items-center justify-center font-display font-bold text-accent-cyan">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border capitalize ${ROLE_COLORS[user.role]}`}>
                  {user.role}
                </span>
              </div>
              <h3 className="font-display font-semibold text-slate-200 mb-0.5">{user.name}</h3>
              <p className="text-xs font-mono text-slate-500 mb-3">{user.email}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-slate-600">
                  Last seen {user.lastSeen ? timeAgo(user.lastSeen) : 'never'}
                </p>
                <button onClick={() => handleDelete(user._id)}
                  className="text-xs text-red-400 hover:text-red-300 font-mono transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && <EmptyState icon="◉" message="No team members found" />}
        </div>
      )}

      {/* Create user modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display font-semibold text-slate-200 text-lg">Add Team Member</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
            </div>
            <div className="space-y-4">
              {[
                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Smith' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@example.com' },
                { key: 'password', label: 'Password', type: 'password', placeholder: '8+ characters' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                  <input type={type} className="input" placeholder={placeholder}
                    value={form[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Role</label>
                <select className="input" value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="viewer">Viewer — read-only access</option>
                  <option value="analyst">Analyst — investigate & resolve alerts</option>
                  <option value="admin">Admin — full access</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn-primary flex-1" disabled={saving} onClick={handleCreate}>
                {saving ? 'Creating…' : 'Create User'}
              </button>
              <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
