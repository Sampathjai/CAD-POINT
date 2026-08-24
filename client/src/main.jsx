import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    BookOpen,
    GraduationCap,
    WalletCards,
    BarChart3,
    Settings,
    Search,
    Bell,
    Plus,
    Phone,
    MessageCircle,
    ArrowUpRight,
    MoreHorizontal
} from 'lucide-react';
import './styles.css';

const initialLeads = [];
const initialFollowups = [];

function App() {
    const [page, setPage] = useState('Dashboard');
    const [token, setToken] = useState(() => localStorage.getItem('cadpoint_token') || '');
    const [user, setUser] = useState(null);
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });

    const [leads, setLeads] = useState(initialLeads);
    const [followups, setFollowups] = useState(initialFollowups);
    const [showAddLead, setShowAddLead] = useState(false);
    const [addLeadForm, setAddLeadForm] = useState({ firstName: '', lastName: '', phone: '', email: '', interestedCourse: '', sourceId: '' });
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({ leadId: '', scheduledAt: '', type: 'CALL', notes: '' });

    useEffect(() => {
        if (!token) return;
        fetch(import.meta.env.VITE_API_URL + '/auth/me', { headers: { Authorization: 'Bearer ' + token } })
            .then((r) => r.json())
            .then((j) => {
                if (j.success) setUser(j.data);
                else {
                    setToken('');
                    localStorage.removeItem('cadpoint_token');
                }
            })
            .catch(() => {
                setToken('');
                localStorage.removeItem('cadpoint_token');
            });
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchLeads();
            fetchFollowups();
        }
    }, [token]);

    async function doLogin() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginForm) });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Login failed');
            localStorage.setItem('cadpoint_token', j.data.token);
            setToken(j.data.token);
            setUser(j.data.user);
        } catch (err) {
            console.error(err);
            alert('Login error');
        }
    }

    async function fetchLeads() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/leads', { headers: { Authorization: 'Bearer ' + token } });
            const j = await res.json();
            if (j.success) setLeads(j.data || []);
        } catch (e) {
            console.error('fetchLeads', e);
        }
    }

    async function fetchFollowups() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/followups', { headers: { Authorization: 'Bearer ' + token } });
            const j = await res.json();
            if (j.success) setFollowups(j.data || []);
        } catch (e) {
            console.error('fetchFollowups', e);
        }
    }

    async function createLead() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(addLeadForm) });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create lead failed');
            setLeads((s) => [j.data, ...s]);
            setShowAddLead(false);
            setAddLeadForm({ firstName: '', lastName: '', phone: '', email: '', interestedCourse: '', sourceId: '' });
        } catch (e) {
            console.error(e);
            alert('Create lead failed');
        }
    }

    async function createFollowup() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/followups', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(scheduleForm) });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create follow-up failed');
            setFollowups((s) => [j.data, ...s]);
            setShowSchedule(false);
            setScheduleForm({ leadId: '', scheduledAt: '', type: 'CALL', notes: '' });
        } catch (e) {
            console.error(e);
            alert('Create follow-up failed');
        }
    }

    async function completeFollowup(id) {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/followups/' + id + '/complete', { method: 'PATCH', headers: { Authorization: 'Bearer ' + token } });
            const j = await res.json();
            if (!j.success) return alert('Complete failed');
            fetchFollowups();
        } catch (e) {
            console.error(e);
            alert('Complete failed');
        }
    }

    if (!token)
        return (
            <div className="login">
                <div className="loginbox">
                    <div className="logo big">CP</div>
                    <h1>CAD POINT</h1>
                    <p>CRM Platform</p>
                    <label>
                        Email
                        <input value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
                    </label>
                    <label>
                        Password
                        <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                    </label>
                    <button className="primary wide" onClick={doLogin}>
                        Sign in
                    </button>
                    <small>Connects to backend API at VITE_API_URL</small>
                </div>
            </div>
        );

    const nav = [
        ['Dashboard', LayoutDashboard],
        ['Leads', Users],
        ['Follow-ups', CalendarDays],
        ['Courses', BookOpen],
        ['Batches', CalendarDays],
        ['Students', GraduationCap],
        ['Admissions', ArrowUpRight],
        ['Payments', WalletCards],
        ['Reports', BarChart3],
        ['Settings', Settings]
    ];

    return (
        <div className="app">
            <aside>
                <div className="brand">
                    <div className="logo">CP</div>
                    <div>
                        <b>CAD POINT</b>
                        <span>CRM PLATFORM</span>
                    </div>
                </div>
                <div className="section">WORKSPACE</div>
                {nav.map(([n, I]) => (
                    <button key={n} className={page === n ? 'nav active' : 'nav'} onClick={() => setPage(n)}>
                        <I size={18} />
                        <span>{n}</span>
                        {n === 'Leads' && <em>{leads.length}</em>}
                    </button>
                ))}
                <div className="sidecard">
                    <div className="pulse"></div>
                    <b>System healthy</b>
                    <span>All services operational</span>
                </div>
                <div className="profile">
                    <div className="avatar">SK</div>
                    <div>
                        <b>{user?.name || 'Admin'}</b>
                        <span>{user?.role || 'Super Admin'}</span>
                    </div>
                    <MoreHorizontal size={18} />
                </div>
            </aside>
            <main>
                <header>
                    <div>
                        <span className="crumb">Workspace / </span>
                        <b>{page}</b>
                        <h1>{page === 'Dashboard' ? 'Good morning, Admin 👋' : page}</h1>
                    </div>
                    <div className="headright">
                        <div className="search">
                            <Search size={17} />
                            <input placeholder="Search anything..." />
                            <kbd>⌘ K</kbd>
                        </div>
                        <button className="icon">
                            <Bell size={19} />
                            <i></i>
                        </button>
                        <button className="user">{(user && user.name && user.name.split(' ').map((s) => s[0]).slice(0, 2).join('')) || 'SK'}</button>
                    </div>
                </header>
                {page === 'Dashboard' ? <Dashboard leads={leads} followups={followups} onAddLead={() => setShowAddLead(true)} onSchedule={() => setShowSchedule(true)} onCompleteFollowup={completeFollowup} /> : <Module page={page} leads={leads} />}
            </main>
            {showAddLead && (
                <div className="modal">
                    <form
                        className="panel"
                        onSubmit={(e) => {
                            e.preventDefault();
                            createLead();
                        }}
                    >
                        <h3>Add Lead</h3>
                        <label>
                            First name
                            <input value={addLeadForm.firstName} onChange={(e) => setAddLeadForm({ ...addLeadForm, firstName: e.target.value })} required />
                        </label>
                        <label>
                            Last name
                            <input value={addLeadForm.lastName} onChange={(e) => setAddLeadForm({ ...addLeadForm, lastName: e.target.value })} />
                        </label>
                        <label>
                            Phone
                            <input value={addLeadForm.phone} onChange={(e) => setAddLeadForm({ ...addLeadForm, phone: e.target.value })} required />
                        </label>
                        <label>
                            Email
                            <input value={addLeadForm.email} onChange={(e) => setAddLeadForm({ ...addLeadForm, email: e.target.value })} />
                        </label>
                        <label>
                            Course
                            <input value={addLeadForm.interestedCourse} onChange={(e) => setAddLeadForm({ ...addLeadForm, interestedCourse: e.target.value })} />
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="primary" type="submit">
                                Create
                            </button>
                            <button type="button" onClick={() => setShowAddLead(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {showSchedule && (
                <div className="modal">
                    <form
                        className="panel"
                        onSubmit={(e) => {
                            e.preventDefault();
                            createFollowup();
                        }}
                    >
                        <h3>Schedule Follow-up</h3>
                        <label>
                            Lead
                            <select value={scheduleForm.leadId} onChange={(e) => setScheduleForm({ ...scheduleForm, leadId: e.target.value })} required>
                                <option value="">Select lead</option>
                                {leads.map((l) => {
                                    const name = (l.firstName || '') + (l.lastName ? ' ' + l.lastName : '');
                                    return (
                                        <option key={l.id} value={l.id}>
                                            {name || l.leadNumber}
                                        </option>
                                    );
                                })}
                            </select>
                        </label>
                        <label>
                            Date & time
                            <input type="datetime-local" value={scheduleForm.scheduledAt} onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })} required />
                        </label>
                        <label>
                            Type
                            <select value={scheduleForm.type} onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}>
                                <option>CALL</option>
                                <option>WHATSAPP</option>
                                <option>EMAIL</option>
                                <option>OTHER</option>
                            </select>
                        </label>
                        <label>
                            Notes
                            <textarea value={scheduleForm.notes} onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })} />
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="primary" type="submit">
                                Schedule
                            </button>
                            <button type="button" onClick={() => setShowSchedule(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function Dashboard({ leads, followups, onAddLead, onSchedule, onCompleteFollowup }) {
    return (
        <div className="content">
            <div className="actions">
                <button className="primary" onClick={onAddLead}>
                    <Plus size={17} /> Add Lead
                </button>
                <button className="secondary" onClick={onSchedule}>
                    Schedule Follow-up
                </button>
            </div>
            <div className="cards">
                {[
                    ['Total Leads', String(leads.length || 0), '+0%', 'this month'],
                    ['Admissions', '0', '+0%', 'this month'],
                    ['Revenue', '₹0', '+0%', 'this month'],
                    ['Outstanding', '₹0', '+0%', 'vs last month']
                ].map((x, i) => (
                    <div className="card" key={i}>
                        <span>{x[0]}</span>
                        <strong>{x[1]}</strong>
                        <small className={i === 3 ? 'good' : ''}>{x[2]}</small>
                        <small>{x[3]}</small>
                    </div>
                ))}
            </div>
            <div className="grid">
                <section className="panel wide">
                    <div className="panelhead">
                        <div>
                            <b>Revenue overview</b>
                            <span>Monthly collections</span>
                        </div>
                        <select>
                            <option>Last 6 months</option>
                        </select>
                    </div>
                    <div className="chart">
                        <div className="bars">{[42, 58, 51, 74, 68, 91, 79, 96, 84, 100, 88, 108].map((h, i) => (
                            <div key={i} style={{ height: h * 1.65 }}>
                                <span></span>
                                <label>{['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][Math.floor(i / 2)]}</label>
                            </div>
                        ))}</div>
                    </div>
                </section>
                <section className="panel">
                    <div className="panelhead">
                        <div>
                            <b>Lead conversion</b>
                            <span>Current funnel</span>
                        </div>
                    </div>
                    {[['New', 248, '100%'], ['Contacted', 182, '73%'], ['Interested', 96, '39%'], ['Demo', 61, '25%'], ['Admission', 42, '17%']].map((x, i) => (
                        <div className="funnel" key={i}>
                            <div>
                                <span>{x[0]}</span>
                                <b>{x[1]}</b>
                            </div>
                            <div className="track">
                                <i style={{ width: x[2] }}></i>
                            </div>
                        </div>
                    ))}
                </section>
            </div>
            <div className="grid">
                <section className="panel">
                    <div className="panelhead">
                        <div>
                            <b>Today's follow-ups</b>
                            <span>{followups.length} tasks need attention</span>
                        </div>
                        <button className="link">View calendar</button>
                    </div>
                    {followups.slice(0, 8).map((f) => {
                        const time = new Date(f.scheduledAt).toLocaleString();
                        const leadName = f.leadId || 'Unknown';
                        return (
                            <div className="task" key={f.id}>
                                <time>{time}</time>
                                <div className="taskavatar">{(leadName + '').split(' ').map((x) => x[0]).join('')}</div>
                                <div>
                                    <b>{leadName}</b>
                                    <span>{f.notes || f.type}</span>
                                </div>
                                <button className="round" onClick={() => onCompleteFollowup(f.id)}>
                                    {f.type === 'CALL' ? <Phone size={15} /> : <MessageCircle size={15} />}
                                </button>
                            </div>
                        );
                    })}
                </section>
                <section className="panel">
                    <div className="panelhead">
                        <div>
                            <b>Recent leads</b>
                            <span>Latest enquiries</span>
                        </div>
                        <button className="link">View all</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Lead</th>
                                <th>Phone</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.slice(0, 6).map((l) => {
                                const name = (l.firstName || '') + (l.lastName ? ' ' + l.lastName : '');
                                const initials = (name.match(/\b\w/g) || []).slice(0, 2).join('');
                                return (
                                    <tr key={l.id}>
                                        <td>
                                            <div className="lead">
                                                <div className="mini">{initials}</div>
                                                <b>{name || l.leadNumber}</b>
                                            </div>
                                        </td>
                                        <td>{l.phone}</td>
                                        <td>
                                            <span className={'status ' + (l.status || '').toString().replaceAll(' ', '').toLowerCase()}>{l.status}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
}

function Module({ page, leads }) {
    if (page === 'Users') {
        const [users, setUsers] = useState([]);
        const [loading, setLoading] = useState(false);
        const [showForm, setShowForm] = useState(false);
        const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'COUNSELLOR', isActive: true });
        const token = localStorage.getItem('cadpoint_token') || '';
        useEffect(() => {
            let mounted = true;
            if (!token) return;
            setLoading(true);
            fetch(import.meta.env.VITE_API_URL + '/users', { headers: { Authorization: 'Bearer ' + token } })
                .then((r) => r.json())
                .then((j) => {
                    if (mounted) {
                        if (j.success) setUsers(j.data);
                        else alert(j.message || 'Failed to load users');
                    }
                })
                .catch((e) => {
                    console.error(e);
                    alert('Failed to load users');
                })
                .finally(() => mounted && setLoading(false));
            return () => (mounted = false);
        }, [token]);
        async function submit(e) {
            e.preventDefault();
            try {
                const res = await fetch(import.meta.env.VITE_API_URL + '/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(form) });
                const j = await res.json();
                if (!j.success) return alert(j.message || 'Create failed');
                setUsers((s) => [...s, j.data]);
                setShowForm(false);
                setForm({ name: '', email: '', phone: '', password: '', role: 'COUNSELLOR', isActive: true });
            } catch (err) {
                console.error(err);
                alert('Create user failed');
            }
        }
        return (
            <div className="content">
                <div className="moduletop">
                    <div>
                        <p>Manage your users in one place.</p>
                    </div>
                    <button className="primary" onClick={() => setShowForm(true)}>
                        <Plus size={17} /> Add User
                    </button>
                </div>
                <div className="panel">
                    <div className="toolbar">
                        <div className="search inline">
                            <Search size={16} />
                            <input placeholder={'Search users...'} />
                        </div>
                    </div>
                    {loading ? (
                        <p>Loading users...</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.name}</td>
                                        <td>{u.email}</td>
                                        <td>{u.phone || '-'}</td>
                                        <td>{u.role}</td>
                                        <td>{u.isActive ? 'Active' : 'Inactive'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {showForm && (
                    <div className="modal">
                        <form className="panel" onSubmit={submit}>
                            <h3>Create user</h3>
                            <label>
                                Name
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </label>
                            <label>
                                Email
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                            </label>
                            <label>
                                Phone
                                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            </label>
                            <label>
                                Password
                                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
                            </label>
                            <label>
                                Role
                                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                    <option>SUPER_ADMIN</option>
                                    <option>ADMIN</option>
                                    <option>COUNSELLOR</option>
                                    <option>TRAINER</option>
                                    <option>ACCOUNTS</option>
                                    <option>RECEPTIONIST</option>
                                </select>
                            </label>
                            <label>
                                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="primary" type="submit">
                                    Create
                                </button>
                                <button type="button" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }
    return (
        <div className="content">
            <div className="moduletop">
                <div>
                    <p>Manage your {page.toLowerCase()} in one place.</p>
                </div>
                <button className="primary">
                    <Plus size={17} /> Add {page.slice(0, -1)}
                </button>
            </div>
            <div className="panel">
                <div className="toolbar">
                    <div className="search inline">
                        <Search size={16} />
                        <input placeholder={'Search ' + page.toLowerCase() + '...'} />
                    </div>
                    <select>
                        <option>All statuses</option>
                    </select>
                </div>
                {page === 'Leads' ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Lead</th>
                                <th>Course</th>
                                <th>Source</th>
                                <th>Status</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map((l) => (
                                <tr key={l.id || l.leadNumber}>
                                    <td>
                                        <div className="lead">
                                            <div className="mini">{((l.firstName || '').match(/\b\w/g) || []).slice(0, 2).join('')}</div>
                                            <b>{(l.firstName || '') + (l.lastName ? ' ' + l.lastName : '') || l.leadNumber}</b>
                                        </div>
                                    </td>
                                    <td>{l.interestedCourse}</td>
                                    <td>{l.sourceId || '-'}</td>
                                    <td>
                                        <span className={'status ' + ((l.status || '') + '').replaceAll(' ', '').toLowerCase()}>{l.status}</span>
                                    </td>
                                    <td>
                                        <b>{l.estimatedValue || '-'}</b>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty">
                        <div className="emptyicon">
                            <BookOpen />
                        </div>
                        <h2>{page}</h2>
                        <p>This module is ready for API/database integration.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

createRoot(document.getElementById('root')).render(<App />);
