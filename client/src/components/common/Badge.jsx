import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', icon = null, className = '' }) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
    secondary: 'bg-violet-50 text-violet-700 border border-violet-200/80',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    info: 'bg-cyan-50 text-cyan-700 border border-cyan-200/80',
    outline: 'border border-slate-300 text-slate-700 bg-white'
  };

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 leading-none',
    sm: 'text-xs px-2 py-0.5 leading-tight',
    md: 'text-xs px-2.5 py-1 font-semibold leading-normal'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium tracking-normal ${
        variantStyles[variant] || variantStyles.default
      } ${sizeStyles[size] || sizeStyles.sm} ${className}`}
    >
      {icon && <span className="material-symbols-outlined text-[13px]">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
