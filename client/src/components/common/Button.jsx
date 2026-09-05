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
    primary: 'bg-[#0F5C4A] text-white hover:bg-[#0B4739] font-medium border border-transparent shadow-xs',
    secondary: 'bg-white text-[#1C1B19] border border-[#E7E2D9] hover:bg-[#F5F2EB] hover:border-[#D3CDC2]',
    outline: 'bg-transparent text-[#6B665C] border border-[#E7E2D9] hover:bg-[#F0ECE1] hover:text-[#1C1B19]',
    ghost: 'text-[#6B665C] hover:bg-[#F0ECE1] hover:text-[#1C1B19]',
    danger: 'bg-[#FDF1EE] text-[#B5482E] border border-[#F3C9BF] hover:bg-[#F9DDD6]',
    success: 'bg-[#E8F4F1] text-[#0F5C4A] border border-[#C5E4DC] hover:bg-[#D7EDE6]'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 font-medium',
    md: 'text-xs px-3 py-1.5 font-medium',
    lg: 'text-sm px-4 py-2 font-medium'
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
