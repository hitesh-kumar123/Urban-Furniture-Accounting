import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', icon = null, className = '' }) => {
  const variantStyles = {
    default: 'bg-[#F0ECE1] text-[#6B665C] border border-[#E7E2D9]',
    primary: 'bg-[#E8F4F1] text-[#0F5C4A] border border-[#C5E4DC]',
    secondary: 'bg-white text-[#1C1B19] border border-[#E7E2D9]',
    success: 'bg-[#E8F4F1] text-[#0F5C4A] border border-[#C5E4DC]',
    warning: 'bg-[#FAF4E8] text-[#8A6D3B] border border-[#ECD9B5]',
    danger: 'bg-[#FDF1EE] text-[#B5482E] border border-[#F3C9BF]',
    info: 'bg-[#EFF6FB] text-[#20639B] border border-[#CCE3F5]',
    outline: 'border border-[#E7E2D9] text-[#6B665C] bg-transparent'
  };

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 leading-none',
    sm: 'text-xs px-2 py-0.5 leading-tight',
    md: 'text-xs px-2.5 py-1 font-medium leading-normal'
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
