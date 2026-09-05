import React from 'react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon,
  badgeText,
  badgeType = 'success',
  trend = null,
  iconBg = 'bg-[#E8F4F1]',
  iconColor = 'text-[#0F5C4A]'
}) => {
  return (
    <div className="bg-white rounded-xl border border-[#E7E2D9] p-4 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#6B665C]">
          {title}
        </span>
        {icon && (
          <div className={`w-7 h-7 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center border border-[#E7E2D9]`}>
            <span className="material-symbols-outlined text-sm">{icon}</span>
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-bold text-[#1C1B19] tracking-tight font-mono">
          {value}
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {badgeText && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                badgeType === 'success'
                  ? 'bg-[#E8F4F1] text-[#0F5C4A] border border-[#0F5C4A]/20'
                  : badgeType === 'warning'
                  ? 'bg-[#FAF4E8] text-[#8A6D3B] border border-[#8A6D3B]/20'
                  : badgeType === 'danger'
                  ? 'bg-[#FDF1EE] text-[#B5482E] border border-[#B5482E]/20'
                  : 'bg-[#FAF9F6] text-[#6B665C] border border-[#E7E2D9]'
              }`}
            >
              {badgeText}
            </span>
          )}

          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                trend.isPositive ? 'text-[#0F5C4A]' : 'text-[#B5482E]'
              }`}
            >
              <span className="material-symbols-outlined text-xs">
                {trend.isPositive ? 'trending_up' : 'trending_down'}
              </span>
              <span>{trend.value}</span>
              {trend.label && <span className="text-[#6B665C] text-xs ml-1">{trend.label}</span>}
            </span>
          )}

          {subtext && !trend && (
            <span className="text-xs text-[#6B665C]">{subtext}</span>
          )}
        </div>
      </div>
    </div>
  );
};
