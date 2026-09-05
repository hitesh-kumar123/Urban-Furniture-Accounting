import React from 'react';

export const LoadingSpinner = ({ message = 'Loading live workforce data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 w-full gap-3 text-on-surface-variant">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="font-body-sm text-body-sm text-outline animate-pulse">{message}</p>
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
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center shadow-inner">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="font-title-md text-title-md font-bold text-on-surface">{title}</h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
