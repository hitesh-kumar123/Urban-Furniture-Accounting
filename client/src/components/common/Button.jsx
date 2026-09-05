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
  const base = 'inline-flex items-center justify-center gap-1.5 rounded font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus:outline-none cursor-pointer select-none';

  const variants = {
    primary: 'bg-[#FF6B3D] text-[#0B0B0D] hover:bg-[#FF8A65] font-semibold shadow-xs',
    secondary: 'bg-[#17171B] text-[#F5F2EA] border border-white/10 hover:bg-[#1E1E24] hover:border-white/20',
    outline: 'bg-transparent text-[#A6A3A0] border border-white/10 hover:bg-[#17171B] hover:text-[#F5F2EA]',
    ghost: 'text-[#A6A3A0] hover:bg-[#17171B] hover:text-[#F5F2EA]',
    danger: 'bg-[#FF5C5C]/10 text-[#FF5C5C] border border-[#FF5C5C]/20 hover:bg-[#FF5C5C]/20',
    success: 'bg-[#39D98A]/10 text-[#39D98A] border border-[#39D98A]/20 hover:bg-[#39D98A]/20'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 font-medium',
    md: 'text-xs px-3 py-1.5 font-semibold',
    lg: 'text-sm px-4 py-2 font-semibold'
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
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
      ) : null}
      <span>{children}</span>
      {iconRight && !loading && (
        <span className="material-symbols-outlined text-[16px]">{iconRight}</span>
      )}
    </button>
  );
};
