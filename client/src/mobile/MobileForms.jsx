import React from 'react';

export function MobileFormWrapper({ title, subtitle, onSubmit, children, submitLabel = 'Save Record', isSubmitting = false }) {
  return (
    <form className="mobile-form-container" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {title && (
        <div className="mobile-form-header">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      )}

      <div className="mobile-form-fields-stack">
        {children}
      </div>

      <div className="mobile-form-sticky-footer">
        <button className="mobile-btn-primary full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function MobileFormGroup({ label, required = false, children, helpText }) {
  return (
    <div className="mobile-form-group">
      <label className="mobile-form-label">
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {helpText && <span className="mobile-form-help">{helpText}</span>}
    </div>
  );
}

