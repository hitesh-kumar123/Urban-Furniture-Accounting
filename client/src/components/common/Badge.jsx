import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', icon = null, className = '' }) => {
  const variantStyles = {
    default: 'bg-[#17171B] text-[#A6A3A0] border border-white/10',
    primary: 'bg-[#FF6B3D]/10 text-[#FF8A65] border border-[#FF6B3D]/25',
    secondary: 'bg-[#1E1E24] text-[#F5F2EA] border border-white/10',
    success: 'bg-[#39D98A]/10 text-[#39D98A] border border-[#39D98A]/25',
    warning: 'bg-[#F5B942]/10 text-[#F5B942] border border-[#F5B942]/25',
    danger: 'bg-[#FF5C5C]/10 text-[#FF5C5C] border border-[#FF5C5C]/25',
    info: 'bg-[#58B7FF]/10 text-[#58B7FF] border border-[#58B7FF]/25',
    outline: 'border border-white/15 text-[#A6A3A0] bg-transparent'
  };

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 leading-none',
    sm: 'text-xs px-2 py-0.5 leading-tight',
    md: 'text-xs px-2.5 py-1 font-semibold leading-normal'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium tracking-normal ${
        variantStyles[variant] || variantStyles.default
      } ${sizeStyles[size] || sizeStyles.sm} ${className}`}
    >
      {icon && <span className="material-symbols-outlined text-[13px]">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
