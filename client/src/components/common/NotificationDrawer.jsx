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
      title: 'August Payroll Settled',
      desc: 'Historical payrun of $22,771.20 marked as Paid.',
      time: '2h ago',
      path: '/payslips',
      badge: 'Disbursement',
      icon: 'verified'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#17171B] border border-white/10 rounded-lg shadow-2xl p-3 z-50 flex flex-col gap-2">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#FF6B3D] text-lg">notifications</span>
          <h4 className="text-xs font-bold text-[#F5F2EA]">Notifications</h4>
        </div>
        <span className="text-[10px] font-semibold bg-[#FF6B3D]/10 text-[#FF8A65] border border-[#FF6B3D]/25 px-1.5 py-0.5 rounded">
          3 Unread
        </span>
      </div>

      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              navigate(n.path);
              onClose();
            }}
            className="p-2.5 rounded bg-[#111114] hover:bg-[#1E1E24] border border-white/5 hover:border-white/15 cursor-pointer transition-colors"
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
                  <h5 className="text-xs font-semibold text-[#F5F2EA] truncate">
                    {n.title}
                  </h5>
                  <span className="text-[10px] text-[#6F6C69] shrink-0">{n.time}</span>
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
        ))}
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
