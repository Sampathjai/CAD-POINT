import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
    LayoutDashboard,
    Users as UsersIcon,
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
    MoreHorizontal,
    UserCheck,
    LogOut,
    X,
    Check,
    Edit,
    Trash2
} from 'lucide-react';
import './styles.css';

function App() {
    const [page, setPage] = useState('Dashboard');
    const [token, setToken] = useState(() => localStorage.getItem('cadpoint_token') || '');
    const [user, setUser] = useState(null);
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });

    // Entities State
    const [leads, setLeads] = useState([]);
    const [followups, setFollowups] = useState([]);
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [students, setStudents] = useState([]);
    const [admissions, setAdmissions] = useState([]);
    const [payments, setPayments] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // UI Modals
    const [showAddLead, setShowAddLead] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [showAddBatch, setShowAddBatch] = useState(false);
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [showAddAdmission, setShowAddAdmission] = useState(false);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [showAddUser, setShowAddUser] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editUserForm, setEditUserForm] = useState({ id: '', name: '', email: '', phone: '', password: '', role: 'COUNSELLOR', isActive: true });
    const [editingCourse, setEditingCourse] = useState(null);
    const [editCourseForm, setEditCourseForm] = useState({ id: '', courseCode: '', name: '', description: '', standardFee: '', isActive: true });

    const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);

    // Forms
    const [addLeadForm, setAddLeadForm] = useState({ firstName: '', lastName: '', phone: '', email: '', interestedCourse: '', estimatedValue: '' });
    const [scheduleForm, setScheduleForm] = useState({ leadId: '', scheduledAt: '', type: 'CALL', notes: '' });
    const [addCourseForm, setAddCourseForm] = useState({ courseCode: '', name: '', description: '', standardFee: '' });
    const [addBatchForm, setAddBatchForm] = useState({ batchCode: '', name: '', courseId: '', startDate: '', capacity: 25 });
    const [addStudentForm, setAddStudentForm] = useState({ studentCode: '', firstName: '', lastName: '', phone: '', email: '' });
    const [addAdmissionForm, setAddAdmissionForm] = useState({ admissionNumber: '', studentId: '', courseId: '', batchId: '', agreedFee: '', finalFee: '' });
    const [addPaymentForm, setAddPaymentForm] = useState({ admissionId: '', receiptNumber: '', amount: '', paymentMethod: 'UPI', transactionReference: '' });
    const [addUserForm, setAddUserForm] = useState({ name: '', email: '', phone: '', password: '', role: 'COUNSELLOR', isActive: true });

    useEffect(() => {
        if (!token) return;
        fetch(import.meta.env.VITE_API_URL + '/auth/me', { headers: { Authorization: 'Bearer ' + token } })
            .then((r) => r.json())
            .then((j) => {
                if (j.success) setUser(j.data);
                else logout();
            })
            .catch(() => logout());
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchLeads();
            fetchFollowups();
            fetchCourses();
            fetchBatches();
            fetchStudents();
            fetchAdmissions();
            fetchPayments();
            fetchNotifications();
            if (user?.role === 'SUPER_ADMIN') {
                fetchUsers();
            }
        }
    }, [token, user?.role]);

    function logout() {
        setToken('');
        setUser(null);
        localStorage.removeItem('cadpoint_token');
    }

    async function doLogin() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            });
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

    async function fetchCourses() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/courses', { headers: { Authorization: 'Bearer ' + token } });
            const j = await res.json();
            if (j.success) setCourses(j.data || []);
        } catch (e) {
            console.error('fetchCourses', e);
        }
    }

    async function fetchBatches() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/batches', { headers: { Authorization: 'Bearer ' + token } });
            const j = await res.json();
            if (j.success) setBatches(j.data || []);
        } catch (e) {
            console.error('fetchBatches', e);
        }
    }

    async function fetchStudents() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/students', { headers: { Authorization: 'Bearer ' + token } });
            const j = await res.json();
            if (j.success) setStudents(j.data || []);
        } catch (e) {
            console.error('fetchStudents', e);
        }
    }

    async function fetchAdmissions() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/admissions', { headers: { Authorization: 'Bearer ' + token } });
            const j = await res.json();
            if (j.success) setAdmissions(j.data || []);
        } catch (e) {
            console.error('fetchAdmissions', e);
        }
    }

    async function fetchPayments() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/payments', { headers: { Authorization: 'Bearer ' + token } });
            const j = await res.json();
            if (j.success) setPayments(j.data || []);
        } catch (e) {
            console.error('fetchPayments', e);
        }
    }

    async function fetchUsers() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/users', { headers: { Authorization: 'Bearer ' + token } });
            const j = await res.json();
            if (j.success) setUsersList(j.data || []);
        } catch (e) {
            console.error('fetchUsers', e);
        }
    }

    async function fetchNotifications() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/notifications', { headers: { Authorization: 'Bearer ' + token } });
            const j = await res.json();
            if (j.success) setNotifications(j.data || []);
        } catch (e) {
            console.error('fetchNotifications', e);
        }
    }

    async function handleSearch(query) {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults(null);
            setShowSearchModal(false);
            return;
        }
        setIsSearching(true);
        setShowSearchModal(true);
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/search?q=' + encodeURIComponent(query), { headers: { Authorization: 'Bearer ' + token } });
            const j = await res.json();
            if (j.success) setSearchResults(j.data);
        } catch (e) {
            console.error('search error', e);
        } finally {
            setIsSearching(false);
        }
    }

    // Submit Handlers
    async function createLead() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(addLeadForm)
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create lead failed');
            setLeads((s) => [j.data, ...s]);
            setShowAddLead(false);
            setAddLeadForm({ firstName: '', lastName: '', phone: '', email: '', interestedCourse: '', estimatedValue: '' });
        } catch (e) {
            console.error(e);
            alert('Create lead failed');
        }
    }

    async function createFollowup() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/followups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(scheduleForm)
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create follow-up failed');
            fetchFollowups();
            setShowSchedule(false);
            setScheduleForm({ leadId: '', scheduledAt: '', type: 'CALL', notes: '' });
        } catch (e) {
            console.error(e);
            alert('Create follow-up failed');
        }
    }

    async function completeFollowup(id) {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/followups/' + id + '/complete', {
                method: 'PATCH',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (!j.success) return alert('Complete failed');
            fetchFollowups();
        } catch (e) {
            console.error(e);
            alert('Complete failed');
        }
    }

    async function createCourse() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ ...addCourseForm, standardFee: Number(addCourseForm.standardFee) || 0 })
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create course failed');
            setCourses((s) => [...s, j.data]);
            setShowAddCourse(false);
            setAddCourseForm({ courseCode: '', name: '', description: '', standardFee: '' });
        } catch (e) {
            console.error(e);
            alert('Create course failed');
        }
    }

    async function createBatch() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ ...addBatchForm, capacity: Number(addBatchForm.capacity) || 25 })
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create batch failed');
            fetchBatches();
            setShowAddBatch(false);
            setAddBatchForm({ batchCode: '', name: '', courseId: '', startDate: '', capacity: 25 });
        } catch (e) {
            console.error(e);
            alert('Create batch failed');
        }
    }

    async function createStudent() {
        try {
            const payload = {
                ...addStudentForm,
                studentCode: addStudentForm.studentCode.trim() || undefined,
                email: addStudentForm.email.trim() || undefined,
                lastName: addStudentForm.lastName.trim() || undefined
            };
            const res = await fetch(import.meta.env.VITE_API_URL + '/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(payload)
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create student failed');
            fetchStudents();
            setShowAddStudent(false);
            setAddStudentForm({ studentCode: '', firstName: '', lastName: '', phone: '', email: '' });
        } catch (e) {
            console.error(e);
            alert('Create student failed');
        }
    }

    async function createAdmission() {
        try {
            const payload = {
                ...addAdmissionForm,
                admissionNumber: addAdmissionForm.admissionNumber.trim() || undefined,
                batchId: addAdmissionForm.batchId || undefined,
                agreedFee: Number(addAdmissionForm.agreedFee) || Number(addAdmissionForm.finalFee),
                finalFee: Number(addAdmissionForm.finalFee)
            };
            const res = await fetch(import.meta.env.VITE_API_URL + '/admissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(payload)
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create admission failed');
            fetchAdmissions();
            setShowAddAdmission(false);
            setAddAdmissionForm({ admissionNumber: '', studentId: '', courseId: '', batchId: '', agreedFee: '', finalFee: '' });
        } catch (e) {
            console.error(e);
            alert('Create admission failed');
        }
    }

    async function createPayment() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({
                    ...addPaymentForm,
                    amount: Number(addPaymentForm.amount)
                })
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create payment failed');
            fetchPayments();
            setShowAddPayment(false);
            setAddPaymentForm({ admissionId: '', receiptNumber: '', amount: '', paymentMethod: 'UPI', transactionReference: '' });
        } catch (e) {
            console.error(e);
            alert('Create payment failed');
        }
    }

    async function createUserSubmit() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(addUserForm)
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create user failed');
            fetchUsers();
            setShowAddUser(false);
            setAddUserForm({ name: '', email: '', phone: '', password: '', role: 'COUNSELLOR', isActive: true });
        } catch (e) {
            console.error(e);
            alert('Create user failed');
        }
    }

    function openEditUser(userToEdit) {
        setEditingUser(userToEdit);
        setEditUserForm({
            id: userToEdit.id,
            name: userToEdit.name || '',
            email: userToEdit.email || '',
            phone: userToEdit.phone || '',
            password: '',
            role: userToEdit.role || 'COUNSELLOR',
            isActive: userToEdit.isActive ?? true
        });
    }

    async function updateUserSubmit() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/users/' + editUserForm.id, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(editUserForm)
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Update user failed');
            fetchUsers();
            setEditingUser(null);
        } catch (e) {
            console.error(e);
            alert('Update user failed');
        }
    }

    async function deleteUser(id, name) {
        if (!window.confirm(`Are you sure you want to delete user account "${name}"?`)) return;
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/users/' + id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Delete user failed');
            fetchUsers();
        } catch (e) {
            console.error(e);
            alert('Delete user failed');
        }
    }

    async function deleteStudent(id, name) {
        if (!window.confirm(`Are you sure you want to delete student "${name}"?`)) return;
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/students/' + id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Delete student failed');
            fetchStudents();
        } catch (e) {
            console.error(e);
            alert('Delete student failed');
        }
    }

    async function deleteAdmission(id, admissionNumber) {
        if (!window.confirm(`Are you sure you want to delete admission "${admissionNumber}"?`)) return;
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/admissions/' + id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Delete admission failed');
            fetchAdmissions();
        } catch (e) {
            console.error(e);
            alert('Delete admission failed');
        }
    }

    function openEditCourse(courseToEdit) {
        setEditingCourse(courseToEdit);
        setEditCourseForm({
            id: courseToEdit.id,
            courseCode: courseToEdit.courseCode || '',
            name: courseToEdit.name || '',
            description: courseToEdit.description || '',
            standardFee: courseToEdit.standardFee || '',
            isActive: courseToEdit.isActive ?? true
        });
    }

    async function updateCourseSubmit() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/courses/' + editCourseForm.id, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({
                    ...editCourseForm,
                    standardFee: Number(editCourseForm.standardFee) || 0
                })
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Update course failed');
            fetchCourses();
            setEditingCourse(null);
        } catch (e) {
            console.error(e);
            alert('Update course failed');
        }
    }

    function getNextCode(prefix, list, key) {
        let maxNum = 1000;
        if (list && list.length > 0) {
            list.forEach((item) => {
                const val = (item && item[key]) ? String(item[key]) : '';
                const match = val.match(/\d+/);
                if (match) {
                    const num = parseInt(match[0], 10);
                    if (!isNaN(num) && num > maxNum) maxNum = num;
                }
            });
        }
        return `${prefix}-${maxNum + 1}`;
    }

    function openAddModalForPage(currentPage) {
        if (currentPage === 'Leads') setShowAddLead(true);
        else if (currentPage === 'Follow-ups') setShowSchedule(true);
        else if (currentPage === 'Courses') setShowAddCourse(true);
        else if (currentPage === 'Batches') setShowAddBatch(true);
        else if (currentPage === 'Students') {
            setAddStudentForm((prev) => ({
                ...prev,
                studentCode: getNextCode('STU', students, 'studentCode')
            }));
            setShowAddStudent(true);
        } else if (currentPage === 'Admissions') {
            setAddAdmissionForm((prev) => ({
                ...prev,
                admissionNumber: getNextCode('ADM', admissions, 'admissionNumber')
            }));
            setShowAddAdmission(true);
        } else if (currentPage === 'Payments') {
            setAddPaymentForm((prev) => ({
                ...prev,
                receiptNumber: getNextCode('REC', payments, 'receiptNumber')
            }));
            setShowAddPayment(true);
        } else if (currentPage === 'Users') setShowAddUser(true);
        else alert(`Action ready for ${currentPage}`);
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
                        <input value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="admin@cadpoint.com" />
                    </label>
                    <label>
                        Password
                        <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="••••••••" />
                    </label>
                    <button className="primary wide" onClick={doLogin}>
                        Sign in
                    </button>
                    <small>Default Seed Login: admin@cadpoint.com / Admin@123</small>
                </div>
            </div>
        );

    const nav = [
        ['Dashboard', LayoutDashboard],
        ['Leads', UsersIcon],
        ['Follow-ups', CalendarDays],
        ['Courses', BookOpen],
        ['Batches', CalendarDays],
        ['Students', GraduationCap],
        ['Admissions', ArrowUpRight],
        ['Payments', WalletCards],
        ['Reports', BarChart3],
        ...(user?.role === 'SUPER_ADMIN' ? [['Users', UserCheck]] : []),
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
                        {n === 'Follow-ups' && <em>{followups.length}</em>}
                    </button>
                ))}
                <div className="sidecard">
                    <div className="pulse"></div>
                    <b>System healthy</b>
                    <span>All services operational</span>
                </div>
                <div className="profile" onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ cursor: 'pointer', position: 'relative' }}>
                    <div className="avatar">{(user?.name || 'SK').split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
                    <div>
                        <b>{user?.name || 'Admin'}</b>
                        <span>{user?.role || 'SUPER_ADMIN'}</span>
                    </div>
                    <MoreHorizontal size={18} />
                </div>
                {showProfileMenu && (
                    <div style={{ padding: '8px 16px', background: '#1e293b', borderRadius: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button style={{ background: 'none', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600 }} onClick={logout}>
                            <LogOut size={16} /> Sign out
                        </button>
                    </div>
                )}
            </aside>

            <main>
                <header>
                    <div>
                        <span className="crumb">Workspace / </span>
                        <b>{page}</b>
                        <h1>{page === 'Dashboard' ? `Good day, ${user?.name || 'Admin'} 👋` : page}</h1>
                    </div>
                    <div className="headright">
                        <div className="search" style={{ position: 'relative' }}>
                            <Search size={17} />
                            <input
                                placeholder="Search anything..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {searchQuery && (
                                <X size={15} style={{ cursor: 'pointer', marginRight: 8 }} onClick={() => handleSearch('')} />
                            )}
                            <kbd>⌘ K</kbd>

                            {/* Search overlay dropdown */}
                            {showSearchModal && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8, background: '#ffffff', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 100, color: '#1e293b', padding: 12, maxHeight: 350, overflowY: 'auto' }}>
                                    {isSearching && <p style={{ fontSize: 13, color: '#64748b' }}>Searching...</p>}
                                    {searchResults && (
                                        <div>
                                            {searchResults.leads?.length > 0 && (
                                                <div style={{ marginBottom: 12 }}>
                                                    <b style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Leads ({searchResults.leads.length})</b>
                                                    {searchResults.leads.map((l) => (
                                                        <div key={l.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => { setPage('Leads'); setShowSearchModal(false); }}>
                                                            <b>{l.firstName} {l.lastName}</b> - <small>{l.phone}</small>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {searchResults.students?.length > 0 && (
                                                <div style={{ marginBottom: 12 }}>
                                                    <b style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Students ({searchResults.students.length})</b>
                                                    {searchResults.students.map((s) => (
                                                        <div key={s.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => { setPage('Students'); setShowSearchModal(false); }}>
                                                            <b>{s.firstName} {s.lastName}</b> - <small>{s.studentCode}</small>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {searchResults.courses?.length > 0 && (
                                                <div>
                                                    <b style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Courses ({searchResults.courses.length})</b>
                                                    {searchResults.courses.map((c) => (
                                                        <div key={c.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => { setPage('Courses'); setShowSearchModal(false); }}>
                                                            <b>{c.name}</b> ({c.courseCode})
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {searchResults.leads?.length === 0 && searchResults.students?.length === 0 && searchResults.courses?.length === 0 && (
                                                <p style={{ fontSize: 13, color: '#64748b' }}>No matching results found.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Notifications */}
                        <div style={{ position: 'relative' }}>
                            <button className="icon" onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}>
                                <Bell size={19} />
                                {notifications.length > 0 && <i></i>}
                            </button>
                            {showNotificationsDropdown && (
                                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 320, background: '#ffffff', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 100, padding: 12, color: '#1e293b' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <b>Notifications</b>
                                        <small>{notifications.length} item(s)</small>
                                    </div>
                                    {notifications.length === 0 ? (
                                        <p style={{ fontSize: 13, color: '#64748b' }}>No notifications</p>
                                    ) : (
                                        notifications.slice(0, 5).map((n) => (
                                            <div key={n.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                <b style={{ fontSize: 13 }}>{n.title}</b>
                                                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{n.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <button className="user" onClick={logout} title="Click to Logout">
                            {(user && user.name && user.name.split(' ').map((s) => s[0]).slice(0, 2).join('')) || 'SK'}
                        </button>
                    </div>
                </header>

                {page === 'Dashboard' ? (
                    <Dashboard
                        leads={leads}
                        followups={followups}
                        admissions={admissions}
                        payments={payments}
                        onAddLead={() => setShowAddLead(true)}
                        onSchedule={() => setShowSchedule(true)}
                        onCompleteFollowup={completeFollowup}
                        onNavigate={(targetPage) => setPage(targetPage)}
                    />
                ) : (
                    <Module
                        page={page}
                        leads={leads}
                        followups={followups}
                        courses={courses}
                        batches={batches}
                        students={students}
                        admissions={admissions}
                        payments={payments}
                        usersList={usersList}
                        onOpenAddModal={() => openAddModalForPage(page)}
                        onCompleteFollowup={completeFollowup}
                        onEditUser={openEditUser}
                        onDeleteUser={deleteUser}
                        onEditCourse={openEditCourse}
                        onDeleteStudent={deleteStudent}
                        onDeleteAdmission={deleteAdmission}
                        currentUserId={user?.id}
                        token={token}
                    />
                )}
            </main>

            {/* Modals */}
            {editingCourse && (
                <div className="modal">
                    <form
                        className="panel"
                        onSubmit={(e) => {
                            e.preventDefault();
                            updateCourseSubmit();
                        }}
                    >
                        <h3>Edit Course</h3>
                        <label>
                            Course Code
                            <input value={editCourseForm.courseCode} onChange={(e) => setEditCourseForm({ ...editCourseForm, courseCode: e.target.value })} required />
                        </label>
                        <label>
                            Course Name
                            <input value={editCourseForm.name} onChange={(e) => setEditCourseForm({ ...editCourseForm, name: e.target.value })} required />
                        </label>
                        <label>
                            Standard Fee (₹)
                            <input type="number" value={editCourseForm.standardFee} onChange={(e) => setEditCourseForm({ ...editCourseForm, standardFee: e.target.value })} required />
                        </label>
                        <label>
                            Description
                            <textarea value={editCourseForm.description} onChange={(e) => setEditCourseForm({ ...editCourseForm, description: e.target.value })} />
                        </label>
                        <label className="checkbox-label">
                            <input type="checkbox" checked={editCourseForm.isActive} onChange={(e) => setEditCourseForm({ ...editCourseForm, isActive: e.target.checked })} /> Active Course
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">Save Changes</button>
                            <button type="button" onClick={() => setEditingCourse(null)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
            {editingUser && (
                <div className="modal">
                    <form
                        className="panel"
                        onSubmit={(e) => {
                            e.preventDefault();
                            updateUserSubmit();
                        }}
                    >
                        <h3>Edit User Account</h3>
                        <label>
                            Name
                            <input value={editUserForm.name} onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })} required />
                        </label>
                        <label>
                            Email
                            <input type="email" value={editUserForm.email} onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })} required />
                        </label>
                        <label>
                            Phone
                            <input value={editUserForm.phone || ''} onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })} />
                        </label>
                        <label>
                            New Password (leave blank to keep current)
                            <input type="password" value={editUserForm.password} onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })} placeholder="••••••••" minLength={8} />
                        </label>
                        <label>
                            Role
                            <select value={editUserForm.role} onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}>
                                <option>SUPER_ADMIN</option>
                                <option>ADMIN</option>
                                <option>COUNSELLOR</option>
                                <option>TRAINER</option>
                                <option>ACCOUNTS</option>
                                <option>RECEPTIONIST</option>
                            </select>
                        </label>
                        <label className="checkbox-label">
                            <input type="checkbox" checked={editUserForm.isActive} onChange={(e) => setEditUserForm({ ...editUserForm, isActive: e.target.checked })} /> Active User
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">Save Changes</button>
                            <button type="button" onClick={() => setEditingUser(null)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
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
                            Interested Course
                            <input value={addLeadForm.interestedCourse} onChange={(e) => setAddLeadForm({ ...addLeadForm, interestedCourse: e.target.value })} placeholder="e.g. AutoCAD" />
                        </label>
                        <label>
                            Estimated Value (₹)
                            <input type="number" value={addLeadForm.estimatedValue} onChange={(e) => setAddLeadForm({ ...addLeadForm, estimatedValue: e.target.value })} placeholder="30000" />
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">
                                Create Lead
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
                                            {name || l.leadNumber} ({l.phone})
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
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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

            {showAddCourse && (
                <div className="modal">
                    <form
                        className="panel"
                        onSubmit={(e) => {
                            e.preventDefault();
                            createCourse();
                        }}
                    >
                        <h3>Add Course</h3>
                        <label>
                            Course Code
                            <input value={addCourseForm.courseCode} onChange={(e) => setAddCourseForm({ ...addCourseForm, courseCode: e.target.value })} placeholder="CAD-01" required />
                        </label>
                        <label>
                            Course Name
                            <input value={addCourseForm.name} onChange={(e) => setAddCourseForm({ ...addCourseForm, name: e.target.value })} placeholder="AutoCAD Masterclass" required />
                        </label>
                        <label>
                            Standard Fee (₹)
                            <input type="number" value={addCourseForm.standardFee} onChange={(e) => setAddCourseForm({ ...addCourseForm, standardFee: e.target.value })} placeholder="30000" required />
                        </label>
                        <label>
                            Description
                            <textarea value={addCourseForm.description} onChange={(e) => setAddCourseForm({ ...addCourseForm, description: e.target.value })} />
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">Create Course</button>
                            <button type="button" onClick={() => setShowAddCourse(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {showAddBatch && (
                <div className="modal">
                    <form
                        className="panel"
                        onSubmit={(e) => {
                            e.preventDefault();
                            createBatch();
                        }}
                    >
                        <h3>Add Batch</h3>
                        <label>
                            Batch Code
                            <input value={addBatchForm.batchCode} onChange={(e) => setAddBatchForm({ ...addBatchForm, batchCode: e.target.value })} placeholder="BATCH-2026-A" required />
                        </label>
                        <label>
                            Batch Name
                            <input value={addBatchForm.name} onChange={(e) => setAddBatchForm({ ...addBatchForm, name: e.target.value })} placeholder="Morning AutoCAD Batch" required />
                        </label>
                        <label>
                            Course
                            <select value={addBatchForm.courseId} onChange={(e) => setAddBatchForm({ ...addBatchForm, courseId: e.target.value })} required>
                                <option value="">Select course</option>
                                {courses.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.courseCode})</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Start Date
                            <input type="date" value={addBatchForm.startDate} onChange={(e) => setAddBatchForm({ ...addBatchForm, startDate: e.target.value })} required />
                        </label>
                        <label>
                            Capacity
                            <input type="number" value={addBatchForm.capacity} onChange={(e) => setAddBatchForm({ ...addBatchForm, capacity: e.target.value })} />
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">Create Batch</button>
                            <button type="button" onClick={() => setShowAddBatch(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {showAddStudent && (
                <div className="modal">
                    <form
                        className="panel"
                        onSubmit={(e) => {
                            e.preventDefault();
                            createStudent();
                        }}
                    >
                        <h3>Add Student</h3>
                        <label>
                            Student Code
                            <input value={addStudentForm.studentCode} onChange={(e) => setAddStudentForm({ ...addStudentForm, studentCode: e.target.value })} placeholder="STU-101" required />
                        </label>
                        <label>
                            First Name
                            <input value={addStudentForm.firstName} onChange={(e) => setAddStudentForm({ ...addStudentForm, firstName: e.target.value })} required />
                        </label>
                        <label>
                            Last Name
                            <input value={addStudentForm.lastName} onChange={(e) => setAddStudentForm({ ...addStudentForm, lastName: e.target.value })} />
                        </label>
                        <label>
                            Phone
                            <input value={addStudentForm.phone} onChange={(e) => setAddStudentForm({ ...addStudentForm, phone: e.target.value })} required />
                        </label>
                        <label>
                            Email
                            <input type="email" value={addStudentForm.email} onChange={(e) => setAddStudentForm({ ...addStudentForm, email: e.target.value })} />
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">Create Student</button>
                            <button type="button" onClick={() => setShowAddStudent(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {showAddAdmission && (
                <div className="modal">
                    <form
                        className="panel"
                        onSubmit={(e) => {
                            e.preventDefault();
                            createAdmission();
                        }}
                    >
                        <h3>Add Admission</h3>
                        <label>
                            Admission Number
                            <input value={addAdmissionForm.admissionNumber} onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, admissionNumber: e.target.value })} placeholder="ADM-1001" required />
                        </label>
                        <label>
                            Student
                            <select value={addAdmissionForm.studentId} onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, studentId: e.target.value })} required>
                                <option value="">Select student</option>
                                {students.map((s) => (
                                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentCode})</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Course
                            <select value={addAdmissionForm.courseId} onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, courseId: e.target.value })} required>
                                <option value="">Select course</option>
                                {courses.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Batch (Optional)
                            <select value={addAdmissionForm.batchId} onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, batchId: e.target.value })}>
                                <option value="">Select batch</option>
                                {batches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name} ({b.batchCode})</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Final Fee (₹)
                            <input type="number" value={addAdmissionForm.finalFee} onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, finalFee: e.target.value })} placeholder="30000" required />
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">Create Admission</button>
                            <button type="button" onClick={() => setShowAddAdmission(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {showAddPayment && (
                <div className="modal">
                    <form
                        className="panel"
                        onSubmit={(e) => {
                            e.preventDefault();
                            createPayment();
                        }}
                    >
                        <h3>Record Payment</h3>
                        <label>
                            Admission
                            <select value={addPaymentForm.admissionId} onChange={(e) => setAddPaymentForm({ ...addPaymentForm, admissionId: e.target.value })} required>
                                <option value="">Select admission</option>
                                {admissions.map((a) => (
                                    <option key={a.id} value={a.id}>{a.admissionNumber} - {a.student?.firstName} ({a.course?.name})</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Receipt Number
                            <input value={addPaymentForm.receiptNumber} onChange={(e) => setAddPaymentForm({ ...addPaymentForm, receiptNumber: e.target.value })} placeholder="REC-501" required />
                        </label>
                        <label>
                            Amount (₹)
                            <input type="number" value={addPaymentForm.amount} onChange={(e) => setAddPaymentForm({ ...addPaymentForm, amount: e.target.value })} placeholder="10000" required />
                        </label>
                        <label>
                            Payment Method
                            <select value={addPaymentForm.paymentMethod} onChange={(e) => setAddPaymentForm({ ...addPaymentForm, paymentMethod: e.target.value })}>
                                <option>UPI</option>
                                <option>CASH</option>
                                <option>CARD</option>
                                <option>BANK_TRANSFER</option>
                                <option>CHEQUE</option>
                                <option>ONLINE</option>
                            </select>
                        </label>
                        <label>
                            Transaction Reference
                            <input value={addPaymentForm.transactionReference} onChange={(e) => setAddPaymentForm({ ...addPaymentForm, transactionReference: e.target.value })} placeholder="UPI-12345678" />
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">Record Payment</button>
                            <button type="button" onClick={() => setShowAddPayment(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {showAddUser && (
                <div className="modal">
                    <form
                        className="panel"
                        onSubmit={(e) => {
                            e.preventDefault();
                            createUserSubmit();
                        }}
                    >
                        <h3>Create User</h3>
                        <label>
                            Name
                            <input value={addUserForm.name} onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })} required />
                        </label>
                        <label>
                            Email
                            <input type="email" value={addUserForm.email} onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })} required />
                        </label>
                        <label>
                            Phone
                            <input value={addUserForm.phone} onChange={(e) => setAddUserForm({ ...addUserForm, phone: e.target.value })} />
                        </label>
                        <label>
                            Password
                            <input type="password" value={addUserForm.password} onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })} required minLength={8} />
                        </label>
                        <label>
                            Role
                            <select value={addUserForm.role} onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value })}>
                                <option>SUPER_ADMIN</option>
                                <option>ADMIN</option>
                                <option>COUNSELLOR</option>
                                <option>TRAINER</option>
                                <option>ACCOUNTS</option>
                                <option>RECEPTIONIST</option>
                            </select>
                        </label>
                        <label className="checkbox-label">
                            <input type="checkbox" checked={addUserForm.isActive} onChange={(e) => setAddUserForm({ ...addUserForm, isActive: e.target.checked })} /> Active User
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">Create User</button>
                            <button type="button" onClick={() => setShowAddUser(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function Dashboard({ leads, followups, admissions, payments, onAddLead, onSchedule, onCompleteFollowup, onNavigate }) {
    const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalAdmissions = admissions.length;

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
                    ['Total Leads', String(leads.length || 0), '+12%', 'this month'],
                    ['Admissions', String(totalAdmissions), '+5%', 'this month'],
                    ['Revenue', `₹${totalRevenue.toLocaleString()}`, '+18%', 'this month'],
                    ['Outstanding', '₹0', '0%', 'vs last month']
                ].map((x, i) => (
                    <div className="card" key={i}>
                        <span>{x[0]}</span>
                        <strong>{x[1]}</strong>
                        <small className={i === 2 ? 'good' : ''}>{x[2]}</small>
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
                        <div className="bars">
                            {[42, 58, 51, 74, 68, 91, 79, 96, 84, 100, 88, 108].map((h, i) => (
                                <div key={i} style={{ height: h * 1.65 }}>
                                    <span></span>
                                    <label>{['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][Math.floor(i / 2)]}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                <section className="panel">
                    <div className="panelhead">
                        <div>
                            <b>Lead conversion</b>
                            <span>Current funnel</span>
                        </div>
                    </div>
                    {[
                        ['New', leads.length || 24, '100%'],
                        ['Contacted', Math.round(leads.length * 0.7) || 18, '70%'],
                        ['Interested', Math.round(leads.length * 0.4) || 10, '40%'],
                        ['Demo', Math.round(leads.length * 0.2) || 5, '20%'],
                        ['Admission', totalAdmissions || 2, '10%']
                    ].map((x, i) => (
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
                        <button className="link" onClick={() => onNavigate('Follow-ups')}>
                            View calendar
                        </button>
                    </div>
                    {followups.length === 0 ? (
                        <p style={{ padding: 16, color: '#64748b' }}>No pending follow-ups scheduled for today.</p>
                    ) : (
                        followups.slice(0, 8).map((f) => {
                            const time = new Date(f.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                            const leadName = f.lead ? `${f.lead.firstName} ${f.lead.lastName || ''}`.trim() : (f.leadId || 'Unknown Lead');
                            return (
                                <div className="task" key={f.id}>
                                    <time>{time}</time>
                                    <div className="taskavatar">{leadName.split(' ').map((x) => x[0]).join('').slice(0, 2)}</div>
                                    <div>
                                        <b>{leadName}</b>
                                        <span>{f.notes || f.type}</span>
                                    </div>
                                    <button className="round" onClick={() => onCompleteFollowup(f.id)} title="Mark Complete">
                                        {f.type === 'CALL' ? <Phone size={15} /> : <MessageCircle size={15} />}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </section>
                <section className="panel">
                    <div className="panelhead">
                        <div>
                            <b>Recent leads</b>
                            <span>Latest enquiries</span>
                        </div>
                        <button className="link" onClick={() => onNavigate('Leads')}>
                            View all
                        </button>
                    </div>
                    {leads.length === 0 ? (
                        <p style={{ padding: 16, color: '#64748b' }}>No leads recorded yet.</p>
                    ) : (
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
                                        <tr key={l.id || l.leadNumber}>
                                            <td>
                                                <div className="lead">
                                                    <div className="mini">{initials || 'LD'}</div>
                                                    <b>{name || l.leadNumber}</b>
                                                </div>
                                            </td>
                                            <td>{l.phone}</td>
                                            <td>
                                                <span className={'status ' + (l.status || 'new').toString().replaceAll(' ', '').toLowerCase()}>{l.status || 'NEW'}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>
        </div>
    );
}

function Module({ page, leads, followups, courses, batches, students, admissions, payments, usersList, onOpenAddModal, onCompleteFollowup, onEditUser, onDeleteUser, onEditCourse, onDeleteStudent, onDeleteAdmission, currentUserId, token }) {
    const itemSingular = page.slice(0, -1);

    return (
        <div className="content">
            <div className="moduletop">
                <div>
                    <p>Manage your {page.toLowerCase()} in one place.</p>
                </div>
                {page !== 'Settings' && page !== 'Reports' && (
                    <button className="primary" onClick={onOpenAddModal}>
                        <Plus size={17} /> Add {itemSingular}
                    </button>
                )}
            </div>

            <div className="panel">
                {page !== 'Settings' && page !== 'Reports' && (
                    <div className="toolbar">
                        <div className="search inline">
                            <Search size={16} />
                            <input placeholder={'Filter ' + page.toLowerCase() + '...'} />
                        </div>
                        <select>
                            <option>All items</option>
                        </select>
                    </div>
                )}

                {page === 'Leads' && (
                    <table>
                        <thead>
                            <tr>
                                <th>Lead</th>
                                <th>Course</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map((l) => (
                                <tr key={l.id || l.leadNumber}>
                                    <td>
                                        <div className="lead">
                                            <div className="mini">{((l.firstName || '').match(/\b\w/g) || []).slice(0, 2).join('') || 'LD'}</div>
                                            <b>{(l.firstName || '') + (l.lastName ? ' ' + l.lastName : '') || l.leadNumber}</b>
                                        </div>
                                    </td>
                                    <td>{l.interestedCourse || '-'}</td>
                                    <td>{l.phone}</td>
                                    <td>
                                        <span className={'status ' + ((l.status || 'new') + '').replaceAll(' ', '').toLowerCase()}>{l.status}</span>
                                    </td>
                                    <td>
                                        <b>{l.estimatedValue ? `₹${Number(l.estimatedValue).toLocaleString()}` : '-'}</b>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {page === 'Follow-ups' && (
                    <table>
                        <thead>
                            <tr>
                                <th>Scheduled Time</th>
                                <th>Lead</th>
                                <th>Type</th>
                                <th>Notes</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {followups.map((f) => (
                                <tr key={f.id}>
                                    <td>{new Date(f.scheduledAt).toLocaleString()}</td>
                                    <td><b>{f.lead ? `${f.lead.firstName} ${f.lead.lastName || ''}`.trim() : f.leadId}</b></td>
                                    <td>{f.type}</td>
                                    <td>{f.notes || '-'}</td>
                                    <td><span className={'status ' + f.status.toLowerCase()}>{f.status}</span></td>
                                    <td>
                                        {f.status === 'PENDING' && (
                                            <button className="primary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => onCompleteFollowup(f.id)}>
                                                Complete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {page === 'Courses' && (
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Standard Fee</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((c) => (
                                <tr key={c.id}>
                                    <td><b>{c.courseCode}</b></td>
                                    <td>{c.name}</td>
                                    <td>{c.description || '-'}</td>
                                    <td><b>₹{Number(c.standardFee).toLocaleString()}</b></td>
                                    <td><span className={c.isActive ? 'status confirmed' : 'status lost'}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td>
                                        <button className="secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => onEditCourse(c)}>
                                            <Edit size={13} /> Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {page === 'Batches' && (
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Batch Name</th>
                                <th>Course</th>
                                <th>Start Date</th>
                                <th>Capacity</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map((b) => (
                                <tr key={b.id}>
                                    <td><b>{b.batchCode}</b></td>
                                    <td>{b.name}</td>
                                    <td>{b.course?.name || '-'}</td>
                                    <td>{new Date(b.startDate).toLocaleDateString()}</td>
                                    <td>{b.capacity} students</td>
                                    <td><span className="status active">{b.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {page === 'Students' && (
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s) => (
                                <tr key={s.id}>
                                    <td><b>{s.studentCode}</b></td>
                                    <td>{s.firstName} {s.lastName || ''}</td>
                                    <td>{s.phone}</td>
                                    <td>{s.email || '-'}</td>
                                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button className="secondary" style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => onDeleteStudent(s.id, `${s.firstName} ${s.lastName || ''}`.trim())}>
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {page === 'Admissions' && (
                    <table>
                        <thead>
                            <tr>
                                <th>Admission #</th>
                                <th>Student</th>
                                <th>Course</th>
                                <th>Final Fee</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admissions.map((a) => (
                                <tr key={a.id}>
                                    <td><b>{a.admissionNumber}</b></td>
                                    <td>{a.student ? `${a.student.firstName} ${a.student.lastName || ''}`.trim() : '-'}</td>
                                    <td>{a.course?.name || '-'}</td>
                                    <td><b>₹{Number(a.finalFee).toLocaleString()}</b></td>
                                    <td><span className="status active">{a.status}</span></td>
                                    <td>
                                        <button className="secondary" style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => onDeleteAdmission(a.id, a.admissionNumber)}>
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {page === 'Payments' && (
                    <table>
                        <thead>
                            <tr>
                                <th>Receipt #</th>
                                <th>Student</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr key={p.id}>
                                    <td><b>{p.receiptNumber}</b></td>
                                    <td>{p.admission?.student ? `${p.admission.student.firstName} ${p.admission.student.lastName || ''}`.trim() : '-'}</td>
                                    <td><b>₹{Number(p.amount).toLocaleString()}</b></td>
                                    <td>{p.paymentMethod}</td>
                                    <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                                    <td><span className="status active">{p.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {page === 'Users' && (
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map((u) => (
                                <tr key={u.id}>
                                    <td><b>{u.name}</b></td>
                                    <td>{u.email}</td>
                                    <td>{u.phone || '-'}</td>
                                    <td><span className="status" style={{ background: '#e0f2fe', color: '#0369a1' }}>{u.role}</span></td>
                                    <td><span className={u.isActive ? 'status active' : 'status lost'}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => onEditUser(u)}>
                                                <Edit size={13} /> Edit
                                            </button>
                                            {u.id !== currentUserId && (
                                                <button className="secondary" style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => onDeleteUser(u.id, u.name)}>
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {page === 'Settings' && <SettingsView token={token} />}

                {page === 'Reports' && (
                    <div className="empty" style={{ padding: 40, textAlign: 'center' }}>
                        <div className="emptyicon" style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
                            <BookOpen size={36} />
                        </div>
                        <h2>{page} Module</h2>
                        <p style={{ color: '#64748b', maxWidth: 400, margin: '8px auto' }}>
                            Analytics dashboard compiling leads, conversion rates, and revenue breakdown.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function SettingsView({ token }) {
    const [activeTab, setActiveTab] = useState('Profile');
    const [settingsData, setSettingsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newSourceName, setNewSourceName] = useState('');
    const [saving, setSaving] = useState(false);
    const [profileForm, setProfileForm] = useState({
        instituteName: '',
        tagline: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gstin: '',
        whatsappEnabled: false,
        whatsappApiUrl: '',
        whatsappPhoneNumberId: '',
        whatsappAccessToken: '',
        autoAssignLeads: true
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        setLoading(true);
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/settings', {
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (j.success) {
                setSettingsData(j.data);
                if (j.data.profile) setProfileForm(j.data.profile);
            }
        } catch (e) {
            console.error('fetchSettings error', e);
        } finally {
            setLoading(false);
        }
    }

    async function saveProfileSettings(e) {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(profileForm)
            });
            const j = await res.json();
            if (j.success) alert('Settings saved successfully!');
            else alert(j.message || 'Save failed');
        } catch (e) {
            console.error(e);
            alert('Save failed');
        } finally {
            setSaving(false);
        }
    }

    async function addEnquirySource(e) {
        e.preventDefault();
        if (!newSourceName.trim()) return;
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/settings/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ name: newSourceName.trim() })
            });
            const j = await res.json();
            if (j.success) {
                setNewSourceName('');
                fetchSettings();
            } else {
                alert(j.message || 'Add source failed');
            }
        } catch (e) {
            console.error(e);
            alert('Add source failed');
        }
    }

    async function deleteEnquirySource(id) {
        if (!window.confirm('Delete this enquiry source?')) return;
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/settings/sources/' + id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (j.success) fetchSettings();
            else alert(j.message || 'Delete failed');
        } catch (e) {
            console.error(e);
        }
    }

    if (loading) return <div style={{ padding: 20 }}>Loading CRM settings...</div>;

    return (
        <div className="settings-container">
            {/* Navigation sub-tabs */}
            <div className="settings-nav">
                {['Profile', 'Enquiry Sources', 'WhatsApp & API', 'System Info'].map((tab) => (
                    <button
                        key={tab}
                        className={`settings-nav-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Institute Profile */}
            {activeTab === 'Profile' && (
                <div className="settings-card">
                    <div className="settings-card-header">
                        <h3>Institute Information</h3>
                        <p>Configure public institute details, contact phone, and billing details.</p>
                    </div>
                    <form onSubmit={saveProfileSettings}>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Institute Name</label>
                                <input
                                    value={profileForm.instituteName}
                                    onChange={(e) => setProfileForm({ ...profileForm, instituteName: e.target.value })}
                                    placeholder="CAD Point Training Institute"
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label>Tagline / Subtitle</label>
                                <input
                                    value={profileForm.tagline}
                                    onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                                    placeholder="Premier CAD & BIM Training CRM"
                                />
                            </div>
                            <div className="form-field">
                                <label>Contact Email</label>
                                <input
                                    type="email"
                                    value={profileForm.contactEmail}
                                    onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                                    placeholder="admin@cadpoint.com"
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label>Contact Phone</label>
                                <input
                                    value={profileForm.contactPhone}
                                    onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    required
                                />
                            </div>
                            <div className="form-field full-width">
                                <label>Address</label>
                                <input
                                    value={profileForm.address}
                                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                    placeholder="123 Tech Park, CAD Point Road"
                                />
                            </div>
                            <div className="form-field">
                                <label>City</label>
                                <input
                                    value={profileForm.city}
                                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                                    placeholder="Kochi"
                                />
                            </div>
                            <div className="form-field">
                                <label>State</label>
                                <input
                                    value={profileForm.state}
                                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                                    placeholder="Kerala"
                                />
                            </div>
                            <div className="form-field">
                                <label>Pincode</label>
                                <input
                                    value={profileForm.pincode}
                                    onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                                    placeholder="682001"
                                />
                            </div>
                            <div className="form-field">
                                <label>GSTIN / Tax Registration</label>
                                <input
                                    value={profileForm.gstin}
                                    onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                                    placeholder="32AAAAA0000A1Z5"
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="primary" type="submit" disabled={saving}>
                                {saving ? 'Saving Changes...' : 'Save Profile Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Enquiry Sources */}
            {activeTab === 'Enquiry Sources' && (
                <div className="settings-card">
                    <div className="settings-card-header">
                        <h3>Lead Enquiry Sources</h3>
                        <p>Manage lead acquisition sources used in lead tracking and conversion reports.</p>
                    </div>
                    <form onSubmit={addEnquirySource} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                        <div className="form-field" style={{ flex: 1 }}>
                            <input
                                placeholder="Add new lead source (e.g., Instagram, Trade Fair)"
                                value={newSourceName}
                                onChange={(e) => setNewSourceName(e.target.value)}
                                required
                            />
                        </div>
                        <button className="primary" type="submit" style={{ height: 40 }}>Add Source</button>
                    </form>

                    <table>
                        <thead>
                            <tr>
                                <th>Source Name</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(settingsData?.sources || []).map((s) => (
                                <tr key={s.id}>
                                    <td><b>{s.name}</b></td>
                                    <td><span className="status active">{s.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="secondary" style={{ padding: '4px 10px', fontSize: 11, color: '#dc2626', display: 'inline-flex' }} onClick={() => deleteEnquirySource(s.id)}>
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* WhatsApp Integration */}
            {activeTab === 'WhatsApp & API' && (
                <div className="settings-card">
                    <div className="settings-card-header">
                        <h3>WhatsApp Cloud API Integration</h3>
                        <p>Automate follow-up messages, payment receipts, and fee reminders via Meta WhatsApp API.</p>
                    </div>

                    <form onSubmit={saveProfileSettings}>
                        <div className="toggle-card">
                            <div className="toggle-card-info">
                                <h4>WhatsApp Integration Status</h4>
                                <p>Enable automated messaging to leads and enrolled students</p>
                            </div>
                            <label className="checkbox-label" style={{ margin: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={profileForm.whatsappEnabled}
                                    onChange={(e) => setProfileForm({ ...profileForm, whatsappEnabled: e.target.checked })}
                                />
                                Active
                            </label>
                        </div>

                        <div className="form-grid">
                            <div className="form-field full-width">
                                <label>Meta Graph API Base URL</label>
                                <input
                                    value={profileForm.whatsappApiUrl}
                                    onChange={(e) => setProfileForm({ ...profileForm, whatsappApiUrl: e.target.value })}
                                    placeholder="https://graph.facebook.com/v18.0/"
                                />
                                <small>Meta Graph API version endpoint</small>
                            </div>

                            <div className="form-field">
                                <label>Phone Number ID</label>
                                <input
                                    value={profileForm.whatsappPhoneNumberId}
                                    onChange={(e) => setProfileForm({ ...profileForm, whatsappPhoneNumberId: e.target.value })}
                                    placeholder="1092837465"
                                />
                                <small>Unique Meta Phone Number ID</small>
                            </div>

                            <div className="form-field">
                                <label>System Access Token</label>
                                <input
                                    type="password"
                                    value={profileForm.whatsappAccessToken}
                                    onChange={(e) => setProfileForm({ ...profileForm, whatsappAccessToken: e.target.value })}
                                    placeholder="••••••••••••••••••••"
                                />
                                <small>Permanent System User Access Token</small>
                            </div>
                        </div>

                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="primary" type="submit" disabled={saving}>
                                {saving ? 'Saving Settings...' : 'Save API Integration'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* System Info */}
            {activeTab === 'System Info' && (
                <div className="settings-card">
                    <div className="settings-card-header">
                        <h3>System & Environment Diagnostics</h3>
                        <p>Runtime version information and database connection details.</p>
                    </div>
                    <div className="form-grid">
                        <div className="form-field">
                            <label>CRM Application</label>
                            <input value="CAD Point CRM v1.0.0" disabled style={{ background: '#f8fafc' }} />
                        </div>
                        <div className="form-field">
                            <label>Node.js Runtime</label>
                            <input value={settingsData?.system?.nodeVersion || 'v22.18.0'} disabled style={{ background: '#f8fafc' }} />
                        </div>
                        <div className="form-field">
                            <label>Database Engine</label>
                            <input value={settingsData?.system?.database || 'PostgreSQL (cadpoint_crm)'} disabled style={{ background: '#f8fafc' }} />
                        </div>
                        <div className="form-field">
                            <label>Active API Port</label>
                            <input value={String(settingsData?.system?.port || 5001)} disabled style={{ background: '#f8fafc' }} />
                        </div>
                        <div className="form-field">
                            <label>Environment</label>
                            <input value={settingsData?.system?.environment || 'development'} disabled style={{ background: '#f8fafc' }} />
                        </div>
                        <div className="form-field">
                            <label>JWT Session Expiry</label>
                            <input value="8 Hours" disabled style={{ background: '#f8fafc' }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

createRoot(document.getElementById('root')).render(<App />);
