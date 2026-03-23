import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSocket } from '../hooks/useSocket';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function Layout() {
  const { liveAlerts } = useSocket();

  // Toast new critical alerts
  useEffect(() => {
    if (liveAlerts.length === 0) return;
    const latest = liveAlerts[0];
    if (latest?.alert?.severity === 'critical') {
      toast.error(
        `🚨 CRITICAL: ${latest.alert.title}`,
        { duration: 6000, position: 'top-right' }
      );
    } else if (latest?.alert?.severity === 'high') {
      toast(
        `⚠ HIGH: ${latest.alert.title}`,
        { duration: 4000, icon: '🔴', position: 'top-right' }
      );
    }
  }, [liveAlerts]);

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
