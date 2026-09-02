import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Filter, 
  TrendingUp, 
  GraduationCap, 
  Users, 
  DollarSign, 
  Calendar,
  CreditCard,
  PieChart,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export function MobileReportsView({
  leads = [],
  admissions = [],
  payments = [],
  token,
  API_BASE,
  onExportExcel
}) {
  const [period, setPeriod] = useState('6_months');

  const safeLeads = Array.isArray(leads) ? leads.filter(Boolean) : [];
  const safeAdmissions = Array.isArray(admissions) ? admissions.filter(Boolean) : [];
  const safePayments = Array.isArray(payments) ? payments.filter(Boolean) : [];

  const totalLeads = safeLeads.length;
  const totalAdmissions = safeAdmissions.length;

  // Real Business Revenue Calculations
  const totalBusinessValue = safeAdmissions.reduce((sum, adm) => sum + (Number(adm?.finalFee || adm?.agreedFee) || 0), 0);
  const collectedRevenue = safePayments.reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
  const pendingRevenue = Math.max(0, totalBusinessValue - collectedRevenue);
  const collectionRate = totalBusinessValue > 0 ? Math.round((collectedRevenue / totalBusinessValue) * 100) : 100;
  const conversionRate = totalLeads > 0 ? Math.round((totalAdmissions / totalLeads) * 100) : 0;

  // Revenue Breakdown by Payment Method
  const methodMap = {};
  safePayments.forEach((p) => {
    if (!p) return;
    const method = (p.paymentMethod || p.method || 'OTHER').toUpperCase().replace('_', ' ');
    const amt = Number(p.amount) || 0;
    methodMap[method] = (methodMap[method] || 0) + amt;
  });

  // Revenue Breakdown by Course
  const courseRevenueMap = {};
  safeAdmissions.forEach((adm) => {
    if (!adm) return;
    const courseName = adm.course?.name || 'General Course';
    const fee = Number(adm.finalFee || adm.agreedFee) || 0;
    courseRevenueMap[courseName] = (courseRevenueMap[courseName] || 0) + fee;
  });

  const handleExport = () => {
    if (typeof onExportExcel === 'function') {
      onExportExcel(safeAdmissions, safePayments);
    } else {
      alert('📊 Exporting Revenue Summary Excel Report...');
    }
  };

  return (
    <div className="mobile-reports-view">
      <div className="mobile-view-header">
        <div>
          <h2>Analytics & Reports</h2>
          <span>Performance summaries & revenue metrics</span>
        </div>
        <button className="mobile-add-btn secondary" onClick={handleExport}>
          <Download size={14} /> Export Excel
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

      {/* Top Level Overview Cards */}
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
      </div>

      {/* Dedicated Business Revenue Section */}
      <div className="mobile-chart-card mobile-revenue-section" style={{ marginTop: 16 }}>
        <div className="chart-card-header">
          <DollarSign size={20} className="text-emerald" />
          <div>
            <h4>Business Revenue Overview</h4>
            <span>Financial health & fee collections</span>
          </div>
        </div>

        <div className="mobile-revenue-stats-grid">
          <div className="mobile-revenue-stat-card card-collected">
            <span>Collected Revenue</span>
            <b className="text-emerald">₹{collectedRevenue.toLocaleString()}</b>
            <small>{collectionRate}% of agreed fees collected</small>
          </div>

          <div className="mobile-revenue-stat-card card-total">
            <span>Total Business Value</span>
            <b className="text-blue">₹{totalBusinessValue.toLocaleString()}</b>
            <small>Agreed fees across admissions</small>
          </div>

          <div className="mobile-revenue-stat-card card-pending">
            <span>Pending Revenue</span>
            <b className="text-amber">₹{pendingRevenue.toLocaleString()}</b>
            <small>Outstanding balances</small>
          </div>
        </div>

        {/* Collection Progress Bar */}
        <div className="mobile-progress-block" style={{ marginTop: 16 }}>
          <div className="progress-label-row">
            <span>Overall Collection Progress</span>
            <b className="text-emerald">{collectionRate}%</b>
          </div>
          <div className="progress-track">
            <div className="progress-fill bg-emerald" style={{ width: `${Math.min(100, collectionRate)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="mobile-chart-card" style={{ marginTop: 16 }}>
        <div className="chart-card-header">
          <CreditCard size={18} className="text-blue" />
          <div>
            <h4>Revenue by Payment Method</h4>
            <span>Collection breakdown</span>
          </div>
        </div>

        <div className="mobile-method-breakdown-list">
          {Object.keys(methodMap).length === 0 ? (
            <p className="text-muted text-xs">No payment transaction records found.</p>
          ) : (
            Object.entries(methodMap).map(([method, amt]) => {
              const pct = collectedRevenue > 0 ? Math.round((amt / collectedRevenue) * 100) : 0;
              return (
                <div key={method} className="mobile-method-row">
                  <div className="method-label-group">
                    <span className="method-name">{method}</span>
                    <b>₹{amt.toLocaleString()}</b>
                  </div>
                  <div className="progress-track sm">
                    <div className="progress-fill bg-blue" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Course Revenue Breakdown */}
      <div className="mobile-chart-card" style={{ marginTop: 16 }}>
        <div className="chart-card-header">
          <PieChart size={18} className="text-purple" />
          <div>
            <h4>Business Value by Course</h4>
            <span>Top revenue generating courses</span>
          </div>
        </div>

        <div className="mobile-course-revenue-list">
          {Object.keys(courseRevenueMap).length === 0 ? (
            <p className="text-muted text-xs">No admissions registered yet.</p>
          ) : (
            Object.entries(courseRevenueMap)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([crs, val]) => {
                const pct = totalBusinessValue > 0 ? Math.round((val / totalBusinessValue) * 100) : 0;
                return (
                  <div key={crs} className="mobile-course-revenue-row">
                    <div className="course-rev-left">
                      <b>{crs}</b>
                      <span>{pct}% of total business</span>
                    </div>
                    <b className="text-emerald">₹{val.toLocaleString()}</b>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="mobile-chart-card" style={{ marginTop: 16, marginBottom: 20 }}>
        <div className="chart-card-header">
          <TrendingUp size={18} className="text-indigo" />
          <div>
            <h4>Lead to Admission Funnel</h4>
            <span>Conversion efficiency</span>
          </div>
        </div>

        <div className="mobile-funnel-stack">
          <div className="mobile-funnel-row">
            <div className="funnel-label-line">
              <span>Overall Conversion Rate</span>
              <b>{conversionRate}%</b>
            </div>
            <div className="funnel-track">
              <div className="funnel-bar" style={{ width: `${Math.min(100, conversionRate)}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
