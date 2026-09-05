import React from 'react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon,
  badgeText,
  badgeType = 'success',
  iconBg = 'bg-primary-fixed/40',
  iconColor = 'text-primary'
}) => {
  return (
    <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex items-center justify-between mb-space-xs">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
          {title}
        </span>
        <span className={`p-1.5 rounded-xl ${iconBg} ${iconColor} flex items-center`}>
          <span className="material-symbols-outlined text-base">{icon}</span>
        </span>
      </div>
      <div>
        <div className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight font-tabular-numeric">
          {value}
        </div>
        <div className="flex items-center gap-space-2xs mt-1 flex-wrap">
          {badgeText && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-label-sm text-label-sm font-bold ${
                badgeType === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : badgeType === 'warning'
                  ? 'bg-amber-500/10 text-amber-800'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {badgeText}
            </span>
          )}
          {subtext && (
            <span className="font-caption text-caption text-on-surface-variant">{subtext}</span>
          )}
        </div>
      </div>
    </div>
  );
};
