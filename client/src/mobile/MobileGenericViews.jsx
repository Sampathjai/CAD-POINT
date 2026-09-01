import React, { useState } from 'react';
import { 
  BookOpen, 
  CalendarDays, 
  GraduationCap, 
  WalletCards, 
  BarChart3, 
  UserCheck, 
  Settings as SettingsIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  UserPlus, 
  Building, 
  Phone, 
  Mail, 
  CheckCircle2,
  DollarSign,
  Download,
  Moon,
  Sun,
  Shield,
  Layers
} from 'lucide-react';

/* --- MOBILE COURSES VIEW --- */
export function MobileCoursesView({ courses = [], onOpenAddModal, onEditCourse, onDeleteCourse }) {
  return (
    <div className="mobile-generic-view">
      <div className="mobile-view-header">
        <div>
          <h2>Courses ({courses.length})</h2>
          <span>Available curriculum & fee structure</span>
        </div>
        <button className="mobile-btn-primary" onClick={() => onOpenAddModal('Courses')}>
          <Plus size={16} /> Add Course
        </button>
      </div>

      <div className="mobile-card-list">
        {courses.map((c) => (
          <div key={c.id} className="mobile-card">
            <div className="mobile-card-top">
              <div>
                <span className="mobile-adm-code">{c.courseCode}</span>
                <h3 className="mobile-card-title">{c.name}</h3>
              </div>
              <span className={`mobile-status-badge ${c.isActive ? 'status-confirmed' : 'status-lost'}`}>
                {c.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            {c.description && <p className="mobile-card-notes">{c.description}</p>}
            <div className="mobile-card-meta-grid">
              <div>
                <span className="meta-label">Standard Fee</span>
                <span className="meta-val">₹{Number(c.standardFee || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="mobile-card-actions">
              <button className="mobile-btn-edit" onClick={() => onEditCourse(c)}>
                <Edit3 size={14} /> Edit
              </button>
              <button className="mobile-btn-danger" onClick={() => onDeleteCourse(c.id, c.name)} title="Delete Course">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- MOBILE BATCHES VIEW --- */
export function MobileBatchesView({ batches = [], onOpenAddModal, onOpenAssignBatchModal, onEditBatch, onDeleteBatch, onOpenEditProgress }) {
  const [expandedBatchId, setExpandedBatchId] = useState(null);

  return (
    <div className="mobile-generic-view">
      <div className="mobile-view-header">
        <div>
          <h2>Batches ({batches.length})</h2>
          <span>Class schedules & progress</span>
        </div>
        <div className="mobile-header-actions-row">
          <button className="mobile-btn-secondary" onClick={onOpenAssignBatchModal}>
            <UserPlus size={15} /> Assign
          </button>
          <button className="mobile-btn-primary" onClick={() => onOpenAddModal('Batches')}>
            <Plus size={16} /> Add Batch
          </button>
        </div>
      </div>

      <div className="mobile-card-list">
        {batches.map((b) => {
          const isExpanded = expandedBatchId === b.id;
          const assignedStudents = b.admissions || [];
          const sylPct = typeof b.syllabusProgress === 'number' ? b.syllabusProgress : 0;

          return (
            <div key={b.id} className="mobile-card">
              <div className="mobile-card-top">
                <div>
                  <span className="mobile-adm-code">{b.batchCode}</span>
                  <h3 className="mobile-card-title">{b.name}</h3>
                </div>
                <span className="mobile-status-badge status-confirmed">{b.progress || 'In Progress'}</span>
              </div>

              <div className="mobile-progress-block">
                <div className="progress-label-row">
                  <span>Batch Syllabus Progress</span>
                  <b>{sylPct}%</b>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, sylPct))}%` }}></div>
                </div>
              </div>

              <div className="mobile-card-meta-grid" style={{ marginTop: 10 }}>
                <div>
                  <span className="meta-label">Course</span>
                  <span className="meta-val">{b.course?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="meta-label">Enrolled Students</span>
                  <span className="meta-val">{assignedStudents.length} / {b.capacity || 25}</span>
                </div>
              </div>

              <div className="mobile-card-actions" style={{ marginTop: 12 }}>
                <button 
                  className="mobile-btn-secondary" 
                  style={{ flex: 1.2, padding: '8px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} 
                  onClick={() => setExpandedBatchId(isExpanded ? null : b.id)}
                >
                  <Users size={14} /> {isExpanded ? 'Hide Students' : `Students (${assignedStudents.length})`}
                </button>
                <button className="mobile-btn-edit" onClick={() => onEditBatch(b)}>
                  <Edit3 size={14} /> Edit
                </button>
                <button className="mobile-btn-danger" onClick={() => onDeleteBatch(b.id, b.name)} title="Delete Batch">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* INDIVIDUAL ENROLLED STUDENTS & COURSE COMPLETION */}
              {isExpanded && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <b style={{ fontSize: 13, color: '#0f172a' }}>Individual Student Progress</b>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{assignedStudents.length} enrolled</span>
                  </div>

                  {assignedStudents.length === 0 ? (
                    <div style={{ padding: 12, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8, fontSize: 12 }}>
                      No students currently assigned to this batch.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {assignedStudents.map((adm) => {
                        const stName = adm.student ? `${adm.student.firstName || ''} ${adm.student.lastName || ''}`.trim() : 'Student';
                        const stCode = adm.student?.studentCode || 'STU';
                        const stPct = typeof adm.completionPct === 'number' ? adm.completionPct : (adm.certificate?.completionPct || 0);
                        const isDone = stPct === 100;
                        const isStarted = stPct > 0;

                        return (
                          <div key={adm.id} style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div>
                                <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 700 }}>#{stCode}</span>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{stName}</div>
                              </div>
                              <span style={{
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: 10,
                                background: isDone ? '#dcfce7' : isStarted ? '#fef3c7' : '#f1f5f9',
                                color: isDone ? '#15803d' : isStarted ? '#b45309' : '#475569'
                              }}>
                                {isDone ? '✓ Completed' : isStarted ? 'In Progress' : 'Not Started'}
                              </span>
                            </div>

                            <div className="mobile-progress-block" style={{ margin: '6px 0 8px' }}>
                              <div className="progress-label-row" style={{ fontSize: 11 }}>
                                <span>Course Completion</span>
                                <b>{stPct}%</b>
                              </div>
                              <div className="progress-track" style={{ height: 6 }}>
                                <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, stPct))}%`, background: isDone ? '#16a34a' : '#2563eb' }}></div>
                              </div>
                            </div>

                            {onOpenEditProgress && (
                              <button 
                                className="mobile-btn-edit"
                                style={{ width: '100%', minHeight: 32, padding: '4px 8px', fontSize: 11, justifyContent: 'center', marginTop: 4 }}
                                onClick={() => onOpenEditProgress(adm)}
                              >
                                <Edit3 size={12} /> Update Progress ({stPct}%)
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --- MOBILE STUDENTS VIEW --- */
export function MobileStudentsView({ students = [], onOpenAddModal, onEditStudent, onDeleteStudent }) {
  return (
    <div className="mobile-generic-view">
      <div className="mobile-view-header">
        <div>
          <h2>Students ({students.length})</h2>
          <span>Student directory records</span>
        </div>
        <button className="mobile-btn-primary" onClick={() => onOpenAddModal('Students')}>
          <Plus size={16} /> Register Student
        </button>
      </div>

      <div className="mobile-card-list">
        {students.map((s) => (
          <div key={s.id} className="mobile-card">
            <div className="mobile-card-top">
              <div>
                <span className="mobile-adm-code">#{s.studentCode}</span>
                <h3 className="mobile-card-title">{s.firstName} {s.lastName || ''}</h3>
              </div>
            </div>

            <div className="mobile-card-meta-grid">
              <div>
                <span className="meta-label">Phone</span>
                <span className="meta-val">{s.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="meta-label">Email</span>
                <span className="meta-val">{s.email || 'N/A'}</span>
              </div>
            </div>

            <div className="mobile-card-actions">
              <button className="mobile-btn-edit" onClick={() => onEditStudent(s)}>
                <Edit3 size={14} /> Edit
              </button>
              <button className="mobile-btn-danger" onClick={() => onDeleteStudent(s.id, s.firstName)} title="Delete Student">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- MOBILE PAYMENTS VIEW --- */
export function MobilePaymentsView({ payments = [], onOpenAddModal, onEditPayment, onDeletePayment }) {
  return (
    <div className="mobile-generic-view">
      <div className="mobile-view-header">
        <div>
          <h2>Payments ({payments.length})</h2>
          <span>Fee receipts & payment logs</span>
        </div>
        <button className="mobile-btn-primary" onClick={() => onOpenAddModal('Payments')}>
          <Plus size={16} /> Record Payment
        </button>
      </div>

      <div className="mobile-card-list">
        {payments.map((p) => (
          <div key={p.id} className="mobile-card">
            <div className="mobile-card-top">
              <div>
                <span className="mobile-adm-code">#{p.receiptNumber}</span>
                <h3 className="mobile-card-title">{p.student ? `${p.student.firstName} ${p.student.lastName || ''}` : 'Unlinked Student'}</h3>
              </div>
              <span className="mobile-status-badge status-confirmed">RECEIVED</span>
            </div>

            <div className="mobile-card-meta-grid">
              <div>
                <span className="meta-label">Amount Paid</span>
                <span className="meta-val text-emerald">₹{Number(p.amount || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="meta-label">Payment Method</span>
                <span className="meta-val">{(p.paymentMethod || 'OTHER').toUpperCase()}</span>
              </div>
            </div>

            <div className="mobile-card-actions">
              <button className="mobile-btn-edit" onClick={() => onEditPayment(p)}>
                <Edit3 size={14} /> Edit
              </button>
              <button className="mobile-btn-danger" onClick={() => onDeletePayment(p.id, p.receiptNumber)} title="Delete Receipt">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- MOBILE USERS VIEW --- */
export function MobileUsersView({ usersList = [], onOpenAddModal, onEditUser, onDeleteUser }) {
  return (
    <div className="mobile-generic-view">
      <div className="mobile-view-header">
        <div>
          <h2>Users ({usersList.length})</h2>
          <span>Staff & access roles</span>
        </div>
        <button className="mobile-btn-primary" onClick={() => onOpenAddModal('Users')}>
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="mobile-card-list">
        {usersList.map((u) => (
          <div key={u.id} className="mobile-card">
            <div className="mobile-card-top">
              <div>
                <span className="mobile-status-badge status-confirmed">{u.role ? u.role.replace('_', ' ') : 'STAFF'}</span>
                <h3 className="mobile-card-title">{u.name}</h3>
              </div>
              <span className={`mobile-status-badge ${u.isActive ? 'status-confirmed' : 'status-lost'}`}>
                {u.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>

            <div className="mobile-card-meta-grid">
              <div>
                <span className="meta-label">Email</span>
                <span className="meta-val">{u.email || 'N/A'}</span>
              </div>
              <div>
                <span className="meta-label">Phone</span>
                <span className="meta-val">{u.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="mobile-card-actions">
              <button className="mobile-btn-edit" onClick={() => onEditUser(u)}>
                <Edit3 size={14} /> Edit
              </button>
              <button className="mobile-btn-danger" onClick={() => onDeleteUser(u.id, u.name)} title="Delete User">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
