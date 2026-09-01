import React from 'react';

export function CardSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton-box" style={{ width: '40%', height: 18 }} />
            <div className="skeleton-box" style={{ width: '20%', height: 16, borderRadius: 12 }} />
          </div>
          <div className="skeleton-box" style={{ width: '70%', height: 14 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div className="skeleton-box" style={{ flex: 1, height: 36, borderRadius: 10 }} />
            <div className="skeleton-box" style={{ flex: 1, height: 36, borderRadius: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, borderBottom: '1px solid #f1f5f9', pb: 12 }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton-box" style={{ flex: 1, height: 16 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton-box" style={{ flex: 1, height: 14 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Metric Carousel Skeleton */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'hidden' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card" style={{ flex: '0 0 240px', height: 110 }}>
            <div className="skeleton-box" style={{ width: '50%', height: 14 }} />
            <div className="skeleton-box" style={{ width: '40%', height: 28, marginTop: 6 }} />
          </div>
        ))}
      </div>
      {/* Chart Skeleton */}
      <div className="skeleton-card" style={{ height: 200 }}>
        <div className="skeleton-box" style={{ width: '40%', height: 18 }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140, marginTop: 12 }}>
          {[40, 65, 30, 85, 55, 90].map((h, idx) => (
            <div key={idx} className="skeleton-box" style={{ flex: 1, height: `${h}%`, borderRadius: '6px 6px 0 0' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

