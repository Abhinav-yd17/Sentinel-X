import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    if (!socketInstance || socketInstance.disconnected) {
      socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
      });
    }

    const socket = socketInstance;

    socket.on('connect', () => { console.log('✅ Socket connected'); setConnected(true); });
    socket.on('disconnect', () => { console.log('❌ Socket disconnected'); setConnected(false); });
    socket.on('connect_error', (err) => { console.log('Socket error:', err.message); setConnected(false); });
    socket.on('connected', () => setConnected(true));
    socket.on('new_event', (data) => setLiveEvents((prev) => [data, ...prev].slice(0, 50)));
    socket.on('new_alert', (data) => setLiveAlerts((prev) => [data, ...prev].slice(0, 20)));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('connected');
      socket.off('new_event');
      socket.off('new_alert');
    };
  }, []);

  const subscribeUser = (id) => socketInstance?.emit('subscribe_user', id);
  const unsubscribeUser = (id) => socketInstance?.emit('unsubscribe_user', id);

  return { connected, liveEvents, liveAlerts, subscribeUser, unsubscribeUser };
};