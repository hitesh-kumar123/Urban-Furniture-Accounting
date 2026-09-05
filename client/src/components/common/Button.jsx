import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-primary-container',
    secondary: 'bg-secondary text-on-secondary hover:bg-secondary-container',
    outline: 'bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container-low',
    ghost: 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface shadow-none',
    danger: 'bg-error text-on-error hover:opacity-90',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3.5 py-2',
    lg: 'text-base px-5 py-2.5'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined text-base animate-spin">refresh</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-base">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
