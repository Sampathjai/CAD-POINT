import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Phone, 
  MessageSquare, 
  Plus, 
  ChevronRight, 
  User, 
  BookOpen, 
  Calendar, 
  Building, 
  X, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  Tag,
  ArrowUpRight
} from 'lucide-react';
import { MobileBottomSheet } from './MobileBottomSheet';

export function MobileLeadsView({
  leads = [],
  followups = [],
  sourcesList = [],
  usersList = [],
  onOpenAddModal,
  onSchedule,
  onOpenWhatsApp,
  onAdmitFromFollowup,
  onEditLead
}) {
  const [search, setSearch] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [counsellorFilter, setCounsellorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Filtered leads
  const filteredLeads = leads.filter((l) => {
    if (statusFilter && l.status !== statusFilter) return false;
    if (counsellorFilter && l.assignedCounsellorId !== counsellorFilter) return false;
    if (typeFilter && l.leadType !== typeFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const name = `${l.firstName || ''} ${l.lastName || ''}`.toLowerCase();
      const phone = (l.phone || '').toLowerCase();
      const course = (l.interestedCourse || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || course.includes(q);
    }

    return true;
  });

  function resetFilters() {
    setStatusFilter('');
    setCounsellorFilter('');
    setTypeFilter('');
  }

  const activeFilterCount = [statusFilter, counsellorFilter, typeFilter].filter(Boolean).length;

  return (
    <div className="mobile-leads-view">
      {/* Search & Filter Top Bar */}
      <div className="mobile-search-bar-wrap">
        <div className="mobile-search-input-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search leads by name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <button 
          className={`mobile-filter-trigger ${activeFilterCount > 0 ? 'active' : ''}`}
          onClick={() => setShowFilterSheet(true)}
        >
          <Filter size={18} />
          {activeFilterCount > 0 && <span className="filter-dot">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Header Info & Add Button */}
      <div className="mobile-view-header">
        <div>
          <h2>Leads Directory</h2>
          <span>Showing {filteredLeads.length} of {leads.length} records</span>
        </div>
        <button className="mobile-add-btn" onClick={() => onOpenAddModal('Leads')}>
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* Lead Cards List */}
      {filteredLeads.length === 0 ? (
        <div className="mobile-empty-state">
          <User size={36} />
          <b>No leads found</b>
          <p>Try adjusting your search query or filters.</p>
          {activeFilterCount > 0 && (
            <button className="mobile-btn-secondary" onClick={resetFilters}>
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="mobile-card-list">
          {filteredLeads.map((l) => {
            const leadName = `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Unnamed Lead';
            const leadPhone = l.phone || '';
            const statusClass = l.status ? l.status.toLowerCase() : 'new';
            const counsellorName = l.assignedCounsellor?.name || 'Unassigned';

            return (
              <div key={l.id} className="mobile-card lead-card">
                <div className="mobile-card-header-row">
                  <div>
                    <h3 className="mobile-card-name">{leadName}</h3>
                    <div className="mobile-card-subinfo">
                      <BookOpen size={12} /> {l.interestedCourse || 'No Course'}
                    </div>
                  </div>
                  <span className={`mobile-status-badge status-${statusClass}`}>
                    {l.status || 'NEW'}
                  </span>
                </div>

                <div className="mobile-card-meta-grid">
                  <div>
                    <span className="meta-label">Phone</span>
                    <span className="meta-val">{leadPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="meta-label">Counselor</span>
                    <span className="meta-val">{counsellorName}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mobile-card-actions">
                  {leadPhone && (
                    <a href={`tel:${leadPhone}`} className="mobile-card-btn call">
                      <Phone size={14} /> Call
                    </a>
                  )}
                  {leadPhone && (
                    <button 
                      className="mobile-card-btn whatsapp"
                      onClick={() => onOpenWhatsApp(l)}
                    >
                      <MessageSquare size={14} /> WhatsApp
                    </button>
                  )}
                  <button 
                    className="mobile-card-btn details"
                    onClick={() => setSelectedLeadForDetail(l)}
                  >
                    Details <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        title="Filter Leads"
      >
        <div className="mobile-filter-form">
          <label className="mobile-form-label">
            Lead Status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mobile-form-select">
              <option value="">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="FOLLOW_UP">FOLLOW_UP</option>
              <option value="CONVERTED">CONVERTED</option>
              <option value="LOST">LOST</option>
            </select>
          </label>

          <label className="mobile-form-label">
            Assigned Counselor
            <select value={counsellorFilter} onChange={(e) => setCounsellorFilter(e.target.value)} className="mobile-form-select">
              <option value="">All Counselors</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </label>

          <label className="mobile-form-label">
            Lead Type
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="mobile-form-select">
              <option value="">All Types</option>
              <option value="STANDARD">STANDARD</option>
              <option value="HOT">HOT</option>
              <option value="WARM">WARM</option>
              <option value="COLD">COLD</option>
            </select>
          </label>

          <div className="mobile-filter-actions">
            <button className="mobile-btn-secondary" onClick={resetFilters}>
              Reset All
            </button>
            <button className="mobile-btn-primary" onClick={() => setShowFilterSheet(false)}>
              Apply Filters ({activeFilterCount})
            </button>
          </div>
        </div>
      </MobileBottomSheet>

      {/* Lead Details Bottom Sheet */}
      <MobileBottomSheet
        isOpen={!!selectedLeadForDetail}
        onClose={() => setSelectedLeadForDetail(null)}
        title="Lead Details"
        maxHeight="90vh"
      >
        {selectedLeadForDetail && (
          <div className="mobile-lead-detail-sheet">
            <div className="mobile-detail-top-profile">
              <div className="mobile-detail-avatar">
                {selectedLeadForDetail.firstName ? selectedLeadForDetail.firstName[0].toUpperCase() : 'L'}
              </div>
              <div>
                <h2>{selectedLeadForDetail.firstName} {selectedLeadForDetail.lastName}</h2>
                <span className={`mobile-status-badge status-${(selectedLeadForDetail.status || 'new').toLowerCase()}`}>
                  {selectedLeadForDetail.status || 'NEW'}
                </span>
              </div>
            </div>

            {/* Quick Action Banner */}
            <div className="mobile-detail-actions-bar">
              {selectedLeadForDetail.phone && (
                <a href={`tel:${selectedLeadForDetail.phone}`} className="mobile-action-pill call">
                  <Phone size={16} /> Call
                </a>
              )}
              {selectedLeadForDetail.phone && (
                <button className="mobile-action-pill whatsapp" onClick={() => { const l = selectedLeadForDetail; setSelectedLeadForDetail(null); onOpenWhatsApp(l); }}>
                  <MessageSquare size={16} /> WhatsApp
                </button>
              )}
            </div>

            {/* Details Section */}
            <div className="mobile-detail-section">
              <h4>Contact Information</h4>
              <div className="mobile-detail-grid">
                <div>
                  <span>Phone</span>
                  <b>{selectedLeadForDetail.phone || 'N/A'}</b>
                </div>
                <div>
                  <span>Email</span>
                  <b>{selectedLeadForDetail.email || 'N/A'}</b>
                </div>
              </div>
            </div>

            <div className="mobile-detail-section">
              <h4>Lead Information</h4>
              <div className="mobile-detail-grid">
                <div>
                  <span>Interested Course</span>
                  <b>{selectedLeadForDetail.interestedCourse || 'N/A'}</b>
                </div>
                <div>
                  <span>Lead Type</span>
                  <b>{selectedLeadForDetail.leadType || 'STANDARD'}</b>
                </div>
                <div>
                  <span>Estimated Value</span>
                  <b>₹{Number(selectedLeadForDetail.estimatedValue || 0).toLocaleString()}</b>
                </div>
                <div>
                  <span>Assigned Counselor</span>
                  <b>{selectedLeadForDetail.assignedCounsellor?.name || 'Unassigned'}</b>
                </div>
              </div>
            </div>
          </div>
        )}
      </MobileBottomSheet>
    </div>
  );
}

