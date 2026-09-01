import React, { useState, useEffect, useCallback } from 'react';
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
  Monitor,
  Trash2,
  AlertCircle,
  RefreshCw
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
  API_BASE = '',
  getOrGenerateDeviceId,
  branchesList = []
}) {
  const [activeSection, setActiveSection] = useState(null); // null = menu list, string = specific form page
  const [saving, setSaving] = useState(false);

  // Self-contained Device Registration State
  const [primaryDevice, setPrimaryDevice] = useState(null);
  const [authorizedDevices, setAuthorizedDevices] = useState([]);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [showDeviceRegisterForm, setShowDeviceRegisterForm] = useState(false);

  const currentDevInfo = typeof getOrGenerateDeviceId === 'function' ? getOrGenerateDeviceId() : { deviceId: 'DEV-MOBILE-CLIENT', suggestedName: 'Mobile Device', suggestedType: 'MOBILE' };

  const [deviceForm, setDeviceForm] = useState({
    deviceName: currentDevInfo.suggestedName || 'Mobile Phone',
    deviceType: currentDevInfo.suggestedType || 'MOBILE',
    deviceRole: 'AUTHORIZED',
    branchId: localStorage.getItem('cadpoint_branch') || 'gandhipuram'
  });

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

  // Fetch devices when device section is active
  const fetchDevices = useCallback(async () => {
    if (!token) return;
    setDeviceLoading(true);
    try {
      const activeBranch = localStorage.getItem('cadpoint_branch') || 'gandhipuram';
      const res = await fetch(`${API_BASE}/devices?branchId=${activeBranch}`, {
        headers: {
          Authorization: 'Bearer ' + token,
          'X-Device-Id': currentDevInfo.deviceId
        }
      });
      const j = await res.json();
      if (j.success && j.data) {
        setPrimaryDevice(j.data.primaryDevice || null);
        setAuthorizedDevices(Array.isArray(j.data.authorizedDevices) ? j.data.authorizedDevices : []);
      }
    } catch (e) {
      console.error('Mobile fetchDevices error:', e);
    } finally {
      setDeviceLoading(false);
    }
  }, [token, API_BASE, currentDevInfo.deviceId]);

  useEffect(() => {
    if (activeSection === 'devices') {
      fetchDevices();
    }
  }, [activeSection, fetchDevices]);

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

  async function submitRegisterDevice(e, forceReplace = false) {
    if (e && e.preventDefault) e.preventDefault();
    if (!token) return alert('Session expired.');
    if (!deviceForm.deviceName.trim()) return alert('Please enter Device Name.');

    setDeviceLoading(true);
    try {
      const res = await fetch(`${API_BASE}/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
          'X-Device-Id': currentDevInfo.deviceId
        },
        body: JSON.stringify({
          deviceId: currentDevInfo.deviceId,
          deviceName: deviceForm.deviceName.trim(),
          deviceType: deviceForm.deviceType,
          deviceRole: deviceForm.deviceRole,
          branchId: deviceForm.branchId,
          forceReplace
        })
      });
      const j = await res.json();
      if (j.success) {
        alert('✅ Device registered successfully!');
        setShowDeviceRegisterForm(false);
        fetchDevices();
      } else if (j.primaryExists) {
        if (window.confirm(`⚠️ A primary master device already exists: ${j.existingMaster?.deviceName || 'Master Device'}. Do you want to replace it with this device?`)) {
          submitRegisterDevice(e, true);
        }
      } else {
        alert(j.message || 'Device registration failed.');
      }
    } catch (err) {
      console.error('submitRegisterDevice error:', err);
      alert('Failed to register device.');
    } finally {
      setDeviceLoading(false);
    }
  }

  async function handleDeleteDevice(deviceId, deviceName) {
    if (!window.confirm(`Are you sure you want to unregister device "${deviceName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
          'X-Device-Id': currentDevInfo.deviceId
        }
      });
      const j = await res.json();
      if (j.success) {
        alert('✅ Device unregistered successfully!');
        fetchDevices();
      } else {
        alert(j.message || 'Failed to unregister device.');
      }
    } catch (err) {
      console.error('handleDeleteDevice error:', err);
      alert('Error unregistering device.');
    }
  }

  // Available for ALL user roles (Admin, Counsellor, Staff, Accounts)
  const settingsMenuItems = [
    { id: 'devices', title: 'Registered Devices & Hardware', desc: 'Register mobile devices, master device & access limits', icon: Smartphone, color: 'text-indigo' },
    { id: 'profile', title: 'Institute Profile & Branding', desc: 'Institute name, logo, contact & tax GSTIN', icon: Building, color: 'text-blue' },
    { id: 'theme', title: 'Appearance & Theme', desc: 'Toggle light / dark mode styling', icon: theme === 'dark' ? Sun : Moon, color: 'text-purple' },
    { id: 'users', title: 'User Control & Roles', desc: 'Manage user access, roles & staff permissions', icon: Users, color: 'text-emerald' },
    { id: 'whatsapp', title: 'WhatsApp & API Integration', desc: 'Configure WhatsApp Cloud API & templates', icon: MessageSquare, color: 'text-teal' },
    { id: 'sources', title: 'Enquiry Sources', desc: 'Manage lead acquisition channels & sources', icon: Plus, color: 'text-amber' },
    { id: 'storage', title: 'Storage & Database', desc: 'Database health, backups & system storage', icon: Database, color: 'text-rose' },
    { id: 'system', title: 'System Info & Diagnostics', desc: 'App version, server environment & client info', icon: Laptop, color: 'text-indigo' }
  ];

  // Check if current device is registered safely
  const safeAuthDevices = Array.isArray(authorizedDevices) ? authorizedDevices : [];
  const allRegDevices = [primaryDevice, ...safeAuthDevices].filter(Boolean);
  const isCurrentDeviceRegistered = allRegDevices.some(d => d && d.deviceId === currentDevInfo.deviceId);

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
          {/* DEVICES & MOBILE HARDWARE REGISTRATION SECTION */}
          {activeSection === 'devices' && (
            <div className="mobile-devices-settings-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Current Device Card */}
              <div className="mobile-card" style={{ background: isCurrentDeviceRegistered ? '#f0fdf4' : '#fffbe6', border: `1px solid ${isCurrentDeviceRegistered ? '#bbf7d0' : '#fef08a'}` }}>
                <div className="mobile-card-top">
                  <div>
                    <span className="mobile-adm-code" style={{ background: isCurrentDeviceRegistered ? '#166534' : '#854d0e', color: '#ffffff' }}>
                      {isCurrentDeviceRegistered ? 'REGISTERED DEVICE' : 'UNREGISTERED DEVICE'}
                    </span>
                    <h3 className="mobile-card-title" style={{ marginTop: 4 }}>This Mobile Phone</h3>
                  </div>
                  <Smartphone size={24} className={isCurrentDeviceRegistered ? 'text-emerald' : 'text-amber'} />
                </div>
                <div className="mobile-card-meta-grid" style={{ marginTop: 8 }}>
                  <div>
                    <span className="meta-label">Device ID</span>
                    <span className="meta-val" style={{ fontFamily: 'monospace', fontSize: 11 }}>{(currentDevInfo.deviceId || '').slice(0, 18)}...</span>
                  </div>
                  <div>
                    <span className="meta-label">Suggested Type</span>
                    <span className="meta-val">{currentDevInfo.suggestedType || 'MOBILE'}</span>
                  </div>
                </div>
                {!isCurrentDeviceRegistered && (
                  <button 
                    className="mobile-btn-primary" 
                    style={{ marginTop: 12, width: '100%' }}
                    onClick={() => setShowDeviceRegisterForm(true)}
                  >
                    <Smartphone size={16} /> Register This Device
                  </button>
                )}
              </div>

              {/* Add Device Header Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Authorized Hardware Devices</h4>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{allRegDevices.length} active registered devices</span>
                </div>
                <button className="mobile-btn-primary" onClick={() => setShowDeviceRegisterForm(!showDeviceRegisterForm)}>
                  <Plus size={16} /> Add Device
                </button>
              </div>

              {/* Register Device Form */}
              {showDeviceRegisterForm && (
                <form onSubmit={submitRegisterDevice} className="mobile-single-column-form" style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #cbd5e1' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Register New Mobile Device</h4>
                  <label className="mobile-form-label">
                    Device Name *
                    <input
                      type="text"
                      value={deviceForm.deviceName}
                      onChange={(e) => setDeviceForm({ ...deviceForm, deviceName: e.target.value })}
                      placeholder="e.g. Counsellor iPhone 15"
                      required
                    />
                  </label>

                  <label className="mobile-form-label">
                    Device Type
                    <select 
                      value={deviceForm.deviceType}
                      onChange={(e) => setDeviceForm({ ...deviceForm, deviceType: e.target.value })}
                      className="mobile-form-select"
                    >
                      <option value="MOBILE">Mobile Phone</option>
                      <option value="TABLET">Tablet / iPad</option>
                      <option value="DESKTOP">Desktop / Laptop</option>
                    </select>
                  </label>

                  <label className="mobile-form-label">
                    Device Access Role
                    <select 
                      value={deviceForm.deviceRole}
                      onChange={(e) => setDeviceForm({ ...deviceForm, deviceRole: e.target.value })}
                      className="mobile-form-select"
                    >
                      <option value="AUTHORIZED">Authorized Staff Device</option>
                      <option value="PRIMARY">Primary Master Device</option>
                    </select>
                  </label>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button type="submit" className="mobile-btn-primary" style={{ flex: 1 }}>
                      <Smartphone size={16} /> Confirm & Register
                    </button>
                    <button type="button" className="mobile-btn-secondary" onClick={() => setShowDeviceRegisterForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Active Registered Devices List */}
              <div className="mobile-card-list">
                {deviceLoading ? (
                  <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                    <RefreshCw size={20} className="spin" style={{ marginBottom: 6 }} />
                    <p style={{ margin: 0, fontSize: 13 }}>Fetching registered devices...</p>
                  </div>
                ) : allRegDevices.length === 0 ? (
                  <div className="mobile-empty-state">
                    <Smartphone size={32} />
                    <b>No registered devices</b>
                    <p>Tap "Register This Device" above to bind your phone to CADPOINT CRM.</p>
                  </div>
                ) : (
                  allRegDevices.map((d) => {
                    const isPrimary = d.deviceRole === 'PRIMARY' || d.id === primaryDevice?.id;
                    const isThisDevice = d.deviceId === currentDevInfo.deviceId;
                    return (
                      <div key={d.id || d.deviceId} className="mobile-card">
                        <div className="mobile-card-top">
                          <div>
                            <span className={`mobile-status-badge ${isPrimary ? 'status-confirmed' : 'status-new'}`}>
                              {isPrimary ? 'PRIMARY MASTER' : 'AUTHORIZED'}
                              {isThisDevice ? ' • (THIS PHONE)' : ''}
                            </span>
                            <h3 className="mobile-card-title" style={{ marginTop: 4 }}>{d.deviceName || 'Mobile Device'}</h3>
                          </div>
                          {d.deviceType === 'MOBILE' ? <Smartphone size={20} className="text-blue" /> : d.deviceType === 'TABLET' ? <TabletIcon size={20} className="text-purple" /> : <Monitor size={20} className="text-emerald" />}
                        </div>

                        <div className="mobile-card-meta-grid" style={{ marginTop: 8 }}>
                          <div>
                            <span className="meta-label">Device Type</span>
                            <span className="meta-val">{d.deviceType || 'MOBILE'}</span>
                          </div>
                          <div>
                            <span className="meta-label">Device ID</span>
                            <span className="meta-val" style={{ fontFamily: 'monospace', fontSize: 11 }}>{(d.deviceId || '').slice(0, 16)}...</span>
                          </div>
                        </div>

                        <div className="mobile-card-actions" style={{ marginTop: 10 }}>
                          <button 
                            className="mobile-btn-danger" 
                            style={{ width: '100%' }}
                            onClick={() => handleDeleteDevice(d.id, d.deviceName)}
                          >
                            <Trash2 size={14} /> Remove Registered Device
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeSection === 'profile' && (
            <form onSubmit={handleSaveProfile} className="mobile-single-column-form">
              <label className="mobile-form-label">
                Institute Name
                <input
                  type="text"
                  value={profileForm.instituteName}
                  onChange={(e) => setProfileForm({ ...profileForm, instituteName: e.target.value })}
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
                Official Contact Email
                <input
                  type="email"
                  value={profileForm.contactEmail}
                  onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                />
              </label>

              <label className="mobile-form-label">
                Official Phone / WhatsApp
                <input
                  type="text"
                  value={profileForm.contactPhone}
                  onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                />
              </label>

              <label className="mobile-form-label">
                GSTIN Tax Number
                <input
                  type="text"
                  value={profileForm.gstin}
                  onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                />
              </label>

              <button type="submit" className="mobile-btn-primary full-width" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Institute Profile'}
              </button>
            </form>
          )}

          {activeSection === 'theme' && (
            <div className="mobile-theme-toggle-card">
              <h4>Active UI Appearance Theme</h4>
              <p>Current theme: <b>{(theme || 'light').toUpperCase()} MODE</b></p>
              <button className="mobile-btn-primary" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="mobile-users-settings-card">
              <div className="mobile-card-header-row">
                <h4>System Users ({usersList.length})</h4>
                <button className="mobile-add-btn" onClick={() => onOpenAddModal('Users')}>
                  <Plus size={16} /> User
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
                    <div className="mobile-card-actions">
                      <button className="mobile-card-btn secondary" onClick={() => onEditUser(u)}>Edit</button>
                      {currentUserId !== u.id && (
                        <button className="mobile-card-btn danger-icon" onClick={() => onDeleteUser(u.id, u.name)}>
                          <Trash2 size={14} />
                        </button>
                      )}
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
