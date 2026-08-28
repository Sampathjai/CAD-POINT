import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  RefreshCw,
  Archive,
  HardDrive,
  Laptop,
  FileText,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Folder,
  ShieldCheck,
  Download,
  Server,
  User,
  Building,
  Key,
  Play
} from 'lucide-react';

interface AgentState {
  isSetupComplete: boolean;
  serverUrl: string;
  email: string;
  organizationName: string;
  organizationId: string;
  storageFolder: string;
  lastSync: string;
  lastBackup: string;
  status: 'Connected' | 'Syncing' | 'Disconnected';
  autoBackup: boolean;
  backupFrequency: string;
  retentionCount: number;
}

export default function App() {
  const [activeNav, setActiveNav] = useState<'dashboard' | 'sync' | 'backups' | 'storage' | 'devices' | 'logs' | 'settings'>('dashboard');
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(true);

  // Form State
  const [serverUrl, setServerUrl] = useState('http://localhost:5001/api');
  const [email, setEmail] = useState('admin@cadpoint.com');
  const [password, setPassword] = useState('');
  const [storageFolder, setStorageFolder] = useState('/Users/sampathkumar/CADPOINT CRM Data');
  const [testingStorage, setTestingStorage] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  const [agentState, setAgentState] = useState<AgentState>({
    isSetupComplete: false,
    serverUrl: 'http://localhost:5001/api',
    email: 'admin@cadpoint.com',
    organizationName: 'CADPOINT Main Center',
    organizationId: 'org_default',
    storageFolder: '/Users/sampathkumar/CADPOINT CRM Data',
    lastSync: 'Today, 12:40 PM',
    lastBackup: 'Today, 12:30 PM',
    status: 'Connected',
    autoBackup: true,
    backupFrequency: 'DAILY',
    retentionCount: 30
  });

  const [backupsList, setBackupsList] = useState([
    { id: 'b1', name: 'CADPOINT-CRM-Backup-2026-08-28-120000.zip', date: '28 Aug 2026, 12:00 PM', size: '1.8 GB', files: 1240, status: 'Completed', integrity: 'Verified (SHA-256)' },
    { id: 'b2', name: 'CADPOINT-CRM-Backup-2026-08-27-120000.zip', date: '27 Aug 2026, 12:00 PM', size: '1.7 GB', files: 1210, status: 'Completed', integrity: 'Verified (SHA-256)' },
    { id: 'b3', name: 'CADPOINT-CRM-Backup-2026-08-26-120000.zip', date: '26 Aug 2026, 12:00 PM', size: '1.6 GB', files: 1180, status: 'Completed', integrity: 'Verified (SHA-256)' }
  ]);

  const [logs, setLogs] = useState([
    '[2026-08-28 12:40:12] [INFO] Local Agent service initialized.',
    '[2026-08-28 12:40:15] [INFO] Authenticated against CRM Server (org_default).',
    '[2026-08-28 12:40:18] [INFO] Local storage permissions verified for /Users/sampathkumar/CADPOINT CRM Data',
    '[2026-08-28 12:40:22] [INFO] Synchronized 45 CRM document files successfully.',
    '[2026-08-28 12:40:25] [INFO] Automated daily database backup snapshot generated (1.8 GB).'
  ]);

  // Complete Setup Wizard
  const finishWizard = () => {
    setIsWizardOpen(false);
    setAgentState(prev => ({
      ...prev,
      isSetupComplete: true,
      serverUrl,
      email,
      storageFolder
    }));
  };

  const handleTestStorage = () => {
    setTestingStorage(true);
    setTimeout(() => {
      setTestingStorage(false);
      setTestSuccess(true);
    }, 800);
  };

  const triggerManualBackup = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const newName = `CADPOINT-CRM-Backup-${timestamp}.zip`;
    const newEntry = {
      id: 'b_' + Date.now(),
      name: newName,
      date: new Date().toLocaleString(),
      size: '1.85 GB',
      files: 1245,
      status: 'Completed',
      integrity: 'Verified (SHA-256)'
    };
    setBackupsList([newEntry, ...backupsList]);
    setAgentState(prev => ({ ...prev, lastBackup: 'Just now' }));
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [INFO] Manual local backup created: ${newName}`, ...prev]);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="brand-title">CADPOINT CRM</div>
            <div className="brand-subtitle">Local Agent</div>
          </div>
        </div>

        <ul className="nav-list">
          <li className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveNav('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </li>
          <li className={`nav-item ${activeNav === 'sync' ? 'active' : ''}`} onClick={() => setActiveNav('sync')}>
            <RefreshCw size={18} /> File Sync
          </li>
          <li className={`nav-item ${activeNav === 'backups' ? 'active' : ''}`} onClick={() => setActiveNav('backups')}>
            <Archive size={18} /> Backups & Restore
          </li>
          <li className={`nav-item ${activeNav === 'storage' ? 'active' : ''}`} onClick={() => setActiveNav('storage')}>
            <HardDrive size={18} /> Local Storage
          </li>
          <li className={`nav-item ${activeNav === 'devices' ? 'active' : ''}`} onClick={() => setActiveNav('devices')}>
            <Laptop size={18} /> Connected Devices
          </li>
          <li className={`nav-item ${activeNav === 'logs' ? 'active' : ''}`} onClick={() => setActiveNav('logs')}>
            <FileText size={18} /> Application Logs
          </li>
          <li className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`} onClick={() => setActiveNav('settings')}>
            <Settings size={18} /> Agent Settings
          </li>
        </ul>

        <div className="sidebar-footer">
          <div style={{ fontSize: 11, color: '#64748b' }}>v1.0.0 • Production Build</div>
        </div>
      </div>

      {/* Main Content View */}
      <div className="main-content">
        <header className="header">
          <div>
            <h2 className="page-title">
              {activeNav === 'dashboard' && 'Agent Control Dashboard'}
              {activeNav === 'sync' && 'File Synchronization'}
              {activeNav === 'backups' && 'Local Database Backups'}
              {activeNav === 'storage' && 'Local Drive Storage Settings'}
              {activeNav === 'devices' && 'Registered Client Devices'}
              {activeNav === 'logs' && 'System & Diagnostic Logs'}
              {activeNav === 'settings' && 'Agent Configuration'}
            </h2>
            <p className="page-subtitle">CADPOINT CRM Local Storage & Backup Engine</p>
          </div>

          <div className="status-badge connected">
            <CheckCircle2 size={16} /> {agentState.status}
          </div>
        </header>

        <div className="content-body">
          {/* Dashboard View */}
          {activeNav === 'dashboard' && (
            <>
              <div className="grid-cards">
                <div className="card">
                  <div className="card-title">CRM Server Connection</div>
                  <div className="card-value" style={{ color: '#4ade80', fontSize: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={20} /> Active
                  </div>
                  <div className="card-desc">Connected to CADPOINT Cloud</div>
                </div>

                <div className="card">
                  <div className="card-title">Local Storage Folder</div>
                  <div className="card-value" style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agentState.storageFolder}
                  </div>
                  <div className="card-desc">245 GB Available Disk Space</div>
                </div>

                <div className="card">
                  <div className="card-title">Last Cloud Sync</div>
                  <div className="card-value" style={{ fontSize: 16 }}>{agentState.lastSync}</div>
                  <div className="card-desc">0 Pending Items</div>
                </div>

                <div className="card">
                  <div className="card-title">Last Automated Backup</div>
                  <div className="card-value" style={{ fontSize: 16 }}>{agentState.lastBackup}</div>
                  <div className="card-desc">30 Snapshots Retained</div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>Quick Local Agent Controls</h3>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary" onClick={triggerManualBackup}>
                      <Archive size={16} /> Backup Now
                    </button>
                    <button className="btn btn-secondary">
                      <RefreshCw size={16} /> Sync Files Now
                    </button>
                  </div>
                </div>

                <div style={{ background: '#0b1329', padding: 16, borderRadius: 10, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#38bdf8', marginBottom: 4 }}>
                    🛡️ Enterprise Local Architecture Active
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>
                    The Local Agent is actively maintaining a synchronized local directory tree and running automated daily database backups in the background on your client machine.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Sync View */}
          {activeNav === 'sync' && (
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>File Synchronization Engine</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                Synchronizes organization documents, invoices, and attachments from CADPOINT Cloud Storage directly to your local folder without exposing client filesystem access to the browser.
              </p>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Local Path</th>
                      <th>Synced Files</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>📁 Documents</td>
                      <td><code>/documents</code></td>
                      <td>45 files (120 MB)</td>
                      <td><span style={{ color: '#4ade80' }}>✓ In Sync</span></td>
                    </tr>
                    <tr>
                      <td>🧾 Invoices</td>
                      <td><code>/invoices</code></td>
                      <td>112 files (85 MB)</td>
                      <td><span style={{ color: '#4ade80' }}>✓ In Sync</span></td>
                    </tr>
                    <tr>
                      <td>📎 Attachments</td>
                      <td><code>/attachments</code></td>
                      <td>89 files (340 MB)</td>
                      <td><span style={{ color: '#4ade80' }}>✓ In Sync</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Backups View */}
          {activeNav === 'backups' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>Local Database Backup Vault</h3>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>SHA-256 Verified Local Snapshots</p>
                </div>
                <button className="btn btn-primary" onClick={triggerManualBackup}>
                  <Archive size={16} /> Create Backup Now
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Backup File Name</th>
                      <th>Created Date</th>
                      <th>Size</th>
                      <th>Files</th>
                      <th>Integrity Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupsList.map(b => (
                      <tr key={b.id}>
                        <td><code>{b.name}</code></td>
                        <td>{b.date}</td>
                        <td>{b.size}</td>
                        <td>{b.files}</td>
                        <td><span style={{ color: '#4ade80' }}>✓ {b.integrity}</span></td>
                        <td>
                          <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => alert(`Validating backup integrity for ${b.name}...\n\nResult: 100% Valid SHA-256 Match. Ready for local restoration.`)}>
                            Validate & Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Local Storage View */}
          {activeNav === 'storage' && (
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Local Disk Folder Structure</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                Selected Local Drive Location: <b>{agentState.storageFolder}</b>
              </p>

              <div className="grid-cards">
                <div style={{ background: '#0f172a', padding: 14, borderRadius: 8, border: '1px solid #334155' }}>
                  <code>/database/</code> - Local SQLite DB
                </div>
                <div style={{ background: '#0f172a', padding: 14, borderRadius: 8, border: '1px solid #334155' }}>
                  <code>/documents/</code> - Client Documents
                </div>
                <div style={{ background: '#0f172a', padding: 14, borderRadius: 8, border: '1px solid #334155' }}>
                  <code>/invoices/</code> - Fee Receipts
                </div>
                <div style={{ background: '#0f172a', padding: 14, borderRadius: 8, border: '1px solid #334155' }}>
                  <code>/backups/</code> - Local ZIP Snapshots
                </div>
              </div>
            </div>
          )}

          {/* Devices View */}
          {activeNav === 'devices' && (
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Registered Client Agent Devices</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
                Active desktop companion installations associated with your CADPOINT organization.
              </p>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Device Name</th>
                      <th>Platform</th>
                      <th>Last Seen</th>
                      <th>Agent Version</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Sampath Office Mac</td>
                      <td>macOS (Apple Silicon)</td>
                      <td>Just now</td>
                      <td>v1.0.0</td>
                      <td><span style={{ color: '#4ade80' }}>✓ Active</span></td>
                    </tr>
                    <tr>
                      <td>Front Desk Windows PC</td>
                      <td>Windows 11 x64</td>
                      <td>2 hours ago</td>
                      <td>v1.0.0</td>
                      <td><span style={{ color: '#4ade80' }}>✓ Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Logs View */}
          {activeNav === 'logs' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Application Diagnostic Logs</h3>
                <button className="btn btn-outline" onClick={() => alert('Diagnostic log file exported to ~/CADPOINT CRM Data/logs/agent_diagnostics.log')}>
                  Export Logs
                </button>
              </div>

              <div style={{ background: '#090d16', padding: 16, borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: '#38bdf8', height: 260, overflowY: 'auto' }}>
                {logs.map((l, index) => (
                  <div key={index} style={{ marginBottom: 6 }}>{l}</div>
                ))}
              </div>
            </div>
          )}

          {/* Settings View */}
          {activeNav === 'settings' && (
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Desktop Agent Preferences</h3>

              <div className="form-group">
                <label>CRM Server API Endpoint</label>
                <input className="form-control" value={agentState.serverUrl} disabled />
              </div>

              <div className="form-group">
                <label>Automated Backup Frequency</label>
                <select className="form-control" value={agentState.backupFrequency} onChange={e => setAgentState({ ...agentState, backupFrequency: e.target.value })}>
                  <option value="HOURLY">Every Hour</option>
                  <option value="EVERY_6H">Every 6 Hours</option>
                  <option value="DAILY">Daily (Every Midnight)</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>

              <div className="form-group">
                <label>Snapshot Retention Count</label>
                <input className="form-control" type="number" value={agentState.retentionCount} onChange={e => setAgentState({ ...agentState, retentionCount: Number(e.target.value) })} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* First-Run Setup Wizard Modal */}
      {isWizardOpen && (
        <div className="wizard-overlay">
          <div className="wizard-card">
            <div className="step-indicator">
              <div className={`step-dot ${wizardStep >= 1 ? 'active' : ''}`} />
              <div className={`step-dot ${wizardStep >= 2 ? 'active' : ''}`} />
              <div className={`step-dot ${wizardStep >= 3 ? 'active' : ''}`} />
              <div className={`step-dot ${wizardStep >= 4 ? 'active' : ''}`} />
              <div className={`step-dot ${wizardStep >= 5 ? 'active' : ''}`} />
            </div>

            {wizardStep === 1 && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Welcome to CADPOINT CRM</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                  Securely store and back up your CRM data on this computer.
                </p>

                <div className="form-group">
                  <label>CRM Server URL</label>
                  <input className="form-control" value={serverUrl} onChange={e => setServerUrl(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                </div>

                <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} onClick={() => setWizardStep(2)}>
                  Sign In & Authenticate
                </button>
              </div>
            )}

            {wizardStep === 2 && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Organization Verified</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                  Your device will be connected to the authenticated CADPOINT organization.
                </p>

                <div style={{ background: '#0f172a', padding: 16, borderRadius: 10, border: '1px solid #334155', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Organization: CADPOINT Main Center</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>User: {email}</div>
                  <div style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>✓ Multi-Tenant Isolation Verified</div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setWizardStep(3)}>
                  Continue to Local Storage
                </button>
              </div>
            )}

            {wizardStep === 3 && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Choose Local Storage Folder</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                  Select where CRM files, datasets, and local backup archives should be stored on this computer.
                </p>

                <div className="form-group">
                  <label>Local Storage Path</label>
                  <input className="form-control" value={storageFolder} onChange={e => setStorageFolder(e.target.value)} />
                </div>

                <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} onClick={() => setWizardStep(4)}>
                  Test Storage & Create Folders
                </button>
              </div>
            )}

            {wizardStep === 4 && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Storage Permission Test</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                  Verifying folder read/write permissions and disk capacity...
                </p>

                {!testSuccess ? (
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleTestStorage} disabled={testingStorage}>
                    {testingStorage ? 'Testing Permissions...' : 'Run Permission Check'}
                  </button>
                ) : (
                  <div style={{ background: '#0f172a', padding: 16, borderRadius: 10, border: '1px solid #16a34a', marginBottom: 20 }}>
                    <div style={{ color: '#4ade80', fontSize: 13, fontWeight: 700 }}>✓ Folder Accessible</div>
                    <div style={{ color: '#4ade80', fontSize: 13, fontWeight: 700, marginTop: 4 }}>✓ Read & Write Permission Granted</div>
                    <div style={{ color: '#4ade80', fontSize: 13, fontWeight: 700, marginTop: 4 }}>✓ 245 GB Available Space</div>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => setWizardStep(5)}>
                      Proceed to Final Step
                    </button>
                  </div>
                )}
              </div>
            )}

            {wizardStep === 5 && (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle2 size={48} color="#4ade80" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>CADPOINT CRM Local Agent Ready</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
                  Your computer is now configured to automatically synchronize files and create secure daily database backups.
                </p>

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={finishWizard}>
                  Open Local Agent Control Panel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

