import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  Search, 
  Plus, 
  User, 
  BookOpen, 
  Calendar, 
  Award, 
  Percent, 
  Edit3, 
  Trash2,
  CheckCircle2
} from 'lucide-react';

export function MobileAdmissionsView({
  admissions = [],
  onOpenAddModal,
  onOpenEditProgress,
  onDeleteAdmission
}) {
  const [search, setSearch] = useState('');

  const filteredAdmissions = admissions.filter((adm) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const admNum = (adm.admissionNumber || '').toLowerCase();
    const stName = (adm.student ? `${adm.student.firstName || ''} ${adm.student.lastName || ''}` : '').toLowerCase();
    const crsName = (adm.course?.name || '').toLowerCase();
    return admNum.includes(q) || stName.includes(q) || crsName.includes(q);
  });

  return (
    <div className="mobile-admissions-view">
      {/* Search Bar */}
      <div className="mobile-search-bar-wrap">
        <div className="mobile-search-input-box full">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search admission #, student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Header Info */}
      <div className="mobile-view-header">
        <div>
          <h2>Admissions</h2>
          <span>Total {filteredAdmissions.length} enrolled students</span>
        </div>
        <button className="mobile-add-btn" onClick={() => onOpenAddModal('Admissions')}>
          <Plus size={16} /> Admission
        </button>
      </div>

      {/* Admissions Card List */}
      {filteredAdmissions.length === 0 ? (
        <div className="mobile-empty-state">
          <ArrowUpRight size={36} />
          <b>No admissions found</b>
          <p>No admission records match your search query.</p>
        </div>
      ) : (
        <div className="mobile-card-list">
          {filteredAdmissions.map((adm) => {
            const stName = adm.student ? `${adm.student.firstName || ''} ${adm.student.lastName || ''}`.trim() : 'Unlinked Student';
            const courseName = adm.course?.name || 'General Course';
            const batchName = adm.batch?.name || 'No Batch';
            const agreedFee = Number(adm.agreedFee || adm.finalFee || 0);
            const certStatus = adm.certificate?.status || 'NOT_STARTED';
            const completionPct = Number(adm.certificate?.completionPct || 0);

            return (
              <div key={adm.id} className="mobile-card admission-card">
                <div className="mobile-card-top">
                  <div>
                    <span className="mobile-adm-code">#{adm.admissionNumber}</span>
                    <h3 className="mobile-card-title">{stName}</h3>
                  </div>
                  <span className="mobile-status-badge status-confirmed">
                    {adm.status || 'CONFIRMED'}
                  </span>
                </div>

                <div className="mobile-card-detail-lines">
                  <div className="detail-line">
                    <BookOpen size={13} />
                    <span><b>Course:</b> {courseName}</span>
                  </div>
                  <div className="detail-line">
                    <Calendar size={13} />
                    <span><b>Batch:</b> {batchName}</span>
                  </div>
                </div>

                {/* Progress Bar & Certificate */}
                <div className="mobile-progress-block">
                  <div className="progress-label-row">
                    <span>Syllabus Progress</span>
                    <b>{completionPct}%</b>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, completionPct))}%` }}></div>
                  </div>
                </div>

                <div className="mobile-card-meta-grid" style={{ marginTop: 10 }}>
                  <div>
                    <span className="meta-label">Course Fee</span>
                    <span className="meta-val">₹{agreedFee.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="meta-label">Certificate Status</span>
                    <span className={`meta-val cert-${certStatus.toLowerCase()}`}>
                      {certStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mobile-card-actions">
                  <button 
                    className="mobile-card-btn secondary"
                    onClick={() => onOpenEditProgress(adm)}
                  >
                    <Edit3 size={14} /> Update Progress
                  </button>
                  <button 
                    className="mobile-card-btn danger-icon"
                    onClick={() => onDeleteAdmission(adm.id, adm.admissionNumber)}
                    title="Delete Admission"
                  >
                    <Trash2 size={14} />
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
