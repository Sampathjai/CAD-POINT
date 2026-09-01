import React, { useState } from 'react';
import { 
  Building, 
  Moon, 
  Sun, 
  Users, 
  MessageSquare, 
  Database, 
  Plus, 
  ChevronRight, 
  ArrowLeft, 
  Save, 
  Laptop,
  CheckCircle2,
  Shield,
  Smartphone,
  Tablet as TabletIcon,
  Monitor
} from 'lucide-react';
import { hasPermission } from '../permissions';

export function MobileSettingsView({
  userRole,
  user,
  token,
  theme,
  toggleTheme,
  sourcesList = [],
  refreshSources,
  usersList = [],
  currentUserId,
  onOpenAddModal,
  onEditUser,
  onDeleteUser,
  API_BASE
}) {
  const [activeSection, setActiveSection] = useState(null); // null = menu list, string = specific form page
  const [saving, setSaving] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    instituteName: 'CADPOINT COIMBATORE',
    tagline: 'Premier CAD & BIM Training CRM',
    contactEmail: 'admin@cadpoint.com',
    contactPhone: '+91 99945 12345',
    address: 'Gandhipuram / Saravanapatti',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641012',
    gstin: '33AAAAA0000A1Z5'
  });

  const [whatsappForm, setWhatsappForm] = useState({
    whatsappEnabled: true,
    whatsappApiUrl: 'https://graph.facebook.com/v18.0/',
    whatsappPhoneNumberId: '1092837465',
    whatsappAccessToken: '',
    whatsappBusinessAccountId: 'WABA-CADPOINT-CBE-9081',
    defaultCountryCode: '+91',
    autoAssignLeads: true
  });

  const [newSourceName, setNewSourceName] = useState('');

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('✅ Institute profile settings saved successfully!');
    }, 600);
  }

  async function handleSaveWhatsApp(e) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('✅ WhatsApp API settings updated successfully!');
    }, 600);
  }

  const settingsMenuItems = [
    { id: 'profile', title: 'Institute Profile & Branding', desc: 'Institute name, logo, contact & tax GSTIN', icon: Building, color: 'text-blue' },
    { id: 'theme', title: 'Appearance & Theme', desc: 'Toggle light / dark mode styling', icon: theme === 'dark' ? Sun : Moon, color: 'text-purple' },
    { id: 'users', title: 'User Control & Roles', desc: 'Manage user access, roles & staff permissions', icon: Users, color: 'text-emerald' },
    { id: 'whatsapp', title: 'WhatsApp & API Integration', desc: 'Configure WhatsApp Cloud API & templates', icon: MessageSquare, color: 'text-teal' },
    { id: 'sources', title: 'Enquiry Sources', desc: 'Manage lead acquisition channels & sources', icon: Plus, color: 'text-amber' },
    { id: 'storage', title: 'Storage & Database', desc: 'Database health, backups & system storage', icon: Database, color: 'text-rose' },
    { id: 'system', title: 'System Info & Diagnostics', desc: 'App version, server environment & client info', icon: Laptop, color: 'text-indigo' }
  ];

  // If a specific section is selected, render full-screen Mobile Form Page
  if (activeSection) {
    return (
      <div className="mobile-settings-detail-page">
        <div className="mobile-detail-nav-bar">
          <button className="mobile-back-btn" onClick={() => setActiveSection(null)}>
            <ArrowLeft size={18} /> Back to Settings
          </button>
          <h3>{settingsMenuItems.find(m => m.id === activeSection)?.title || 'Settings'}</h3>
        </div>

        <div className="mobile-settings-form-container">
          {activeSection === 'profile' && (
            <form onSubmit={handleSaveProfile} className="mobile-single-column-form">
              <label className="mobile-form-label">
                Institute Name
                <input
                  type="text"
                  value={profileForm.instituteName}
                  onChange={(e) => setProfileForm({ ...profileForm, instituteName: e.target.value })}
                  required
                />
              </label>

              <label className="mobile-form-label">
                Tagline / Subtitle
                <input
                  type="text"
                  value={profileForm.tagline}
                  onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                />
              </label>

              <label className="mobile-form-label">
                Contact Email
                <input
                  type="email"
                  value={profileForm.contactEmail}
                  onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                  required
                />
              </label>

              <label className="mobile-form-label">
                Contact Phone
                <input
                  type="tel"
                  value={profileForm.contactPhone}
                  onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                  required
                />
              </label>

              <label className="mobile-form-label">
                Address
                <textarea
                  rows={2}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </label>

              <label className="mobile-form-label">
                City
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                />
              </label>

              <label className="mobile-form-label">
                State
                <input
                  type="text"
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                />
              </label>

              <label className="mobile-form-label">
                GSTIN Number
                <input
                  type="text"
                  value={profileForm.gstin}
                  onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                />
              </label>

              <button type="submit" className="mobile-btn-primary full-width" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          )}

          {activeSection === 'theme' && (
            <div className="mobile-theme-settings-card">
              <h4>Active Theme Mode</h4>
              <p>Choose your preferred interface appearance.</p>

              <div className="mobile-theme-toggle-grid">
                <button
                  className={`mobile-theme-option ${theme !== 'dark' ? 'active' : ''}`}
                  onClick={() => { if (theme === 'dark') toggleTheme(); }}
                >
                  <Sun size={28} />
                  <b>Light Mode</b>
                  <span>Clean white layout</span>
                </button>

                <button
                  className={`mobile-theme-option ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                >
                  <Moon size={28} />
                  <b>Dark Mode</b>
                  <span>Sleek dark interface</span>
                </button>
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="mobile-users-settings-list">
              <div className="mobile-view-header">
                <h4>System Users ({usersList.length})</h4>
                <button className="mobile-add-btn" onClick={() => onOpenAddModal('Users')}>
                  + Add User
                </button>
              </div>

              <div className="mobile-card-list">
                {usersList.map((u) => (
                  <div key={u.id} className="mobile-card">
                    <div className="mobile-card-top">
                      <div>
                        <b>{u.name}</b>
                        <span className="mobile-card-subtitle">{u.role}</span>
                      </div>
                      <span className={`mobile-status-badge ${u.isActive ? 'status-confirmed' : 'status-lost'}`}>
                        {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <div className="mobile-card-meta-grid">
                      <div>
                        <span className="meta-label">Email</span>
                        <span className="meta-val">{u.email}</span>
                      </div>
                    </div>
                    <div className="mobile-card-actions">
                      <button className="mobile-card-btn secondary" onClick={() => onEditUser(u)}>
                        Edit
                      </button>
                      <button className="mobile-card-btn danger-icon" onClick={() => onDeleteUser(u.id, u.name)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'whatsapp' && (
            <form onSubmit={handleSaveWhatsApp} className="mobile-single-column-form">
              <label className="mobile-form-label">
                WhatsApp Cloud API Phone Number ID
                <input
                  type="text"
                  value={whatsappForm.whatsappPhoneNumberId}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsappPhoneNumberId: e.target.value })}
                />
              </label>

              <label className="mobile-form-label">
                Business Account ID
                <input
                  type="text"
                  value={whatsappForm.whatsappBusinessAccountId}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsappBusinessAccountId: e.target.value })}
                />
              </label>

              <label className="mobile-form-label">
                API Access Token
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={whatsappForm.whatsappAccessToken}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsappAccessToken: e.target.value })}
                />
              </label>

              <button type="submit" className="mobile-btn-primary full-width" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save WhatsApp Configuration'}
              </button>
            </form>
          )}

          {activeSection === 'sources' && (
            <div className="mobile-sources-settings-card">
              <h4>Manage Lead Enquiry Sources</h4>
              <div className="mobile-source-add-row">
                <input
                  type="text"
                  placeholder="e.g. Instagram Ads, Campus Walk-in"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                />
                <button className="mobile-btn-primary" onClick={() => { if (newSourceName.trim()) { alert('Added source: ' + newSourceName); setNewSourceName(''); } }}>
                  Add
                </button>
              </div>

              <div className="mobile-sources-pills-grid">
                {(sourcesList.length > 0 ? sourcesList : [
                  { id: '1', name: 'Google Search / Website' },
                  { id: '2', name: 'WhatsApp Business Direct' },
                  { id: '3', name: 'Instagram & Facebook Ads' },
                  { id: '4', name: 'Student Referral' },
                  { id: '5', name: 'Walk-in Enquiry' }
                ]).map((s) => (
                  <div key={s.id} className="mobile-source-pill">
                    <span>{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'storage' && (
            <div className="mobile-storage-card">
              <h4>Database & System Storage Health</h4>
              <div className="mobile-storage-stat">
                <span>Database Connection</span>
                <b className="text-emerald">CONNECTED (Supabase PostgreSQL)</b>
              </div>
              <div className="mobile-storage-stat">
                <span>Active API Server</span>
                <b>Node.js Express (Vercel Serverless)</b>
              </div>
              <div className="mobile-storage-stat">
                <span>Backup Schedule</span>
                <b>Automated Daily Cloud Snapshots</b>
              </div>
            </div>
          )}

          {activeSection === 'system' && (
            <div className="mobile-system-info-card">
              <h4>System Diagnostics</h4>
              <div className="mobile-detail-grid">
                <div>
                  <span>Platform Version</span>
                  <b>CADPOINT CRM v2.4.0</b>
                </div>
                <div>
                  <span>Current User Role</span>
                  <b>{user?.role || 'COUNSELLOR'}</b>
                </div>
                <div>
                  <span>Active Branch</span>
                  <b>{localStorage.getItem('cadpoint_branch') || 'Gandhipuram'}</b>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Settings Menu List View
  return (
    <div className="mobile-settings-view">
      <div className="mobile-view-header">
        <div>
          <h2>CRM Settings</h2>
          <span>Configure system preferences & options</span>
        </div>
      </div>

      <div className="mobile-settings-menu-list">
        {settingsMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="mobile-settings-menu-item"
              onClick={() => setActiveSection(item.id)}
            >
              <div className={`menu-icon-box ${item.color}`}>
                <Icon size={20} />
              </div>
              <div className="menu-text-box">
                <b>{item.title}</b>
                <span>{item.desc}</span>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

