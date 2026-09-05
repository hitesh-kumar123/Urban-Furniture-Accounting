import React from 'react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon,
  badgeText,
  badgeType = 'success',
  trend = null,
  iconBg = 'bg-[#17171B]',
  iconColor = 'text-[#FF6B3D]'
}) => {
  return (
    <div className="midnight-card p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6F6C69]">
          {title}
        </span>
        {icon && (
          <div className={`w-7 h-7 rounded ${iconBg} ${iconColor} flex items-center justify-center border border-white/5`}>
            <span className="material-symbols-outlined text-[16px]">{icon}</span>
          </div>
        )}
      </div>

      <div>
        <div className="text-xl font-bold text-[#F5F2EA] tracking-tight font-mono-val">
          {value}
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {badgeText && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                badgeType === 'success'
                  ? 'bg-[#39D98A]/10 text-[#39D98A] border border-[#39D98A]/20'
                  : badgeType === 'warning'
                  ? 'bg-[#F5B942]/10 text-[#F5B942] border border-[#F5B942]/20'
                  : badgeType === 'danger'
                  ? 'bg-[#FF5C5C]/10 text-[#FF5C5C] border border-[#FF5C5C]/20'
                  : 'bg-[#17171B] text-[#A6A3A0] border border-white/10'
              }`}
            >
              {badgeText}
            </span>
          )}

          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                trend.isPositive ? 'text-[#39D98A]' : 'text-[#FF5C5C]'
              }`}
            >
              <span className="material-symbols-outlined text-xs">
                {trend.isPositive ? 'trending_up' : 'trending_down'}
              </span>
              <span>{trend.value}</span>
              {trend.label && <span className="text-[#6F6C69] text-[10px] ml-1">{trend.label}</span>}
            </span>
          )}

          {subtext && !trend && (
            <span className="text-[11px] text-[#6F6C69]">{subtext}</span>
          )}
        </div>
      </div>
    </div>
  );
};
