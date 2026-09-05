import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  iconRight = null,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-indigo-700/20',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400/80 shadow-sm',
    outline: 'bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-100',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border border-emerald-700/20'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 font-medium',
    md: 'text-sm px-3.5 py-2 font-medium',
    lg: 'text-base px-4 py-2.5 font-semibold'
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
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      ) : null}
      <span>{children}</span>
      {iconRight && !loading && (
        <span className="material-symbols-outlined text-[18px]">{iconRight}</span>
      )}
    </button>
  );
};
