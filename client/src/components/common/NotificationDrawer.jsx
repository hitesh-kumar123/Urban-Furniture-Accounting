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
      return JSON.parse(localStorage.getItem('staffora_read_notifications') || localStorage.getItem('peoplepay360_read_notifications') || '[]');
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
    localStorage.setItem('staffora_read_notifications', JSON.stringify(updated));
    showToast('All notifications marked as read.', 'info');
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
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-[#E7E2D9] rounded-xl shadow-xl p-4 z-50 flex flex-col gap-3 font-body">
      <div className="flex items-center justify-between pb-2 border-b border-[#E7E2D9]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0F5C4A] text-lg">notifications</span>
          <h4 className="text-sm font-semibold text-[#1C1B19]">System Notifications</h4>
        </div>
        <div className="flex items-center gap-2">
          {unreadNotifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-[#0F5C4A] hover:underline font-medium transition-colors"
            >
              Clear All
            </button>
          )}
          <span className="text-[11px] font-medium bg-[#E8F4F1] text-[#0F5C4A] border border-[#0F5C4A]/25 px-2 py-0.5 rounded-full font-mono">
            {unreadNotifications.length} Unread
          </span>
        </div>
      </div>

      {notificationPermission !== 'granted' && (
        <div className="p-2.5 bg-[#FAF4E8] border border-[#8A6D3B]/30 rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#1C1B19]">
            <span className="material-symbols-outlined text-[#8A6D3B] text-sm">desktop_windows</span>
            <span>Enable desktop alerts</span>
          </div>
          <button
            onClick={requestBrowserPermission}
            className="px-2.5 py-1 bg-[#0F5C4A] hover:bg-[#0F5C4A]/90 text-white font-medium text-xs rounded transition-colors"
          >
            Allow
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {loading ? (
          <div className="py-8 text-center text-xs text-[#6B665C]">
            Scanning live operational updates...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#6B665C] flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-xl text-[#0F5C4A]">verified</span>
            <span className="text-[#1C1B19] font-medium">All Clear</span>
            <span>No pending actions or alerts.</span>
          </div>
        ) : (
          notifications.map((n) => {
            const isRead = readIds.includes(n.id);
            return (
              <div
                key={n.id}
                onClick={() => markSingleAsRead(n.id, n.path)}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  isRead
                    ? 'bg-[#FAF9F6] border-[#E7E2D9] opacity-60 hover:opacity-100'
                    : 'bg-[#FAF9F6] hover:bg-white border-[#E7E2D9] hover:border-[#0F5C4A]/40'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      n.type === 'warning'
                        ? 'bg-[#FAF4E8] text-[#8A6D3B]'
                        : n.type === 'info'
                        ? 'bg-[#E8F4F1] text-[#0F5C4A]'
                        : 'bg-[#E8F4F1] text-[#0F5C4A]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{n.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className={`text-xs font-semibold truncate ${isRead ? 'text-[#6B665C]' : 'text-[#1C1B19]'}`}>
                        {n.title}
                      </h5>
                      <span className="text-[11px] text-[#918C82] shrink-0 font-mono">{n.time}</span>
                    </div>
                    <p className="text-xs text-[#6B665C] mt-0.5 leading-tight">{n.desc}</p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#E7E2D9]">
                      <span className="text-[10px] uppercase font-mono text-[#918C82]">
                        {n.badge}
                      </span>
                      <span className="text-xs text-[#0F5C4A] font-medium flex items-center gap-0.5">
                        Open
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-2 border-t border-[#E7E2D9] flex justify-between items-center text-xs text-[#6B665C]">
        <button onClick={onClose} className="hover:text-[#1C1B19]">
          Close
        </button>
        <span className="font-mono text-[10px]">Staffora</span>
      </div>
    </div>
  );
};
