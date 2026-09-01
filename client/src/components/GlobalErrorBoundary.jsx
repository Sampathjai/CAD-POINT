import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GlobalErrorBoundary caught runtime error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="global-loader-wrap" style={{ background: '#0f172a' }}>
          <div className="global-loader-content">
            <div className="crm-state-icon error" style={{ width: 64, height: 64, margin: '0 auto 16px' }}>
              <AlertTriangle size={32} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: '0 0 6px' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.5 }}>
              We encountered an unexpected issue while loading this view. Please refresh or try again.
            </p>
            <button
              onClick={this.handleReload}
              className="mobile-btn-primary"
              style={{ minWidth: 160, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
