import React from 'react';
import { AlertCircle, FolderOpen, RefreshCw } from 'lucide-react';
import { CardSkeleton } from './SkeletonLoader';

export function CRMStateView({
  isLoading = false,
  isError = false,
  isEmpty = false,
  loadingSkeleton = <CardSkeleton count={3} />,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no items to display right now.',
  emptyIcon = <FolderOpen size={28} />,
  errorTitle = 'Unable to load data',
  errorMessage = 'We couldn\'t connect to the server or retrieve records.',
  onRetry,
  children
}) {
  if (isLoading) {
    return <div className="crm-state-loading">{loadingSkeleton}</div>;
  }

  if (isError) {
    return (
      <div className="crm-state-wrap">
        <div className="crm-state-icon error">
          <AlertCircle size={28} />
        </div>
        <div className="crm-state-title">{errorTitle}</div>
        <div className="crm-state-desc">{errorMessage}</div>
        {onRetry && (
          <button className="mobile-btn-secondary" onClick={onRetry}>
            <RefreshCw size={14} /> Try Again
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="crm-state-wrap">
        <div className="crm-state-icon empty">
          {emptyIcon}
        </div>
        <div className="crm-state-title">{emptyTitle}</div>
        <div className="crm-state-desc">{emptyMessage}</div>
      </div>
    );
  }

  return <>{children}</>;
}
