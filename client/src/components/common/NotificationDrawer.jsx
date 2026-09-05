import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotificationDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const notifications = [
    {
      id: 1,
      type: 'warning',
      title: 'Pending Leave Approval Required',
      desc: 'Alex Turner submitted a 2-day Paid Annual Leave request.',
      time: '12m ago',
      path: '/time-off',
      badge: 'Action Required',
      icon: 'flight_takeoff'
    },
    {
      id: 2,
      type: 'info',
      title: 'September 2026 Payrun in Draft',
      desc: 'Draft payrun initialized. Eligible contracts scanned.',
      time: '45m ago',
      path: '/payruns',
      badge: 'Payroll Engine',
      icon: 'receipt_long'
    },
    {
      id: 3,
      type: 'success',
      title: 'August Payroll Successfully Settled',
      desc: 'Historical payrun of $22,771.20 marked as Paid.',
      time: '2h ago',
      path: '/payslips',
      badge: 'Disbursement',
      icon: 'verified'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-3xl shadow-2xl p-4 z-50 animate-fadeIn flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">notifications_active</span>
          <h4 className="text-sm font-bold text-slate-800">Operational Notifications</h4>
        </div>
        <span className="text-[11px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          3 Unread
        </span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              navigate(n.path);
              onClose();
            }}
            className="p-3 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200/60 cursor-pointer transition-all duration-200 group"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                  n.type === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : n.type === 'info'
                    ? 'bg-indigo-100 text-primary'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{n.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors">
                    {n.title}
                  </h5>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.time}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.desc}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white rounded-md border border-slate-200 text-slate-600">
                    {n.badge}
                  </span>
                  <span className="text-[10px] font-bold text-primary flex items-center gap-0.5 ml-auto">
                    Open <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-800 font-semibold"
        >
          Close
        </button>
        <button
          onClick={() => {
            navigate('/time-off');
            onClose();
          }}
          className="text-primary font-bold hover:underline"
        >
          View Governance Central →
        </button>
      </div>
    </div>
  );
};
