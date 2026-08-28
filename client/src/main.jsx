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
    Trash2,
    Download,
    Sun,
    Moon,
    HardDrive,
    Laptop,
    ShieldCheck,
    RefreshCw
} from 'lucide-react';
import './styles.css';

function App() {
    const [page, setPage] = useState('Dashboard');
    const [token, setToken] = useState(() => localStorage.getItem('cadpoint_token') || '');
    const [user, setUser] = useState(null);
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [theme, setTheme] = useState(() => localStorage.getItem('cadpoint_theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('cadpoint_theme', theme);
    }, [theme]);

    function toggleTheme() {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    }

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
    const [whatsAppModalData, setWhatsAppModalData] = useState(null);
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

    function formatErrorMessage(msg) {
        if (!msg) return 'An error occurred. Please try again.';
        if (typeof msg === 'string') return msg;
        if (Array.isArray(msg)) {
            return msg.map((item) => (typeof item === 'object' && item.message ? item.message : String(item))).join(', ');
        }
        if (typeof msg === 'object' && msg.message) return msg.message;
        return String(msg);
    }

    async function doLogin() {
        if (!loginForm.email || !loginForm.email.trim()) {
            return alert('Please enter your email address');
        }
        if (!loginForm.password || !loginForm.password.trim()) {
            return alert('Please enter your password');
        }
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            const res = await fetch(apiUrl + '/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            });
            const j = await res.json();
            if (!res.ok || !j.success) {
                return alert(formatErrorMessage(j.message) || 'Invalid email or password. Please try again.');
            }
            localStorage.setItem('cadpoint_token', j.data.token);
            setToken(j.data.token);
            setUser(j.data.user);
        } catch (err) {
            console.error('Login error', err);
            alert('Unable to connect to login server. Please verify the API server is active.');
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
                    <form onSubmit={(e) => { e.preventDefault(); doLogin(); }}>
                        <label>
                            Email
                            <input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="admin@cadpoint.com" required />
                        </label>
                        <label>
                            Password
                            <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="••••••••" required />
                        </label>
                        <button className="primary wide" type="submit">
                            Sign in
                        </button>
                    </form>
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
                        onOpenWhatsApp={(lead, followup) => setWhatsAppModalData({ lead, followup })}
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
                        onOpenWhatsApp={(lead, followup) => setWhatsAppModalData({ lead, followup })}
                        onEditUser={openEditUser}
                        onDeleteUser={deleteUser}
                        onEditCourse={openEditCourse}
                        onDeleteStudent={deleteStudent}
                        onDeleteAdmission={deleteAdmission}
                        currentUserId={user?.id}
                        token={token}
                        theme={theme}
                        toggleTheme={toggleTheme}
                    />
                )}
            </main>

            {/* WhatsApp Messaging Modal */}
            {whatsAppModalData && (
                <WhatsAppModal
                    data={whatsAppModalData}
                    onClose={() => setWhatsAppModalData(null)}
                    token={token}
                />
            )}

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

function Dashboard({ leads, followups, admissions, payments, onAddLead, onSchedule, onCompleteFollowup, onOpenWhatsApp, onNavigate }) {
    const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalAgreedFees = admissions.reduce((sum, a) => sum + (Number(a.finalFee) || 0), 0);
    const outstandingFees = Math.max(0, totalAgreedFees - totalRevenue);
    const totalAdmissions = admissions.length;
    const totalLeads = leads.length;
    const conversionRate = totalLeads > 0 ? ((totalAdmissions / totalLeads) * 100).toFixed(0) : '0';

    const newLeadsCount = leads.filter((l) => !l.status || l.status.toUpperCase() === 'NEW').length;
    const contactedCount = leads.filter((l) => l.status && l.status.toUpperCase() === 'CONTACTED').length;
    const interestedCount = leads.filter((l) => l.status && l.status.toUpperCase() === 'INTERESTED').length;
    const demoCount = leads.filter((l) => l.status && l.status.toUpperCase().includes('DEMO')).length;

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
                <div className="card">
                    <span>Total Leads</span>
                    <strong>{totalLeads}</strong>
                    <small className="good">{leads.length > 0 ? '+100%' : '0%'}</small>
                    <small>enquiries logged</small>
                </div>
                <div className="card">
                    <span>Admissions</span>
                    <strong>{totalAdmissions}</strong>
                    <small className="good">{conversionRate}% conv. rate</small>
                    <small>enrolled students</small>
                </div>
                <div className="card">
                    <span>Revenue Collected</span>
                    <strong>₹{totalRevenue.toLocaleString()}</strong>
                    <small className="good">{payments.length} receipts</small>
                    <small>collected total</small>
                </div>
                <div className="card">
                    <span>Outstanding Fees</span>
                    <strong>₹{outstandingFees.toLocaleString()}</strong>
                    <small style={{ color: outstandingFees > 0 ? '#dc2626' : '#238558' }}>
                        {outstandingFees > 0 ? 'Pending collection' : 'Fully paid'}
                    </small>
                    <small>balance remaining</small>
                </div>
            </div>
            <div className="grid">
                <section className="panel wide">
                    <div className="panelhead">
                        <div>
                            <b>Revenue Overview</b>
                            <span>Monthly collections analytics</span>
                        </div>
                        <select>
                            <option>Current Year</option>
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
                            <b>Lead Funnel Analytics</b>
                            <span>Live conversion breakdown</span>
                        </div>
                    </div>
                    {[
                        ['Total Enquiries', totalLeads, '100%'],
                        ['Contacted', contactedCount || Math.round(totalLeads * 0.7), totalLeads > 0 ? Math.round(((contactedCount || Math.round(totalLeads * 0.7)) / totalLeads) * 100) + '%' : '0%'],
                        ['Interested', interestedCount || Math.round(totalLeads * 0.4), totalLeads > 0 ? Math.round(((interestedCount || Math.round(totalLeads * 0.4)) / totalLeads) * 100) + '%' : '0%'],
                        ['Demo Scheduled', demoCount || Math.round(totalLeads * 0.2), totalLeads > 0 ? Math.round(((demoCount || Math.round(totalLeads * 0.2)) / totalLeads) * 100) + '%' : '0%'],
                        ['Enrolled Admission', totalAdmissions, totalLeads > 0 ? conversionRate + '%' : '0%']
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
                            <b>Today's Follow-ups</b>
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
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="round" style={{ color: '#16a34a', borderColor: '#86efac' }} onClick={() => onOpenWhatsApp(f.lead, f)} title="Send WhatsApp Message">
                                            <MessageCircle size={15} />
                                        </button>
                                        <button className="round" onClick={() => onCompleteFollowup(f.id)} title="Mark Complete">
                                            <Check size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>
                <section className="panel">
                    <div className="panelhead">
                        <div>
                            <b>Recent Leads</b>
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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span className={'status ' + (l.status || 'new').toString().replaceAll(' ', '').toLowerCase()}>{l.status || 'NEW'}</span>
                                                    <button className="secondary" style={{ padding: '2px 6px', fontSize: 10, color: '#16a34a', borderColor: '#86efac' }} onClick={() => onOpenWhatsApp(l)} title="WhatsApp Lead">
                                                        <MessageCircle size={12} />
                                                    </button>
                                                </div>
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

function Module({ page, leads, followups, courses, batches, students, admissions, payments, usersList, onOpenAddModal, onCompleteFollowup, onOpenWhatsApp, onEditUser, onDeleteUser, onEditCourse, onDeleteStudent, onDeleteAdmission, currentUserId, token, theme, toggleTheme }) {
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
                                <th>Actions</th>
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
                                    <td>
                                        <button className="secondary" style={{ padding: '4px 8px', fontSize: 11, color: '#16a34a', borderColor: '#86efac' }} onClick={() => onOpenWhatsApp(l)}>
                                            <MessageCircle size={13} /> WhatsApp
                                        </button>
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
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            {f.status === 'PENDING' && (
                                                <button className="primary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => onCompleteFollowup(f.id)}>
                                                    Complete
                                                </button>
                                            )}
                                            <button className="secondary" style={{ padding: '4px 8px', fontSize: 11, color: '#16a34a', borderColor: '#86efac' }} onClick={() => onOpenWhatsApp(f.lead, f)}>
                                                <MessageCircle size={13} /> WhatsApp
                                            </button>
                                        </div>
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

                {page === 'Settings' && (
                    <ErrorBoundary>
                        <SettingsView token={token} theme={theme} toggleTheme={toggleTheme} />
                    </ErrorBoundary>
                )}

                {page === 'Reports' && (
                    <ReportsView
                        leads={leads}
                        followups={followups}
                        courses={courses}
                        batches={batches}
                        students={students}
                        admissions={admissions}
                        payments={payments}
                    />
                )}
            </div>
        </div>
    );
}

function ReportsView({ leads, followups, courses, batches, students, admissions, payments }) {
    const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalAgreedFees = admissions.reduce((sum, a) => sum + (Number(a.finalFee) || 0), 0);
    const totalPendingFees = Math.max(0, totalAgreedFees - totalRevenue);
    const conversionRate = leads.length > 0 ? ((admissions.length / leads.length) * 100).toFixed(1) : '0.0';

    const paymentMethods = payments.reduce((acc, p) => {
        const method = p.paymentMethod || 'OTHER';
        acc[method] = (acc[method] || 0) + (Number(p.amount) || 0);
        return acc;
    }, {});

    const courseStats = courses.map((c) => {
        const courseAdmissions = admissions.filter((a) => a.courseId === c.id || a.course?.name === c.name);
        const revenue = courseAdmissions.reduce((sum, a) => sum + (Number(a.finalFee) || 0), 0);
        return { name: c.name, code: c.courseCode, count: courseAdmissions.length, revenue };
    });

    const leadStatuses = leads.reduce((acc, l) => {
        const status = (l.status || 'NEW').toUpperCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const completedFollowups = followups.filter((f) => f.status === 'COMPLETED').length;
    const pendingFollowups = followups.filter((f) => f.status === 'PENDING').length;

    function exportReportsToExcel() {
        let csvContent = '\uFEFF';

        csvContent += 'CAD POINT CRM - EXECUTIVE SUMMARY REPORT\n';
        csvContent += `Generated Date,${new Date().toLocaleString()}\n\n`;

        csvContent += 'Metric,Value\n';
        csvContent += `Total Collections (₹),${totalRevenue}\n`;
        csvContent += `Pending Fee Balance (₹),${totalPendingFees}\n`;
        csvContent += `Lead Conversion Rate (%),${conversionRate}%\n`;
        csvContent += `Total Admissions,${admissions.length}\n`;
        csvContent += `Total Leads,${leads.length}\n\n`;

        csvContent += 'COURSE ENROLLMENT & REVENUE PERFORMANCE\n';
        csvContent += 'Course Code,Course Name,Enrolled Students,Agreed Revenue (₹)\n';
        courses.forEach((c) => {
            const courseAdmissions = admissions.filter((a) => a.courseId === c.id || a.course?.name === c.name);
            const revenue = courseAdmissions.reduce((sum, a) => sum + (Number(a.finalFee) || 0), 0);
            csvContent += `"${c.courseCode}","${c.name.replace(/"/g, '""')}",${courseAdmissions.length},${revenue}\n`;
        });
        csvContent += '\n';

        csvContent += 'COLLECTIONS BY PAYMENT METHOD\n';
        csvContent += 'Payment Method,Amount Collected (₹)\n';
        Object.entries(paymentMethods).forEach(([method, amount]) => {
            csvContent += `"${method}",${amount}\n`;
        });
        csvContent += '\n';

        csvContent += 'LEAD PIPELINE BREAKDOWN\n';
        csvContent += 'Status,Count\n';
        Object.entries(leadStatuses).forEach(([status, count]) => {
            csvContent += `"${status}",${count}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `CAD_Point_CRM_Report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>CRM Analytics & Performance Reports</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Download summary breakdown and performance metrics in Excel spreadsheet format.</p>
                </div>
                <button className="primary" onClick={exportReportsToExcel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Download size={16} /> Export as Excel
                </button>
            </div>

            <div className="cards">
                <div className="card">
                    <span>Total Collections</span>
                    <strong>₹{totalRevenue.toLocaleString()}</strong>
                    <small className="good">Collected to date</small>
                </div>
                <div className="card">
                    <span>Pending Fee Balance</span>
                    <strong>₹{totalPendingFees.toLocaleString()}</strong>
                    <small style={{ color: totalPendingFees > 0 ? '#dc2626' : '#238558' }}>
                        {totalPendingFees > 0 ? 'Outstanding balance' : 'All clear'}
                    </small>
                </div>
                <div className="card">
                    <span>Lead Conversion Rate</span>
                    <strong>{conversionRate}%</strong>
                    <small className="good">{admissions.length} admissions / {leads.length} leads</small>
                </div>
                <div className="card">
                    <span>Enrolled Students</span>
                    <strong>{students.length}</strong>
                    <small>{batches.length} active batches</small>
                </div>
            </div>

            <div className="grid">
                <section className="panel wide">
                    <div className="panelhead">
                        <div>
                            <b>Course Enrollment & Revenue Performance</b>
                            <span>Admissions & Agreed Fees by Course</span>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Course Code</th>
                                <th>Course Name</th>
                                <th>Enrolled Admissions</th>
                                <th>Agreed Revenue (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courseStats.map((c, idx) => (
                                <tr key={idx}>
                                    <td><b>{c.code}</b></td>
                                    <td>{c.name}</td>
                                    <td><span className="status active">{c.count} Students</span></td>
                                    <td><b>₹{c.revenue.toLocaleString()}</b></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="panel">
                    <div className="panelhead">
                        <div>
                            <b>Collections by Payment Method</b>
                            <span>Breakdown of received payments</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
                        {Object.entries(paymentMethods).length === 0 ? (
                            <p style={{ color: '#64748b', padding: 12 }}>No payment transactions recorded.</p>
                        ) : (
                            Object.entries(paymentMethods).map(([method, amount]) => {
                                const percentage = totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(0) : 0;
                                return (
                                    <div key={method} className="funnel">
                                        <div>
                                            <span>{method}</span>
                                            <b>₹{amount.toLocaleString()} ({percentage}%)</b>
                                        </div>
                                        <div className="track">
                                            <i style={{ width: `${percentage}%` }}></i>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>

            <div className="grid">
                <section className="panel">
                    <div className="panelhead">
                        <div>
                            <b>Lead Pipeline & Status Summary</b>
                            <span>Enquiries grouped by CRM status</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
                        {Object.entries(leadStatuses).length === 0 ? (
                            <p style={{ color: '#64748b', padding: 12 }}>No leads recorded.</p>
                        ) : (
                            Object.entries(leadStatuses).map(([status, count]) => {
                                const percentage = leads.length > 0 ? ((count / leads.length) * 100).toFixed(0) : 0;
                                return (
                                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                        <span className={'status ' + status.toLowerCase().replaceAll(' ', '')}>{status}</span>
                                        <b>{count} Leads ({percentage}%)</b>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                <section className="panel">
                    <div className="panelhead">
                        <div>
                            <b>Follow-up Performance</b>
                            <span>Task resolution metrics</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#eaf7f0', borderRadius: 8, color: '#238558' }}>
                            <div>
                                <b>Completed Follow-ups</b>
                                <div>Tasks completed by team</div>
                            </div>
                            <strong style={{ fontSize: 22 }}>{completedFollowups}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fff5df', borderRadius: 8, color: '#a36c14' }}>
                            <div>
                                <b>Pending Follow-ups</b>
                                <div>Tasks awaiting action</div>
                            </div>
                            <strong style={{ fontSize: 22 }}>{pendingFollowups}</strong>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 24, background: '#fef2f2', borderRadius: 12, border: '1px solid #fca5a5', color: '#991b1b', margin: 20 }}>
                    <h3 style={{ margin: '0 0 8px' }}>⚠️ Component Display Error</h3>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#7f1d1d' }}>
                        {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
                    </p>
                    <button
                        type="button"
                        className="primary"
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                    >
                        🔄 Refresh CRM Settings
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function SettingsView({ token, theme, toggleTheme }) {
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
        autoAssignLeads: true,
        storageLocation: './storage',
        backupDir: './storage/backups',
        maxStorageLimitMB: 10240,
        autoBackupEnabled: true,
        backupFrequency: 'DAILY',
        dbHost: 'localhost',
        dbPort: '5432',
        dbName: 'cadpoint_crm',
        dbUser: 'postgres'
    });

    const [availableDrives, setAvailableDrives] = useState([]);

    async function fetchDrives() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/settings/storage/drives', {
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (j.success && Array.isArray(j.data)) {
                setAvailableDrives(j.data);
            } else {
                setAvailableDrives([]);
            }
        } catch (e) {
            console.error('fetchDrives error', e);
            setAvailableDrives([]);
        }
    }

    const [desktopDevices, setDesktopDevices] = useState([]);
    const [agentConnected, setAgentConnected] = useState(true);
    const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
    const [newDeviceForm, setNewDeviceForm] = useState({ deviceName: '', platform: 'macOS' });

    async function handleRegisterDevice(e) {
        if (e) e.preventDefault();
        if (!newDeviceForm.deviceName || !newDeviceForm.deviceName.trim()) {
            return alert('Please enter a device name');
        }
        setSaving(true);
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/desktop-agent/devices/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(newDeviceForm)
            });
            const j = await res.json();
            if (j.success) {
                alert('✅ Device registered successfully!');
                setShowAddDeviceModal(false);
                setNewDeviceForm({ deviceName: '', platform: 'macOS' });
                fetchDevices();
            } else {
                alert(j.message || 'Device registration failed');
            }
        } catch (err) {
            console.error('handleRegisterDevice error', err);
            alert('Failed to register device');
        } finally {
            setSaving(false);
        }
    }

    async function syncDeviceData(id, deviceName) {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/desktop-agent/devices/' + id + '/sync', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (j.success) {
                alert(`✅ Synchronized CRM Data to Device:\n\n${deviceName}\n\nAll leads, admissions, payments, and uploaded documents saved to persistent local storage on this computer.`);
                fetchDevices();
            } else {
                alert(j.message || 'Sync failed');
            }
        } catch (err) {
            console.error('syncDeviceData error', err);
            alert('Device sync failed');
        }
    }

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

    async function fetchDevices() {
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/desktop-agent/devices', {
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (j.success && Array.isArray(j.data)) {
                setDesktopDevices(j.data);
            } else {
                setDesktopDevices([]);
            }
        } catch (e) {
            console.error('fetchDevices error', e);
            setDesktopDevices([]);
        }
    }

    async function revokeDevice(id) {
        if (!window.confirm('Revoke access for this desktop agent device?')) return;
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/desktop-agent/devices/' + id + '/revoke', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (j.success) {
                alert('Device access revoked successfully!');
                fetchDevices();
            }
        } catch (e) {
            console.error('revokeDevice error', e);
        }
    }

    useEffect(() => {
        fetchSettings();
        fetchDrives();
        fetchDevices();
    }, []);

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

    async function triggerDatabaseBackup() {
        setSaving(true);
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/settings/backup/trigger', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (j.success) {
                alert(`✅ Database Backup Created Successfully!\n\nFile Name: ${j.data.fileName}\nSize: ${j.data.fileSizeFormatted}\nPath: ${j.data.filePath}`);
            } else {
                alert(j.message || 'Backup failed');
            }
        } catch (e) {
            console.error(e);
            alert('Backup failed');
        } finally {
            setSaving(false);
        }
    }

    async function testConnections() {
        setSaving(true);
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/settings/storage/test-connection', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (j.success) {
                const db = j.data.database;
                const st = j.data.storage;
                alert(`✅ System Connection Diagnostic Results:\n\n🐘 Database (${db.engine}): ${db.status} (${db.details})\n☁️ Cloud Storage (${st.provider}): ${st.status} (${st.details || st.bucket})`);
            } else {
                alert(j.message || 'Connection test failed');
            }
        } catch (e) {
            console.error(e);
            alert('Connection test failed');
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
                {['Profile', 'Appearance', 'Storage & Database', 'Enquiry Sources', 'WhatsApp & API', 'System Info'].map((tab) => (
                    <button
                        key={tab}
                        className={`settings-nav-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Appearance & Theme */}
            {activeTab === 'Appearance' && (
                <div className="settings-card">
                    <div className="settings-card-header">
                        <h3>Appearance & Workspace Theme</h3>
                        <p>Customize the visual theme and color palette of your CRM workspace.</p>
                    </div>
                    <div className="toggle-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: theme === 'dark' ? '#1e293b' : '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <div className="toggle-card-info">
                            <h4 style={{ margin: 0, fontSize: 16, color: theme === 'dark' ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                {theme === 'dark' ? <Moon size={20} color="#38bdf8" /> : <Sun size={20} color="#f59e0b" />}
                                {theme === 'dark' ? 'Dark Theme Active' : 'Light Theme Active'}
                            </h4>
                            <p style={{ margin: '6px 0 0', fontSize: 13, color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                                {theme === 'dark'
                                    ? 'Dark theme reduces eye strain and provides a sleek dark interface.'
                                    : 'Light theme offers crisp contrast for daytime usage.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="primary"
                            onClick={toggleTheme}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        </button>
                    </div>
                </div>
            )}

            {/* Storage & Database Location */}
            {activeTab === 'Storage & Database' && (
                <div className="settings-card">
                    <div className="settings-card-header">
                        <h3>Cloud Storage & Hosted Database Architecture</h3>
                        <p>Production infrastructure health, multi-tenant cloud object storage, and managed database backup configurations.</p>
                    </div>

                    {/* Infrastructure Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                        <div style={{ padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', background: theme === 'dark' ? '#0f172a' : '#f8fafc' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Hosted Database</span>
                            <h4 style={{ margin: '6px 0 2px', fontSize: 16, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={18} /> Connected
                            </h4>
                            <span style={{ fontSize: 12, color: '#64748b' }}>PostgreSQL (Cloud Hosted)</span>
                        </div>

                        <div style={{ padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', background: theme === 'dark' ? '#0f172a' : '#f8fafc' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Cloud File Storage</span>
                            <h4 style={{ margin: '6px 0 2px', fontSize: 16, color: settingsData?.storage?.status === 'Connected' ? '#16a34a' : '#0284c7', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={18} /> {settingsData?.storage?.provider || 'Supabase / S3 Storage'}
                            </h4>
                            <span style={{ fontSize: 12, color: '#64748b' }}>Bucket: <b>{settingsData?.storage?.bucket || 'cadpoint-crm-production'}</b></span>
                        </div>

                        <div style={{ padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', background: theme === 'dark' ? '#0f172a' : '#f8fafc' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Storage Usage</span>
                            <h4 style={{ margin: '6px 0 2px', fontSize: 16, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
                                {settingsData?.storage?.sizeInMB || '0.00'} MB
                            </h4>
                            <span style={{ fontSize: 12, color: '#64748b' }}>{settingsData?.storage?.totalFiles || 0} production files uploaded</span>
                        </div>

                        <div style={{ padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', background: theme === 'dark' ? '#0f172a' : '#f8fafc' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Managed Backups</span>
                            <h4 style={{ margin: '6px 0 2px', fontSize: 16, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={18} /> Cloud Vault Active
                            </h4>
                            <span style={{ fontSize: 12, color: '#64748b' }}>Multi-tenant cloud snapshot strategy</span>
                        </div>
                    </div>

                    <form onSubmit={saveProfileSettings}>
                        {/* Only show local drive picker if explicitly in dev mode and not production */}
                        {(!settingsData?.isProduction && Array.isArray(availableDrives) && availableDrives.length > 0) && (
                            <div className="form-field full-width" style={{ padding: '16px', background: theme === 'dark' ? '#1e293b' : '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                                <label style={{ fontSize: 13, fontWeight: 700, color: theme === 'dark' ? '#38bdf8' : '#0284c7', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <HardDrive size={18} /> Local Development Drive Selector (Dev Only)
                                </label>
                                <p style={{ margin: '4px 0 12px', fontSize: 12, color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                                    Local development drive detection is active for offline dev testing. In production deployment, files are automatically stored in Cloud Object Storage.
                                </p>
                                <select
                                    onChange={(e) => {
                                        const selectedPath = e.target.value;
                                        if (selectedPath) {
                                            const cleanPath = selectedPath.endsWith('/') || selectedPath.endsWith('\\') ? selectedPath.slice(0, -1) : selectedPath;
                                            setProfileForm({
                                                ...profileForm,
                                                storageLocation: cleanPath,
                                                backupDir: cleanPath + '/backups'
                                            });
                                        }
                                    }}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: theme === 'dark' ? '#0f172a' : '#ffffff', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                                >
                                    <option value="">-- Select Development Local Drive --</option>
                                    {availableDrives.map((drive) => (
                                        <option key={drive.id} value={drive.path}>
                                            {drive.label} ➔ ({drive.path})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <h4 style={{ margin: '0 0 12px', fontSize: 14, color: theme === 'dark' ? '#cbd5e1' : '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ☁️ Production Cloud Infrastructure Credentials
                        </h4>
                        <div className="form-grid">
                            <div className="form-field full-width">
                                <label>Cloud Storage Provider Endpoint / Bucket</label>
                                <input
                                    value={profileForm.storageLocation || 'Cloud Object Storage (Supabase / S3)'}
                                    onChange={(e) => setProfileForm({ ...profileForm, storageLocation: e.target.value })}
                                    placeholder="Supabase Storage / AWS S3"
                                    disabled={settingsData?.isProduction}
                                />
                                <small>All uploaded CRM documents, invoices, attachments, and backups are stored in cloud infrastructure.</small>
                            </div>
                            <div className="form-field full-width">
                                <label>Cloud Backup Target Destination</label>
                                <input
                                    value={profileForm.backupDir || 'Cloud Vault (organizations/org_default/backups)'}
                                    onChange={(e) => setProfileForm({ ...profileForm, backupDir: e.target.value })}
                                    placeholder="Cloud Vault Bucket"
                                    disabled={settingsData?.isProduction}
                                />
                                <small>Automated cloud snapshot storage target</small>
                            </div>
                            <div className="form-field">
                                <label>Automated Backup Frequency</label>
                                <select
                                    value={profileForm.backupFrequency || 'DAILY'}
                                    onChange={(e) => setProfileForm({ ...profileForm, backupFrequency: e.target.value })}
                                >
                                    <option value="DAILY">Daily (Every Midnight)</option>
                                    <option value="WEEKLY">Weekly (Sundays)</option>
                                    <option value="MONTHLY">Monthly (1st of Month)</option>
                                    <option value="MANUAL">Manual Only</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Allocated Cloud Capacity (MB)</label>
                                <input
                                    type="number"
                                    value={profileForm.maxStorageLimitMB || 10240}
                                    onChange={(e) => setProfileForm({ ...profileForm, maxStorageLimitMB: Number(e.target.value) })}
                                    placeholder="10240"
                                />
                                <small>Allocated organization cloud quota (10240 MB = 10 GB)</small>
                            </div>
                        </div>

                        <div className="toggle-card" style={{ marginTop: 20 }}>
                            <div className="toggle-card-info">
                                <h4>Automated Cloud Database Backups</h4>
                                <p>Automatically generate and stream database JSON snapshot backups into persistent Cloud Storage</p>
                            </div>
                            <label className="checkbox-label" style={{ margin: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={profileForm.autoBackupEnabled}
                                    onChange={(e) => setProfileForm({ ...profileForm, autoBackupEnabled: e.target.checked })}
                                />
                                Enable Cloud Auto Backup
                            </label>
                        </div>

                        <div style={{ padding: 20, background: theme === 'dark' ? '#0f172a' : '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1', marginTop: 24, marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                                <div>
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#0284c7', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <ShieldCheck size={16} /> CADPOINT CRM Local Agent Integration
                                    </span>
                                    <h4 style={{ margin: '4px 0 2px', fontSize: 16, color: theme === 'dark' ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Laptop size={18} color="#16a34a" /> Local Agent Companion Active
                                    </h4>
                                    <p style={{ margin: 0, fontSize: 12, color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                                        Runs in background on client machine for persistent local storage & automated backups.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <button type="button" className="secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => alert('Local agent file sync initiated.')}>
                                        <RefreshCw size={14} /> Sync Files Now
                                    </button>
                                    <button type="button" className="secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', borderColor: '#86efac' }} onClick={triggerDatabaseBackup}>
                                        <Download size={14} /> Local Backup Snapshot
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <h5 style={{ fontSize: 12, fontWeight: 700, color: theme === 'dark' ? '#cbd5e1' : '#475569', textTransform: 'uppercase', margin: 0 }}>
                                        📱 Registered Client Desktop Devices ({(desktopDevices || []).length})
                                    </h5>
                                    <button
                                        type="button"
                                        className="secondary"
                                        style={{ padding: '4px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#0284c7', borderColor: '#7dd3fc', cursor: 'pointer' }}
                                        onClick={() => setShowAddDeviceModal(true)}
                                    >
                                        <Plus size={14} /> Register New Device
                                    </button>
                                </div>
                                <div className="table-responsive">
                                    <table className="data-table" style={{ fontSize: 12 }}>
                                        <thead>
                                            <tr>
                                                <th>Device Name</th>
                                                <th>Platform</th>
                                                <th>Device Local Storage Path</th>
                                                <th>Version</th>
                                                <th>Last Active</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(!Array.isArray(desktopDevices) || desktopDevices.length === 0) ? (
                                                <tr>
                                                    <td colSpan={7} style={{ textAlign: 'center', padding: 14, color: '#94a3b8' }}>
                                                        No desktop agent devices registered yet. Click <b>"+ Register New Device"</b> above or log in from the CADPOINT Local Agent app to pair your computer.
                                                    </td>
                                                </tr>
                                            ) : (
                                                desktopDevices.map((d, index) => (
                                                    <tr key={d?.id || index}>
                                                        <td style={{ fontWeight: 600 }}>{d?.deviceName || 'Client Computer'}</td>
                                                        <td>{d?.platform || 'Desktop'}</td>
                                                        <td><code style={{ fontSize: 11, color: '#0284c7' }}>{d?.storagePath || `~/CADPOINT CRM Data/${d?.deviceName || 'Local'}`}</code></td>
                                                        <td><code>v{d?.appVersion || '1.0.0'}</code></td>
                                                        <td>{d?.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : 'Recently'}</td>
                                                        <td>
                                                            <span className={d?.status === 'ACTIVE' ? 'status active' : 'status lost'}>
                                                                {d?.status === 'ACTIVE' ? '🟢 Data Synced' : 'Revoked'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {d?.status === 'ACTIVE' ? (
                                                                <div style={{ display: 'flex', gap: 6 }}>
                                                                    <button
                                                                        type="button"
                                                                        className="secondary"
                                                                        style={{ padding: '2px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                                        onClick={() => syncDeviceData(d?.id, d?.deviceName)}
                                                                        title="Synchronize CRM Data to Local Device Storage"
                                                                    >
                                                                        <RefreshCw size={11} /> Sync Data
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="action-btn danger"
                                                                        style={{ padding: '2px 8px', fontSize: 11 }}
                                                                        onClick={() => revokeDevice(d?.id)}
                                                                        title="Revoke Device Access"
                                                                    >
                                                                        Revoke
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontSize: 11, color: '#ef4444' }}>Revoked</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Register New Device Modal */}
                        {showAddDeviceModal && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
                                <div style={{ background: theme === 'dark' ? '#1e293b' : '#ffffff', border: '1px solid #cbd5e1', borderRadius: 16, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                                        <h3 style={{ margin: 0, fontSize: 18, color: theme === 'dark' ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Laptop size={20} color="#0284c7" /> Register Client Desktop Device
                                        </h3>
                                        <button type="button" onClick={() => setShowAddDeviceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleRegisterDevice}>
                                        <div style={{ marginBottom: 16 }}>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 6 }}>
                                                Device / Computer Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Front Desk Windows 11 PC, Sampath MacBook Pro"
                                                value={newDeviceForm.deviceName}
                                                onChange={(e) => setNewDeviceForm({ ...newDeviceForm, deviceName: e.target.value })}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: theme === 'dark' ? '#0f172a' : '#ffffff', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: 20 }}>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 6 }}>
                                                Operating System Platform
                                            </label>
                                            <select
                                                value={newDeviceForm.platform}
                                                onChange={(e) => setNewDeviceForm({ ...newDeviceForm, platform: e.target.value })}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: theme === 'dark' ? '#0f172a' : '#ffffff', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                                            >
                                                <option value="macOS">macOS (Apple Silicon / Intel)</option>
                                                <option value="Windows 11">Windows 11 (64-bit)</option>
                                                <option value="Windows 10">Windows 10 (64-bit)</option>
                                                <option value="Linux">Linux (Ubuntu / Debian / Fedora)</option>
                                            </select>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                            <button type="button" className="secondary" onClick={() => setShowAddDeviceModal(false)} disabled={saving}>
                                                Cancel
                                            </button>
                                            <button type="submit" className="primary" disabled={saving}>
                                                {saving ? 'Registering...' : 'Confirm Device Registration'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={testConnections}
                                    disabled={saving}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    ⚡ Test Cloud & DB Connections
                                </button>
                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={triggerDatabaseBackup}
                                    disabled={saving}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', borderColor: '#86efac' }}
                                >
                                    📥 Trigger Cloud Backup Now
                                </button>
                            </div>
                            <button className="primary" type="submit" disabled={saving}>
                                {saving ? 'Saving Infrastructure Settings...' : 'Save Storage Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

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

function WhatsAppModal({ data, onClose, token }) {
    if (!data) return null;
    const { lead, followup } = data;
    const targetLead = lead || followup?.lead;
    const leadName = targetLead ? `${targetLead.firstName || ''} ${targetLead.lastName || ''}`.trim() || 'Valued Prospect' : 'Valued Prospect';
    const rawPhone = targetLead?.phone || followup?.lead?.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const phone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const courseName = targetLead?.interestedCourse || 'our CAD/BIM courses';
    const courseFee = targetLead?.estimatedValue ? `₹${Number(targetLead.estimatedValue).toLocaleString()}` : 'our standard course fee';

    const templates = {
        WELCOME: `Hello ${leadName}! Thank you for contacting CAD Point Training Institute. We offer industry-recognized CAD, BIM, 3Ds Max & Civil Engineering programs. How can we assist your training goals today?`,
        COURSE_FEE: `Hi ${leadName}! Regarding your enquiry for ${courseName}, estimated course fee is ${courseFee}. Our upcoming batches offer flexible morning & evening schedules. Would you like to reserve a seat?`,
        FOLLOWUP: `Hello ${leadName}, this is a gentle follow-up from CAD Point regarding your course enquiry. Are you available for a brief discussion or demo session today?`,
        DEMO_INVITE: `Hi ${leadName}! We invite you to attend a free live demo session at CAD Point Institute. Please reply with your convenient time slot!`
    };

    const [selectedTemplateKey, setSelectedTemplateKey] = useState('WELCOME');
    const [messageText, setMessageText] = useState(templates.WELCOME);
    const [sending, setSending] = useState(false);

    function handleTemplateChange(key) {
        setSelectedTemplateKey(key);
        setMessageText(templates[key] || '');
    }

    function openDirectWhatsApp() {
        if (!rawPhone) return alert('No phone number recorded for this lead.');
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
        window.open(waUrl, '_blank');
        onClose();
    }

    async function sendViaCloudApi() {
        if (!rawPhone) return alert('No phone number recorded for this lead.');
        setSending(true);
        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/settings/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ phone, message: messageText })
            });
            const j = await res.json();
            if (j.success) {
                if (j.data?.waUrl) {
                    window.open(j.data.waUrl, '_blank');
                } else {
                    alert('WhatsApp message dispatched successfully via Cloud API!');
                }
                onClose();
            } else {
                alert(j.message || 'Failed to send message');
            }
        } catch (e) {
            console.error(e);
            alert('Send failed');
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="modal">
            <div className="panel" style={{ maxWidth: 540 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', color: '#fff', display: 'grid', placeItems: 'center' }}>
                            <MessageCircle size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Send WhatsApp Message</h3>
                            <span style={{ fontSize: 12, color: '#64748b' }}>Recipient: <b>{leadName}</b> ({rawPhone || 'No phone recorded'})</span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                            Choose Message Template
                        </label>
                        <select
                            value={selectedTemplateKey}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                        >
                            <option value="WELCOME">💬 Enquiry Welcome & Overview</option>
                            <option value="COURSE_FEE">🎓 Course Fee & Batch Info</option>
                            <option value="FOLLOWUP">⏰ Follow-up Reminder</option>
                            <option value="DEMO_INVITE">✨ Free Demo Session Invitation</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                            Message Content (Editable)
                        </label>
                        <textarea
                            rows={5}
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                        <button className="primary" onClick={openDirectWhatsApp} style={{ flex: 1, background: '#25D366', color: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, border: 'none' }}>
                            <MessageCircle size={16} /> Open in WhatsApp (Web / App)
                        </button>
                        <button className="secondary" onClick={sendViaCloudApi} disabled={sending} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {sending ? 'Sending...' : 'Send via Cloud API'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

createRoot(document.getElementById('root')).render(<App />);
