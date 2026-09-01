import React, { useState, useMemo } from 'react';
import { 
  Users as UsersIcon, 
  CalendarDays, 
  ArrowUpRight, 
  TrendingUp, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Plus, 
  Clock, 
  Sparkles,
  ChevronRight,
  Filter,
  BarChart3,
  DollarSign,
  User,
  Check,
  Calendar,
  UserCheck,
  Target
} from 'lucide-react';

export function MobileDashboard({
  user,
  token,
  leads = [],
  followups = [],
  admissions = [],
  payments = [],
  onAddLead,
  onSchedule,
  onCompleteFollowup,
  onOpenWhatsApp,
  onNavigate
}) {
  const isCounsellor = user?.role === 'COUNSELLOR';

  const safeLeads = Array.isArray(leads) ? leads : [];
  const safeFollowups = Array.isArray(followups) ? followups : [];
  const safeAdmissions = Array.isArray(admissions) ? admissions : [];
  const safePayments = Array.isArray(payments) ? payments : [];

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);

  // Dynamic month options for last 12 months
  const monthOptions = useMemo(() => {
    const options = [];
    const n = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(n.getFullYear(), n.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      const shortLabel = d.toLocaleString('default', { month: 'short' });
      options.push({ key, label, shortLabel, year: y, monthIndex: d.getMonth() });
    }
    return options;
  }, []);

  const getYM = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  // If user is a Counsellor, filter scope to Counsellor's assigned records
  const targetLeads = useMemo(() => {
    if (!isCounsellor) return safeLeads;
    return safeLeads.filter(l => l.assignedCounsellorId === user?.id || l.assignedCounsellor?.id === user?.id || !l.assignedCounsellorId);
  }, [isCounsellor, safeLeads, user?.id]);

  const targetFollowups = useMemo(() => {
    if (!isCounsellor) return safeFollowups;
    return safeFollowups.filter(f => f.assignedUserId === user?.id || f.lead?.assignedCounsellorId === user?.id || !f.assignedUserId);
  }, [isCounsellor, safeFollowups, user?.id]);

  const targetAdmissions = useMemo(() => {
    if (!isCounsellor) return safeAdmissions;
    return safeAdmissions.filter(a => a.counsellorId === user?.id || a.lead?.assignedCounsellorId === user?.id);
  }, [isCounsellor, safeAdmissions, user?.id]);

  const filteredLeads = targetLeads.filter(l => selectedMonth === 'ALL' || getYM(l.createdAt) === selectedMonth);
  const filteredAdmissions = targetAdmissions.filter(a => selectedMonth === 'ALL' || getYM(a.admissionDate || a.createdAt || a.startDate) === selectedMonth);
  const filteredPayments = safePayments.filter(p => selectedMonth === 'ALL' || getYM(p.paymentDate || p.createdAt) === selectedMonth);

  const monthlyRevenue = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const businessValue = filteredAdmissions.reduce((sum, a) => sum + (Number(a.finalFee || a.agreedFee) || 0), 0);
  const monthlyAgreedFees = businessValue;
  const monthlyOutstanding = Math.max(0, monthlyAgreedFees - monthlyRevenue);
  const monthlyAdmissionsCount = filteredAdmissions.length;
  const monthlyLeadsCount = filteredLeads.length;
  const monthlyConversionRate = monthlyLeadsCount > 0 ? ((monthlyAdmissionsCount / monthlyLeadsCount) * 100).toFixed(0) : '0';

  const newCount = filteredLeads.filter((l) => l.status && (l.status + '').toUpperCase() === 'NEW').length;
  const contactedCount = filteredLeads.filter((l) => l.status && (l.status + '').toUpperCase() === 'CONTACTED').length;
  const interestedCount = filteredLeads.filter((l) => l.status && (l.status + '').toUpperCase() === 'INTERESTED').length;
  const demoCount = filteredLeads.filter((l) => l.status && (l.status + '').toUpperCase().includes('DEMO')).length;
  const convertedCount = filteredLeads.filter((l) => l.status && ((l.status + '').toUpperCase() === 'CONVERTED' || (l.status + '').toUpperCase() === 'ENROLLED')).length;

  // Monthly trends for last 6 months
  const monthlyTrends = useMemo(() => {
    const last6 = monthOptions.slice(0, 6).reverse();
    return last6.map(m => {
      const mLeads = targetLeads.filter(l => getYM(l.createdAt) === m.key).length;
      const mAdmissions = targetAdmissions.filter(a => getYM(a.createdAt || a.startDate) === m.key).length;
      const mPayments = safePayments.filter(p => getYM(p.paymentDate || p.createdAt) === m.key);
      const mRevenue = mPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const mConv = mLeads > 0 ? ((mAdmissions / mLeads) * 100).toFixed(0) : '0';
      return { ...m, leads: mLeads, admissions: mAdmissions, revenue: mRevenue, conversion: mConv };
    });
  }, [monthOptions, targetLeads, targetAdmissions, safePayments]);

  const maxTrendLeads = Math.max(1, ...monthlyTrends.map(t => t.leads));
  const maxTrendRevenue = Math.max(1, ...monthlyTrends.map(t => t.revenue));

  const selectedMonthObj = monthOptions.find(m => m.key === selectedMonth);
  const monthTitleLabel = selectedMonth === 'ALL' ? 'All Months (Year-to-Date)' : (selectedMonthObj ? selectedMonthObj.label : 'Monthly Overview');

  const pendingTodayFollowups = targetFollowups.filter(f => {
    if (f.status !== 'PENDING') return false;
    const fDate = f.scheduledAt ? new Date(f.scheduledAt).toISOString().slice(0, 10) : '';
    return fDate === todayStr;
  });

  return (
    <div className="mobile-dashboard">
      {/* Welcome Greeting Card */}
      <div className="mobile-welcome-card">
        <div className="mobile-welcome-text">
          <span className="mobile-badge-pill">
            {isCounsellor ? 'TELECALLER / COUNSELLOR' : 'CADPOINT CRM'}
          </span>
          <h2>Good day, {user?.name ? user.name.split(' ')[0] : (isCounsellor ? 'Counsellor' : 'Admin')} 👋</h2>
          <p>{isCounsellor ? 'Your active lead pipeline & daily follow-up targets' : `Showing overview for ${monthTitleLabel}`}</p>
        </div>
        <div className="mobile-welcome-sparkle">
          <Sparkles size={26} />
        </div>
      </div>

      {/* Month Filter Selector Bar */}
      <div className="mobile-month-filter-bar">
        <Filter size={14} className="text-emerald" />
        <span className="filter-label">Month Filter:</span>
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="mobile-month-select"
        >
          {monthOptions.map(m => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
          <option value="ALL">All Months (Year-to-Date)</option>
        </select>
      </div>

      {/* Quick Action Row */}
      <div className="mobile-quick-actions-row">
        <button className="mobile-btn-primary" style={{ flex: 1 }} onClick={onAddLead}>
          <Plus size={16} /> Add Lead
        </button>
        <button className="mobile-btn-secondary" style={{ flex: 1 }} onClick={onSchedule}>
          <CalendarDays size={16} /> Schedule
        </button>
      </div>

      {/* Horizontally Scrollable Metric Card Carousel */}
      <div className="mobile-carousel-container">
        <div className="mobile-metric-carousel">
          {/* Card 1 */}
          <div className="mobile-carousel-card blue">
            <div className="card-top">
              <span>{isCounsellor ? 'Assigned Enquiries' : 'Monthly Enquiries'}</span>
              <div className="icon-wrap blue"><UsersIcon size={16} /></div>
            </div>
            <strong className="card-val">{monthlyLeadsCount}</strong>
            <small className="card-sub">{selectedMonth === 'ALL' ? 'Total YTD' : 'This Period'}</small>
            <small className="card-foot">{targetLeads.length} total logged</small>
          </div>

          {/* Card 2 */}
          <div className="mobile-carousel-card amber">
            <div className="card-top">
              <span>Today's Follow-ups</span>
              <div className="icon-wrap amber"><Clock size={16} /></div>
            </div>
            <strong className="card-val">{pendingTodayFollowups.length}</strong>
            <small className="card-sub" style={{ color: pendingTodayFollowups.length > 0 ? '#d97706' : '#10b981' }}>
              {pendingTodayFollowups.length > 0 ? 'Pending calls today' : 'All caught up!'}
            </small>
            <small className="card-foot">{targetFollowups.length} total follow-ups</small>
          </div>

          {/* Card 3 */}
          <div className="mobile-carousel-card purple">
            <div className="card-top">
              <span>Enrolled Admissions</span>
              <div className="icon-wrap purple"><ArrowUpRight size={16} /></div>
            </div>
            <strong className="card-val">{monthlyAdmissionsCount}</strong>
            <small className="card-sub">{monthlyConversionRate}% conv. rate</small>
            <small className="card-foot">{monthlyAdmissionsCount} converted students</small>
          </div>

          {/* Card 4 */}
          <div className="mobile-carousel-card emerald">
            <div className="card-top">
              <span>New Enquiries</span>
              <div className="icon-wrap emerald"><Sparkles size={16} /></div>
            </div>
            <strong className="card-val">{newCount}</strong>
            <small className="card-sub">Fresh leads</small>
            <small className="card-foot">require initial call</small>
          </div>

          {/* ADMIN ONLY FINANCIAL CARDS */}
          {!isCounsellor && (
            <>
              <div className="mobile-carousel-card emerald">
                <div className="card-top">
                  <span>Monthly Revenue</span>
                  <div className="icon-wrap emerald"><TrendingUp size={16} /></div>
                </div>
                <strong className="card-val">₹{monthlyRevenue.toLocaleString()}</strong>
                <small className="card-sub">{filteredPayments.length} receipts</small>
                <small className="card-foot">collections this period</small>
              </div>

              <div className="mobile-carousel-card amber">
                <div className="card-top">
                  <span>Business Value</span>
                  <div className="icon-wrap amber"><DollarSign size={16} /></div>
                </div>
                <strong className="card-val">₹{businessValue.toLocaleString()}</strong>
                <small className="card-sub">New admissions value</small>
                <small className="card-foot">{monthlyAdmissionsCount} admissions</small>
              </div>

              <div className="mobile-carousel-card red">
                <div className="card-top">
                  <span>Fee Pending</span>
                  <div className="icon-wrap red"><Clock size={16} /></div>
                </div>
                <strong className="card-val">₹{monthlyOutstanding.toLocaleString()}</strong>
                <small className="card-sub" style={{ color: monthlyOutstanding > 0 ? '#ef4444' : '#10b981' }}>
                  {monthlyOutstanding > 0 ? 'Pending collection' : 'Fully collected'}
                </small>
                <small className="card-foot">agreed fee balance</small>
              </div>
            </>
          )}
        </div>
        <div className="mobile-carousel-hint">← Swipe to view more metrics →</div>
      </div>

      {/* Mobile Chart Stack */}
      <div className="mobile-chart-stack">
        {/* Enquiry Trend Chart */}
        <div className="mobile-chart-card">
          <div className="chart-card-header">
            <BarChart3 size={18} className="text-emerald" />
            <div>
              <h4>{isCounsellor ? 'Monthly Enquiries & Admissions' : 'Monthly Revenue & Trend'}</h4>
              <span>{isCounsellor ? 'Enquiry performance (Last 6 Months)' : 'Collection trends (Last 6 Months)'}</span>
            </div>
          </div>

          <div className="mobile-bar-chart">
            {monthlyTrends.map((t) => {
              const val = isCounsellor ? t.leads : t.revenue;
              const maxVal = isCounsellor ? maxTrendLeads : maxTrendRevenue;
              const heightPct = maxVal > 0 ? Math.max(16, Math.round((val / maxVal) * 120)) : 16;
              const isSelected = t.key === selectedMonth;
              return (
                <div 
                  key={t.key}
                  className={`mobile-bar-col ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedMonth(t.key)}
                >
                  <span className="bar-val">{isCounsellor ? val : (t.revenue > 0 ? `₹${(t.revenue / 1000).toFixed(0)}k` : '₹0')}</span>
                  <div className="bar-fill" style={{ height: heightPct }}></div>
                  <span className="bar-label">{t.shortLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Conversion Funnel Card */}
        <div className="mobile-chart-card">
          <div className="chart-card-header">
            <TrendingUp size={18} className="text-blue" />
            <div>
              <h4>{isCounsellor ? 'My Lead Pipeline Funnel' : 'Lead Conversion Funnel'}</h4>
              <span>{monthTitleLabel} progress</span>
            </div>
          </div>

          <div className="mobile-funnel-stack">
            {[
              ['Enquiries', monthlyLeadsCount, '100%'],
              ['Contacted', contactedCount, monthlyLeadsCount > 0 ? Math.round((contactedCount / monthlyLeadsCount) * 100) + '%' : '0%'],
              ['Interested', interestedCount, monthlyLeadsCount > 0 ? Math.round((interestedCount / monthlyLeadsCount) * 100) + '%' : '0%'],
              ['Demo Scheduled', demoCount, monthlyLeadsCount > 0 ? Math.round((demoCount / monthlyLeadsCount) * 100) + '%' : '0%'],
              ['Enrolled Admissions', monthlyAdmissionsCount, monthlyConversionRate + '%']
            ].map((item, idx) => (
              <div key={idx} className="mobile-funnel-row">
                <div className="funnel-label-line">
                  <span>{item[0]}</span>
                  <b>{item[1]} ({item[2]})</b>
                </div>
                <div className="funnel-track">
                  <div className="funnel-bar" style={{ width: item[2] }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Follow-ups Section */}
      <div className="mobile-section-header">
        <h3>Today's Follow-ups</h3>
        <button className="mobile-link-btn" onClick={() => onNavigate('Follow-ups')}>
          View Calendar <ChevronRight size={14} />
        </button>
      </div>

      {pendingTodayFollowups.length === 0 ? (
        <div className="mobile-empty-card">
          <CheckCircle2 size={32} className="text-emerald" />
          <b>No pending follow-ups scheduled for today.</b>
          <button className="mobile-link-btn" style={{ marginTop: 8 }} onClick={() => onNavigate('Follow-ups')}>
            View Calendar
          </button>
        </div>
      ) : (
        <div className="mobile-card-list">
          {pendingTodayFollowups.slice(0, 5).map((f) => {
            const leadName = f.lead ? `${f.lead.firstName || ''} ${f.lead.lastName || ''}`.trim() : 'Unassigned Lead';
            const leadPhone = f.lead?.phone || '';
            const courseName = f.lead?.interestedCourse || 'General Enquiry';
            const timeStr = f.scheduledAt ? new Date(f.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today';

            return (
              <div key={f.id} className="mobile-card followup-card">
                <div className="mobile-card-top">
                  <div>
                    <b className="mobile-card-title">{leadName}</b>
                    <span className="mobile-card-subtitle">{courseName}</span>
                  </div>
                  <span className="mobile-time-badge">
                    <Clock size={12} /> {timeStr}
                  </span>
                </div>

                {f.notes && <p className="mobile-card-notes">"{f.notes}"</p>}

                <div className="mobile-card-actions">
                  {leadPhone && (
                    <a href={`tel:${leadPhone}`} className="mobile-card-btn call">
                      <Phone size={14} /> Call
                    </a>
                  )}
                  {leadPhone && (
                    <button className="mobile-card-btn whatsapp" onClick={() => onOpenWhatsApp(f.lead, f)}>
                      <MessageSquare size={14} /> WhatsApp
                    </button>
                  )}
                  <button className="mobile-card-btn complete" onClick={() => onCompleteFollowup(f.id)}>
                    <CheckCircle2 size={14} /> Done
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Leads Section */}
      <div className="mobile-section-header" style={{ marginTop: 20 }}>
        <h3>Recent Enquiries</h3>
        <button className="mobile-link-btn" onClick={() => onNavigate('Leads')}>
          View All <ChevronRight size={14} />
        </button>
      </div>

      {targetLeads.length === 0 ? (
        <div className="mobile-empty-card">
          <User size={32} />
          <p>No leads recorded yet.</p>
        </div>
      ) : (
        <div className="mobile-card-list">
          {targetLeads.slice(0, 5).map((l) => {
            const leadName = `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Unnamed Lead';
            const statusClass = (l.status || 'NEW').toLowerCase();
            const initials = (l.firstName ? l.firstName[0] : 'L') + (l.lastName ? l.lastName[0] : '');

            return (
              <div key={l.id} className="mobile-recent-lead-item" onClick={() => onNavigate('Leads')}>
                <div className="lead-avatar">{initials.toUpperCase()}</div>
                <div className="lead-info">
                  <b>{leadName}</b>
                  <span>{l.phone || 'No Phone'}</span>
                </div>
                <div className="lead-right">
                  <span className={`mobile-status-badge status-${statusClass}`}>
                    {l.status || 'NEW'}
                  </span>
                  <ChevronRight size={16} className="text-muted" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
