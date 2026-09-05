import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', icon = null }) => {
  const variantStyles = {
    default: 'bg-surface-container text-on-surface-variant',
    primary: 'bg-primary-container/10 text-primary',
    secondary: 'bg-secondary-fixed text-on-secondary-fixed',
    success: 'bg-emerald-500/10 text-emerald-700',
    warning: 'bg-amber-500/15 text-amber-800',
    danger: 'bg-rose-500/15 text-rose-700',
    info: 'bg-tertiary-fixed text-on-tertiary-fixed',
    outline: 'border border-outline-variant text-on-surface-variant'
  };

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.2',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold tracking-wide ${
        variantStyles[variant] || variantStyles.default
      } ${sizeStyles[size] || sizeStyles.sm}`}
    >
      {icon && <span className="material-symbols-outlined text-xs">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
