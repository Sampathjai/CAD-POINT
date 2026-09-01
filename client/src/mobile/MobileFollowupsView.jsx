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
      {/* Top Header & Schedule Button */}
      <div className="mobile-view-header">
        <div>
          <h2>Follow-ups</h2>
          <span>Schedule & track lead conversations</span>
        </div>
        <button className="mobile-btn-primary" onClick={() => onOpenAddModal('Follow-ups')}>
          <Plus size={16} /> Schedule
        </button>
      </div>

      {/* Segmented Control Tabs Row */}
      <div className="mobile-tabs-row">
        <button 
          className={`mobile-tab-btn ${tab === 'TODAY' ? 'active' : ''}`}
          onClick={() => setTab('TODAY')}
        >
          Today ({pendingToday.length})
        </button>
        <button 
          className={`mobile-tab-btn ${tab === 'UPCOMING' ? 'active' : ''}`}
          onClick={() => setTab('UPCOMING')}
        >
          Upcoming ({pendingUpcoming.length})
        </button>
        <button 
          className={`mobile-tab-btn ${tab === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setTab('COMPLETED')}
        >
          Done ({completed.length})
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
                      <BookOpen size={12} /> {courseName}
                    </div>
                  </div>
                  <div className="mobile-followup-time-badge">
                    <Clock size={12} />
                    <span>{dateStr} {timeStr}</span>
                  </div>
                </div>

                {f.notes && <p className="mobile-card-notes">"{f.notes}"</p>}

                {f.status === 'COMPLETED' ? (
                  <div className="mobile-completed-tag">
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
