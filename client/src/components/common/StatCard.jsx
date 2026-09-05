import React from 'react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon,
  badgeText,
  badgeType = 'success',
  trend = null, // e.g. { value: '+4.5%', label: 'vs last mo', isPositive: true }
  iconBg = 'bg-indigo-50',
  iconColor = 'text-indigo-600'
}) => {
  return (
    <div className="staffora-card p-5 flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono-val">
          {value}
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {badgeText && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                badgeType === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                  : badgeType === 'warning'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                  : badgeType === 'danger'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                  : 'bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              {badgeText}
            </span>
          )}

          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {trend.isPositive ? 'trending_up' : 'trending_down'}
              </span>
              <span>{trend.value}</span>
              {trend.label && <span className="text-slate-400 text-[11px] ml-1">{trend.label}</span>}
            </span>
          )}

          {subtext && !trend && (
            <span className="text-xs text-slate-500">{subtext}</span>
          )}
        </div>
      </div>
    </div>
  );
};
