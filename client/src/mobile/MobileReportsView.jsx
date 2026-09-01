import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Filter, 
  TrendingUp, 
  GraduationCap, 
  Users, 
  DollarSign, 
  Calendar 
} from 'lucide-react';

export function MobileReportsView({
  leads = [],
  admissions = [],
  payments = [],
  token,
  API_BASE
}) {
  const [period, setPeriod] = useState('6_months');

  const totalLeads = leads.length;
  const totalAdmissions = admissions.length;
  const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((totalAdmissions / totalLeads) * 100) : 0;

  return (
    <div className="mobile-reports-view">
      <div className="mobile-view-header">
        <div>
          <h2>Analytics & Reports</h2>
          <span>Performance summaries & export metrics</span>
        </div>
        <button className="mobile-add-btn secondary" onClick={() => alert('📊 Generating PDF Report summary...')}>
          <Download size={14} /> Export
        </button>
      </div>

      {/* Period Filter */}
      <div className="mobile-month-filter-bar">
        <Filter size={14} className="text-blue" />
        <span className="filter-label">Report Period:</span>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)} 
          className="mobile-month-select"
        >
          <option value="6_months">Last 6 Months</option>
          <option value="12_months">Last 12 Months</option>
          <option value="this_year">This Year (YTD)</option>
        </select>
      </div>

      {/* KPI Cards Grid */}
      <div className="mobile-card-grid-2col">
        <div className="mobile-report-kpi-card blue">
          <span>Total Enquiries</span>
          <b>{totalLeads}</b>
          <small>Pipeline logged</small>
        </div>
        <div className="mobile-report-kpi-card purple">
          <span>Total Admissions</span>
          <b>{totalAdmissions}</b>
          <small>{conversionRate}% conversion</small>
        </div>
        <div className="mobile-report-kpi-card emerald">
          <span>Total Revenue</span>
          <b>₹{totalRevenue.toLocaleString()}</b>
          <small>Fee collections</small>
        </div>
        <div className="mobile-report-kpi-card amber">
          <span>Receipts Count</span>
          <b>{payments.length}</b>
          <small>Recorded receipts</small>
        </div>
      </div>

      {/* Section 1: Revenue & Enquiries Summary */}
      <div className="mobile-chart-card" style={{ marginTop: 16 }}>
        <div className="chart-card-header">
          <TrendingUp size={18} className="text-emerald" />
          <div>
            <h4>Executive Revenue & Conversion Summary</h4>
            <span>High-level CRM metrics</span>
          </div>
        </div>

        <div className="mobile-funnel-stack">
          <div className="mobile-funnel-row">
            <div className="funnel-label-line">
              <span>Overall Lead Conversion Rate</span>
              <b>{conversionRate}%</b>
            </div>
            <div className="funnel-track">
              <div className="funnel-bar" style={{ width: `${Math.min(100, conversionRate)}%` }}></div>
            </div>
          </div>

          <div className="mobile-funnel-row">
            <div className="funnel-label-line">
              <span>Admissions Completed ({totalAdmissions})</span>
              <b>{totalLeads > 0 ? Math.round((totalAdmissions / totalLeads) * 100) : 0}%</b>
            </div>
            <div className="funnel-track">
              <div className="funnel-bar" style={{ width: `${totalLeads > 0 ? Math.round((totalAdmissions / totalLeads) * 100) : 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

