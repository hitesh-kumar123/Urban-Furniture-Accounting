import React from 'react';

export const LoadingSpinner = ({ message = 'Loading workforce data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 w-full gap-3 text-[#A6A3A0]">
      <div className="w-8 h-8 border-2 border-white/10 border-t-[#FF6B3D] rounded-full animate-spin"></div>
      <p className="text-xs text-[#6F6C69]">{message}</p>
    </div>
  );
};

export const EmptyState = ({
  icon = 'inbox',
  title = 'No records found',
  description = 'There are no items to display for the current filter.',
  action = null
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#111114] rounded-lg border border-white/10 gap-3">
      <div className="w-12 h-12 rounded bg-[#17171B] text-[#FF6B3D] flex items-center justify-center border border-white/5">
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <h3 className="text-sm font-bold text-[#F5F2EA]">{title}</h3>
      <p className="text-xs text-[#6F6C69] max-w-md">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
