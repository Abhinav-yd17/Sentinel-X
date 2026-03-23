import { create } from 'zustand';
import { authAPI } from '../api/services';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return set({ loading: false });
    try {
      const { data } = await authAPI.me();
      set({ user: data.data, isAuthenticated: true, loading: false });
    } catch {
      localStorage.clear();
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await authAPI.login(email, password);
    const { accessToken, refreshToken, user } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, isAuthenticated: true });
    return user;
  },

  logout: async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
