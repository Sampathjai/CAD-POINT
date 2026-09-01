import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Plus, 
  User, 
  BookOpen, 
  AlertCircle,
  GraduationCap
} from 'lucide-react';

export function MobileFollowupsView({
  followups = [],
  onOpenAddModal,
  onCompleteFollowup,
  onOpenWhatsApp,
  onAdmitFromFollowup
}) {
  const [tab, setTab] = useState('TODAY');
  const todayStr = new Date().toISOString().slice(0, 10);

  const pendingToday = followups.filter((f) => {
    if (f.status !== 'PENDING') return false;
    const fDate = f.scheduledAt ? new Date(f.scheduledAt).toISOString().slice(0, 10) : '';
    return fDate === todayStr;
  });

  const pendingUpcoming = followups.filter((f) => {
    if (f.status !== 'PENDING') return false;
    const fDate = f.scheduledAt ? new Date(f.scheduledAt).toISOString().slice(0, 10) : '';
    return fDate > todayStr || !fDate;
  });

  const completed = followups.filter((f) => f.status === 'COMPLETED');

  let activeList = pendingToday;
  if (tab === 'UPCOMING') activeList = pendingUpcoming;
  if (tab === 'COMPLETED') activeList = completed;

  return (
    <div className="mobile-followups-view">
      {/* Top Header & Compact Schedule Action Button */}
      <div className="mobile-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Follow-ups</h2>
          <span style={{ fontSize: 12, color: '#64748b' }}>Schedule & track lead conversations</span>
        </div>
        <button 
          className="mobile-btn-primary" 
          onClick={() => onOpenAddModal('Follow-ups')}
          style={{ minHeight: 38, padding: '6px 14px', borderRadius: 10, fontSize: 13 }}
        >
          <Plus size={14} /> Schedule
        </button>
      </div>

      {/* Modern iOS/SaaS Segmented Control Tabs */}
      <div className="mobile-segmented-control">
        <button 
          className={`mobile-segment-tab ${tab === 'TODAY' ? 'active' : ''}`}
          onClick={() => setTab('TODAY')}
        >
          Today <span className="mobile-tab-badge">{pendingToday.length}</span>
        </button>
        <button 
          className={`mobile-segment-tab ${tab === 'UPCOMING' ? 'active' : ''}`}
          onClick={() => setTab('UPCOMING')}
        >
          Upcoming <span className="mobile-tab-badge">{pendingUpcoming.length}</span>
        </button>
        <button 
          className={`mobile-segment-tab ${tab === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setTab('COMPLETED')}
        >
          Done <span className="mobile-tab-badge">{completed.length}</span>
        </button>
      </div>

      {/* Followup Cards List */}
      {activeList.length === 0 ? (
        <div className="mobile-empty-state">
          <Calendar size={36} />
          <b>No {tab.toLowerCase()} follow-ups</b>
          <p>You have no scheduled follow-ups under this view.</p>
        </div>
      ) : (
        <div className="mobile-card-list">
          {activeList.map((f) => {
            const leadName = f.lead ? `${f.lead.firstName || ''} ${f.lead.lastName || ''}`.trim() : 'Unassigned Lead';
            const leadPhone = f.lead?.phone || '';
            const courseName = f.lead?.interestedCourse || 'General Enquiry';
            const dateObj = f.scheduledAt ? new Date(f.scheduledAt) : null;
            const timeStr = dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const dateStr = dateObj ? dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';

            return (
              <div key={f.id} className="mobile-card followup-card">
                <div className="mobile-card-top">
                  <div>
                    <h3 className="mobile-card-title">{leadName}</h3>
                    <div className="mobile-card-subinfo">
                      <BookOpen size={13} style={{ flexShrink: 0 }} /> <span>{courseName}</span>
                    </div>
                  </div>
                  <div className="mobile-followup-time-badge">
                    <Clock size={12} />
                    <span>{dateStr} {timeStr}</span>
                  </div>
                </div>

                {f.notes && <p className="mobile-card-notes">"{f.notes}"</p>}

                {f.status === 'COMPLETED' ? (
                  <div className="mobile-completed-tag" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#166534', background: '#f0fdf4', padding: '6px 10px', borderRadius: 8 }}>
                    <CheckCircle2 size={14} /> Completed on {f.completedAt ? new Date(f.completedAt).toLocaleDateString() : 'N/A'}
                  </div>
                ) : (
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
                    {onAdmitFromFollowup && (
                      <button 
                        className="mobile-card-btn admit"
                        onClick={() => onAdmitFromFollowup(f)}
                        title="Admit student from follow-up"
                      >
                        <GraduationCap size={14} /> Admit
                      </button>
                    )}
                    <button 
                      className="mobile-card-btn complete"
                      onClick={() => onCompleteFollowup(f.id)}
                    >
                      <CheckCircle2 size={14} /> Done
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
