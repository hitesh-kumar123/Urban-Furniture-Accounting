import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { timeOffApi } from '../../api/timeOffApi';
import { payrunApi } from '../../api/payrunApi';

export const NotificationDrawer = ({ isOpen, onClose, onUnreadCountChange }) => {
  const navigate = useNavigate();
  const { requestBrowserPermission, notificationPermission, showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('peoplepay360_read_notifications') || '[]');
    } catch (e) {
      return [];
    }
  });

  const fetchLiveAlerts = async () => {
    setLoading(true);
    const alerts = [];
    try {
      // 1. Fetch pending leaves
      const leaveRes = await timeOffApi.getRequests({ status: 'Pending' });
      if (leaveRes.success && leaveRes.data?.length > 0) {
        leaveRes.data.slice(0, 3).forEach((req) => {
          const empName = req.employee?.firstName 
            ? `${req.employee.firstName} ${req.employee.lastName || ''}`.trim()
            : 'An employee';
          alerts.push({
            id: `leave-${req._id}`,
            type: 'warning',
            title: 'Pending Leave Request',
            desc: `${empName} requested ${req.timeOffType?.name || 'Leave'} (${req.numberOfDays || 1} day).`,
            time: req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN') : 'Recent',
            path: '/time-off',
            badge: 'Action Required',
            icon: 'event_busy'
          });
        });
      }

      // 2. Fetch latest payruns
      const payrunRes = await payrunApi.getAll();
      if (payrunRes.success && payrunRes.data?.length > 0) {
        const latestPayrun = payrunRes.data[0];
        alerts.push({
          id: `payrun-${latestPayrun._id}`,
          type: latestPayrun.status === 'Paid' ? 'success' : latestPayrun.status === 'Confirmed' ? 'info' : 'warning',
          title: `${latestPayrun.name || 'Payrun'} (${latestPayrun.status})`,
          desc: latestPayrun.status === 'Paid'
            ? `Payroll settled for ${latestPayrun.totals?.employeeCount || 0} employees.`
            : `Current batch state is ${latestPayrun.status}. Click to review.`,
          time: latestPayrun.updatedAt ? new Date(latestPayrun.updatedAt).toLocaleDateString('en-IN') : 'Recent',
          path: `/payruns/${latestPayrun._id}`,
          badge: 'Payroll Engine',
          icon: 'receipt_long'
        });
      }
    } catch (err) {
      console.error('Failed to fetch live notifications:', err);
    } finally {
      setNotifications(alerts);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLiveAlerts();
    }
  }, [isOpen]);

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    localStorage.setItem('peoplepay360_read_notifications', JSON.stringify(updated));
    showToast({ title: 'Notifications Cleared', message: 'All notifications marked as read.', type: 'info' });
  };

  const markSingleAsRead = (id, path) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem('peoplepay360_read_notifications', JSON.stringify(updated));
    }
    navigate(path);
    onClose();
  };

  const unreadNotifications = notifications.filter((n) => !readIds.includes(n.id));

  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadNotifications.length);
    }
  }, [unreadNotifications.length, onUnreadCountChange]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#17171B] border border-white/10 rounded-lg shadow-2xl p-3 z-50 flex flex-col gap-2 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#FF6B3D] text-lg">notifications</span>
          <h4 className="text-xs font-bold text-[#F5F2EA]">System Notifications</h4>
        </div>
        <div className="flex items-center gap-2">
          {unreadNotifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[10px] text-[#FF8A65] hover:text-[#FF6B3D] font-mono font-semibold transition-colors"
            >
              Clear All
            </button>
          )}
          <span className="text-[10px] font-semibold bg-[#FF6B3D]/10 text-[#FF8A65] border border-[#FF6B3D]/25 px-1.5 py-0.5 rounded font-mono">
            {unreadNotifications.length} Unread
          </span>
        </div>
      </div>

      {notificationPermission !== 'granted' && (
        <div className="p-2 bg-[#FF6B3D]/10 border border-[#FF6B3D]/25 rounded flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#F5F2EA]">
            <span className="material-symbols-outlined text-[#FF8A65] text-sm">desktop_windows</span>
            <span>Enable Slack-style desktop popups</span>
          </div>
          <button
            onClick={requestBrowserPermission}
            className="px-2 py-0.5 bg-[#FF6B3D] hover:bg-[#FF8A65] text-[#0B0B0D] font-bold text-[10px] rounded transition-colors"
          >
            Allow
          </button>
        </div>
      )}

      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {loading ? (
          <div className="py-8 text-center text-xs text-[#6F6C69]">
            Scanning live operational updates...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#6F6C69] flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-xl text-[#39D98A]">verified</span>
            <span className="text-[#F5F2EA] font-semibold">All Clear</span>
            <span>No pending actions or alerts.</span>
          </div>
        ) : (
          notifications.map((n) => {
            const isRead = readIds.includes(n.id);
            return (
              <div
                key={n.id}
                onClick={() => markSingleAsRead(n.id, n.path)}
                className={`p-2.5 rounded border transition-colors cursor-pointer ${
                  isRead
                    ? 'bg-[#111114]/40 border-white/5 opacity-60 hover:opacity-100 hover:bg-[#111114]'
                    : 'bg-[#111114] hover:bg-[#1E1E24] border-white/10 hover:border-[#FF6B3D]/30'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs shrink-0 ${
                      n.type === 'warning'
                        ? 'bg-[#F5B942]/10 text-[#F5B942]'
                        : n.type === 'info'
                        ? 'bg-[#58B7FF]/10 text-[#58B7FF]'
                        : 'bg-[#39D98A]/10 text-[#39D98A]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{n.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className={`text-xs font-semibold truncate ${isRead ? 'text-[#A6A3A0]' : 'text-[#F5F2EA]'}`}>
                        {n.title}
                      </h5>
                      <span className="text-[10px] text-[#6F6C69] shrink-0 font-mono">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#A6A3A0] mt-0.5 leading-tight">{n.desc}</p>
                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/5">
                      <span className="text-[9px] uppercase font-mono tracking-wider text-[#6F6C69]">
                        {n.badge}
                      </span>
                      <span className="text-[10px] text-[#FF8A65] font-semibold flex items-center gap-0.5">
                        Open <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-[#6F6C69]">
        <button onClick={onClose} className="hover:text-[#F5F2EA]">
          Close
        </button>
        <span className="font-mono">Staffora OS</span>
      </div>
    </div>
  );
};
