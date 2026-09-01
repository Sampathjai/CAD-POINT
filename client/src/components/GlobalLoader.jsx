import React from 'react';

export function GlobalLoader({ message = 'Loading CADPOINT CRM...', subtext = 'Initializing secure workspace & data...' }) {
  return (
    <div className="global-loader-wrap">
      <div className="global-loader-content">
        <div className="global-loader-logo">
          CP
        </div>
        <div className="global-loader-brand">
          CADPOINT COIMBATORE
        </div>
        <div className="global-loader-sub">
          {message}
        </div>
        <div className="global-loader-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div style={{ marginTop: 20, fontSize: 11, color: '#64748b', fontWeight: 600 }}>
          {subtext}
        </div>
      </div>
    </div>
  );
}
