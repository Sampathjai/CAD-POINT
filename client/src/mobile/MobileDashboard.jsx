import React from 'react';
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
  ChevronRight
} from 'lucide-react';

export function MobileDashboard({
  user,
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
  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Pending follow-ups for today
  const pendingTodayFollowups = followups.filter(f => {
    if (f.status !== 'PENDING') return false;
    const fDate = f.scheduledAt ? new Date(f.scheduledAt).toISOString().slice(0, 10) : '';
    return fDate === todayStr;
  });

  // Calculate metrics
  const totalLeads = leads.length;
  const totalFollowupsToday = pendingTodayFollowups.length;
  const totalAdmissions = admissions.length;
  const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const convertedLeads = leads.filter(l => l.status === 'CONVERTED').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  return (
    <div className="mobile-dashboard">
      {/* Greeting Header Card */}
      <div className="mobile-welcome-card">
        <div className="mobile-welcome-text">
          <span className="mobile-badge-pill">CRM Mobile</span>
          <h2>Good day, {user?.name ? user.name.split(' ')[0] : 'Counselor'} 👋</h2>
          <p>Here is your daily operational summary.</p>
        </div>
        <div className="mobile-welcome-sparkle">
          <Sparkles size={28} />
        </div>
      </div>

      {/* 2x2 Metric KPI Grid */}
      <div className="mobile-kpi-grid">
        <div className="mobile-kpi-card bg-blue-subtle" onClick={() => onNavigate('Leads')}>
          <div className="mobile-kpi-header">
            <span className="mobile-kpi-title">Total Leads</span>
            <div className="mobile-kpi-icon blue">
              <UsersIcon size={16} />
            </div>
          </div>
          <div className="mobile-kpi-value">{totalLeads}</div>
          <span className="mobile-kpi-foot">{convertedLeads} Converted</span>
        </div>

        <div className="mobile-kpi-card bg-purple-subtle" onClick={() => onNavigate('Follow-ups')}>
          <div className="mobile-kpi-header">
            <span className="mobile-kpi-title">Today's Alerts</span>
            <div className="mobile-kpi-icon purple">
              <CalendarDays size={16} />
            </div>
          </div>
          <div className="mobile-kpi-value">{totalFollowupsToday}</div>
          <span className="mobile-kpi-foot">Pending Today</span>
        </div>

        <div className="mobile-kpi-card bg-amber-subtle" onClick={() => onNavigate('Admissions')}>
          <div className="mobile-kpi-header">
            <span className="mobile-kpi-title">Admissions</span>
            <div className="mobile-kpi-icon amber">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="mobile-kpi-value">{totalAdmissions}</div>
          <span className="mobile-kpi-foot">Enrollments</span>
        </div>

        <div className="mobile-kpi-card bg-emerald-subtle" onClick={() => onNavigate('Reports')}>
          <div className="mobile-kpi-header">
            <span className="mobile-kpi-title">Conversion</span>
            <div className="mobile-kpi-icon emerald">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mobile-kpi-value">{conversionRate}%</div>
          <span className="mobile-kpi-foot">Revenue ₹{(totalRevenue / 1000).toFixed(0)}k</span>
        </div>
      </div>

      {/* Quick Action Shortcuts Bar */}
      <div className="mobile-section-header">
        <h3>Quick Actions</h3>
      </div>
      <div className="mobile-quick-actions-row">
        <button className="mobile-action-pill primary" onClick={onAddLead}>
          <Plus size={16} /> + Lead
        </button>
        <button className="mobile-action-pill secondary" onClick={onSchedule}>
          <CalendarDays size={16} /> + Follow-up
        </button>
      </div>

      {/* Today's Follow-ups Section */}
      <div className="mobile-section-header">
        <h3>Today's Pending Follow-ups</h3>
        <button className="mobile-link-btn" onClick={() => onNavigate('Follow-ups')}>
          View All ({followups.length}) <ChevronRight size={14} />
        </button>
      </div>

      {pendingTodayFollowups.length === 0 ? (
        <div className="mobile-empty-card">
          <CheckCircle2 size={32} className="text-emerald" />
          <b>No pending follow-ups for today!</b>
          <p>Great job! You have cleared all scheduled follow-ups for today.</p>
        </div>
      ) : (
        <div className="mobile-card-list">
          {pendingTodayFollowups.slice(0, 5).map(f => {
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

                {/* 1-Tap Actions Row */}
                <div className="mobile-card-actions">
                  {leadPhone && (
                    <a href={`tel:${leadPhone}`} className="mobile-card-btn call">
                      <Phone size={14} /> Call
                    </a>
                  )}
                  {leadPhone && (
                    <button 
                      className="mobile-card-btn whatsapp" 
                      onClick={() => onOpenWhatsApp(f.lead, f)}
                    >
                      <MessageSquare size={14} /> WhatsApp
                    </button>
                  )}
                  <button 
                    className="mobile-card-btn complete" 
                    onClick={() => onCompleteFollowup(f.id)}
                  >
                    <CheckCircle2 size={14} /> Done
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

