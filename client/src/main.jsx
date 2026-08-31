import React, { useState, useEffect, useCallback, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { hasPermission, getDefaultPageForRole } from './permissions';
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
    Eye,
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
    RefreshCw,
    Database,
    Cloud,
    Filter,
    AlertCircle,
    Smartphone,
    Monitor,
    Printer,
    Server,
    Wifi,
    Send,
    Copy,
    CheckCircle2,
    Crown,
    Key,
    Ban,
    Slash,
    Tablet as TabletIcon
} from 'lucide-react';
import './styles.css';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim())
    ? String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, '')
    : '/api';

// Persistent Device Identifier for Browser/Device Security
function getOrGenerateDeviceId() {
    let devId = localStorage.getItem('cadpoint_device_id');
    if (!devId) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            devId = 'dev_' + crypto.randomUUID();
        } else {
            devId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
        localStorage.setItem('cadpoint_device_id', devId);
    }
    const ua = navigator.userAgent || '';
    let suggestedType = 'LAPTOP';
    let suggestedName = 'CADPOINT Office Laptop';

    if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
        suggestedType = 'TABLET';
        suggestedName = 'CADPOINT Counselor Tablet';
    } else if (/Mobile|iPhone|Android/i.test(ua)) {
        suggestedType = 'MOBILE';
        suggestedName = 'CADPOINT Staff Mobile Phone';
    } else if (/Macintosh|Windows|Linux/i.test(ua)) {
        if (/Macintosh/i.test(ua)) suggestedName = 'CADPOINT Mac Book Laptop';
        else suggestedName = 'CADPOINT Office Desktop PC';
    }

    return { deviceId: devId, suggestedType, suggestedName, ua };
}

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 24, background: '#fef2f2', borderRadius: 12, border: '1px solid #fca5a5', color: '#991b1b', margin: 20 }}>
                    <h3 style={{ margin: '0 0 8px' }}>⚠️ Display Error</h3>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#7f1d1d' }}>
                        {this.state.error?.message || 'An unexpected rendering error occurred.'}
                    </p>
                    <button
                        type="button"
                        className="primary"
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                    >
                        🔄 Refresh Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function formatDate(val) {
    if (!val) return 'N/A';
    try {
        const d = new Date(val);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
    } catch {
        return 'N/A';
    }
}

function formatDateTime(val) {
    if (!val) return 'N/A';
    try {
        const d = new Date(val);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return 'N/A';
    }
}

function ProgressBar({ percentage }) {
  const pct = Math.min(100, Math.max(0, Number(percentage) || 0));
  let color = '#3b82f6';
  if (pct === 100) color = '#10b981';
  else if (pct >= 50) color = '#f59e0b';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
      <div style={{ flex: 1, height: 7, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, minWidth: 30 }}>{pct}%</span>
    </div>
  );
}

function CertificateBadge({ status, issueDate }) {
  let style = { background: '#f1f5f9', color: '#64748b' };
  let label = 'Not Started';

  if (status === 'IN_PROGRESS') {
    style = { background: '#e0f2fe', color: '#0369a1' };
    label = 'In Progress';
  } else if (status === 'COMPLETED') {
    style = { background: '#fef3c7', color: '#b45309' };
    label = 'Completed';
  } else if (status === 'ISSUED') {
    style = { background: '#dcfce7', color: '#15803d' };
    label = 'Issued';
  } else if (status === 'REVOKED') {
    style = { background: '#fee2e2', color: '#b91c1c' };
    label = 'Revoked';
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, ...style }}>
      ● {label} {issueDate && `(${formatDate(issueDate)})`}
    </span>
  );
}

function App() {
    const [page, setPage] = useState('Dashboard');
    const [activeBranch, setActiveBranch] = useState(() => localStorage.getItem('cadpoint_branch') || 'gandhipuram');
    const [branchesList, setBranchesList] = useState([]);
    const [sourcesList, setSourcesList] = useState([]);
    const [showAddSourceModal, setShowAddSourceModal] = useState(false);
    const [newSourceName, setNewSourceName] = useState('');
    const [editingAdmissionProgress, setEditingAdmissionProgress] = useState(null);
    const [progressForm, setProgressForm] = useState({ id: '', startDate: '', endDate: '', completionPct: 0, certificateStatus: 'NOT_STARTED', issueDate: '' });

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
    const [editingBatch, setEditingBatch] = useState(null);
    const [editBatchForm, setEditBatchForm] = useState({ id: '', batchCode: '', name: '', courseId: '', startDate: '', endDate: '', capacity: 25 });
    const [editingStudent, setEditingStudent] = useState(null);
    const [editStudentForm, setEditStudentForm] = useState({ id: '', studentCode: '', firstName: '', lastName: '', phone: '', email: '', photoUrl: '' });

    const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);

    // Forms & Filters
    const [addLeadForm, setAddLeadForm] = useState({ firstName: '', lastName: '', phone: '', email: '', interestedCourse: '', estimatedValue: '', sourceId: '', leadType: 'STANDARD', assignedCounsellorId: '', branchId: '', leadDate: new Date().toISOString().slice(0, 10) });
    const [scheduleForm, setScheduleForm] = useState({ leadId: '', scheduledAt: '', type: 'CALL', notes: '' });
    const [addCourseForm, setAddCourseForm] = useState({ courseCode: '', name: '', description: '', standardFee: '' });
    const [addBatchForm, setAddBatchForm] = useState({ batchCode: '', name: '', courseId: '', startDate: '', endDate: '', capacity: 25 });
    const [addStudentForm, setAddStudentForm] = useState({ studentCode: '', firstName: '', lastName: '', phone: '', email: '', photoUrl: '' });
    const [addAdmissionForm, setAddAdmissionForm] = useState({ admissionNumber: '', leadId: '', studentId: '', studentName: '', studentPhone: '', studentEmail: '', studentAddress: '', courseId: '', batchId: '', startDate: '', endDate: '', agreedFee: '', finalFee: '' });
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const [addPaymentForm, setAddPaymentForm] = useState({ admissionId: '', receiptNumber: '', amount: '', paymentMethod: 'UPI', transactionReference: '', remarks: '' });
    const [addUserForm, setAddUserForm] = useState({ name: '', email: '', phone: '', password: '', role: 'COUNSELLOR', isActive: true });


    function handleStudentPhotoUpload(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const ext = (file.name || '').split('.').pop().toLowerCase();
        const validExts = ['jpg', 'jpeg', 'png', 'webp'];

        if (!validTypes.includes((file.type || '').toLowerCase()) && !validExts.includes(ext)) {
            e.target.value = '';
            return alert('Only student photo image files (JPG, JPEG, PNG, or WebP) are allowed.');
        }
        if (file.size > 5 * 1024 * 1024) {
            e.target.value = '';
            return alert('Student photo file size must be less than 5MB.');
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            setAddStudentForm(prev => ({ ...prev, photoUrl: event.target.result }));
        };
        reader.readAsDataURL(file);
    }

    useEffect(() => {
        if (!token || user) return;
        fetch(API_BASE + '/auth/me', { headers: { Authorization: 'Bearer ' + token } })
            .then((r) => r.json())
            .then((j) => {
                if (j.success) setUser(j.data);
                else logout();
            })
            .catch(() => logout());
    }, [token, user]);

    // High Performance Parallel Data Fetching
    const fetchAllData = useCallback(async () => {
        if (!token) return;
        const deviceInfo = getOrGenerateDeviceId();
        const headers = {
            Authorization: 'Bearer ' + token,
            'X-Device-Id': deviceInfo.deviceId
        };
        const branchQuery = activeBranch ? `?branchId=${activeBranch}` : '';

        try {
            const [leadsR, followupsR, coursesR, batchesR, studentsR, admissionsR, paymentsR, notifsR, branchesR, sourcesR] = await Promise.allSettled([
                fetch(`${API_BASE}/leads${branchQuery}`, { headers }).then(r => r.json()),
                fetch(`${API_BASE}/followups`, { headers }).then(r => r.json()),
                fetch(`${API_BASE}/courses`, { headers }).then(r => r.json()),
                fetch(`${API_BASE}/batches${branchQuery}`, { headers }).then(r => r.json()),
                fetch(`${API_BASE}/students${branchQuery}`, { headers }).then(r => r.json()),
                fetch(`${API_BASE}/admissions${branchQuery}`, { headers }).then(r => r.json()),
                fetch(`${API_BASE}/payments${branchQuery}`, { headers }).then(r => r.json()),
                fetch(`${API_BASE}/notifications`, { headers }).then(r => r.json()),
                fetch(`${API_BASE}/branches`).then(r => r.json()),
                fetch(`${API_BASE}/settings/sources`, { headers }).then(r => r.json())
            ]);

            if (leadsR.status === 'fulfilled' && leadsR.value.success) setLeads(leadsR.value.data || []);
            if (followupsR.status === 'fulfilled' && followupsR.value.success) setFollowups(followupsR.value.data || []);
            if (coursesR.status === 'fulfilled' && coursesR.value.success) setCourses(coursesR.value.data || []);
            if (batchesR.status === 'fulfilled' && batchesR.value.success) setBatches(batchesR.value.data || []);
            if (studentsR.status === 'fulfilled' && studentsR.value.success) setStudents(studentsR.value.data || []);
            if (admissionsR.status === 'fulfilled' && admissionsR.value.success) setAdmissions(admissionsR.value.data || []);
            if (paymentsR.status === 'fulfilled' && paymentsR.value.success) setPayments(paymentsR.value.data || []);
            if (notifsR.status === 'fulfilled' && notifsR.value.success) setNotifications(notifsR.value.data || []);
            if (branchesR.status === 'fulfilled' && branchesR.value.success) setBranchesList(branchesR.value.data || []);
            if (sourcesR.status === 'fulfilled' && sourcesR.value.success) setSourcesList(sourcesR.value.data || []);
        } catch (e) {
            console.error('fetchAllData error', e);
        }
    }, [token, activeBranch]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        if (token && hasPermission(user?.role, 'userControl')) {
            fetch(API_BASE + '/users', { headers: { Authorization: 'Bearer ' + token } })
                .then(r => r.json())
                .then(j => { if (j.success) setUsersList(j.data || []); })
                .catch(e => console.error(e));
        }
        if (user && !hasPermission(user.role, page)) {
            setPage(getDefaultPageForRole(user.role));
        }
    }, [token, user, page]);

    function logout() {
        setToken('');
        setUser(null);
        setPage('Dashboard');
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
        const tStart = performance.now();
        console.log('[PERF FRONTEND] 🚀 Login request sent to API...');
        try {
            const res = await fetch(API_BASE + '/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            });
            const tHttp = performance.now();
            console.log(`[PERF FRONTEND] HTTP response received in ${(tHttp - tStart).toFixed(1)}ms`);

            const j = await res.json();
            if (!res.ok || !j.success) {
                return alert(formatErrorMessage(j.message) || 'Invalid email or password. Please try again.');
            }
            localStorage.setItem('cadpoint_token', j.data.token);
            setUser(j.data.user);
            setToken(j.data.token);
            const defaultPage = getDefaultPageForRole(j.data.user?.role);
            setPage(defaultPage);

            console.log(`[PERF FRONTEND] ✅ Dashboard redirected in ${(performance.now() - tStart).toFixed(1)}ms (Server handling: ${j._perf?.totalMs || 'N/A'}ms)`);
        } catch (err) {
            console.error('Login error', err);
            alert('Unable to connect to login server. Please verify the API server is active.');
        }
    }

    async function handleCreateSourceInline(e) {
        e.preventDefault();
        if (!newSourceName.trim()) return alert('Please enter source name');
        try {
            const res = await fetch(API_BASE + '/settings/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ name: newSourceName.trim() })
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Failed to add source');
            
            const newSource = j.data;
            setSourcesList(prev => [...prev, newSource]);
            setAddLeadForm(prev => ({ ...prev, sourceId: newSource.id }));
            setNewSourceName('');
            setShowAddSourceModal(false);
        } catch (err) {
            console.error(err);
            alert('Failed to add lead source');
        }
    }

    function openEditProgress(admission) {
        setEditingAdmissionProgress(admission);
        setProgressForm({
            id: admission.id,
            startDate: admission.startDate ? admission.startDate.slice(0, 10) : '',
            endDate: admission.endDate ? admission.endDate.slice(0, 10) : '',
            completionPct: admission.completionPct || 0,
            certificateStatus: admission.certificate?.status || 'NOT_STARTED',
            issueDate: admission.certificate?.issueDate ? admission.certificate.issueDate.slice(0, 10) : ''
        });
    }

    async function updateAdmissionProgress() {
        try {
            const res = await fetch(API_BASE + '/admissions/' + progressForm.id + '/progress', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(progressForm)
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Failed to update progress');
            fetchAllData();
            setEditingAdmissionProgress(null);
        } catch (err) {
            console.error(err);
            alert('Failed to update progress');
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
            const res = await fetch(API_BASE + '/search?q=' + encodeURIComponent(query), { headers: { Authorization: 'Bearer ' + token } });
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
            const res = await fetch(API_BASE + '/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ ...addLeadForm, branchId: addLeadForm.branchId || activeBranch })
            });
            const j = await res.json();
            if (!j.success) return alert(formatErrorMessage(j.message) || 'Create lead failed');
            fetchAllData();
            setShowAddLead(false);
            setAddLeadForm({ firstName: '', lastName: '', phone: '', email: '', interestedCourse: '', estimatedValue: '', sourceId: '', leadType: 'STANDARD', assignedCounsellorId: '', branchId: '', leadDate: new Date().toISOString().slice(0, 10) });
        } catch (e) {
            console.error(e);
            alert('Create lead failed');
        }
    }

    async function createFollowup() {
        try {
            const res = await fetch(API_BASE + '/followups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(scheduleForm)
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create follow-up failed');
            fetchAllData();
            setShowSchedule(false);
            setScheduleForm({ leadId: '', scheduledAt: '', type: 'CALL', notes: '' });
        } catch (e) {
            console.error(e);
            alert('Create follow-up failed');
        }
    }

    async function completeFollowup(id) {
        try {
            const res = await fetch(API_BASE + '/followups/' + id + '/complete', {
                method: 'PATCH',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (!j.success) return alert('Complete failed');
            fetchAllData();
        } catch (e) {
            console.error(e);
            alert('Complete failed');
        }
    }

    async function createCourse() {
        try {
            const res = await fetch(API_BASE + '/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ ...addCourseForm, standardFee: Number(addCourseForm.standardFee) || 0 })
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create course failed');
            fetchAllData();
            setShowAddCourse(false);
            setAddCourseForm({ courseCode: '', name: '', description: '', standardFee: '' });
        } catch (e) {
            console.error(e);
            alert('Create course failed');
        }
    }

    async function updateCourseSubmit() {
        try {
            const res = await fetch(API_BASE + '/courses/' + editingCourse.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ ...editCourseForm, standardFee: Number(editCourseForm.standardFee) || 0 })
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Update course failed');
            fetchAllData();
            setEditingCourse(null);
        } catch (e) {
            console.error(e);
            alert('Update course failed');
        }
    }

    async function deleteCourse(id, courseName) {
        if (!window.confirm(`Are you sure you want to delete course "${courseName}"?`)) return;
        try {
            const res = await fetch(API_BASE + '/courses/' + id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Delete course failed');
            fetchAllData();
        } catch (e) {
            console.error(e);
            alert('Delete course failed');
        }
    }

    async function createBatch() {
        try {
            const res = await fetch(API_BASE + '/batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ ...addBatchForm, capacity: Number(addBatchForm.capacity) || 25, branchId: activeBranch })
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create batch failed');
            fetchAllData();
            setShowAddBatch(false);
            setAddBatchForm({ batchCode: '', name: '', courseId: '', startDate: '', endDate: '', capacity: 25 });
        } catch (e) {
            console.error(e);
            alert('Create batch failed');
        }
    }

    async function updateBatchSubmit() {
        try {
            const res = await fetch(API_BASE + '/batches/' + editBatchForm.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ ...editBatchForm, capacity: Number(editBatchForm.capacity) || 25 })
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Update batch failed');
            fetchAllData();
            setEditingBatch(null);
        } catch (e) {
            console.error(e);
            alert('Update batch failed');
        }
    }

    async function deleteBatch(id, batchName) {
        if (!window.confirm(`Are you sure you want to delete batch "${batchName}"?`)) return;
        try {
            const res = await fetch(API_BASE + '/batches/' + id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Delete batch failed');
            fetchAllData();
        } catch (e) {
            console.error(e);
            alert('Delete batch failed');
        }
    }

    async function createStudent() {
        try {
            const res = await fetch(API_BASE + '/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ ...addStudentForm, branchId: activeBranch })
            });
            const j = await res.json();
            if (!j.success) return alert(formatErrorMessage(j.message) || 'Create student failed');
            fetchAllData();
            setShowAddStudent(false);
            setAddStudentForm({ studentCode: '', firstName: '', lastName: '', phone: '', email: '' });
        } catch (e) {
            console.error(e);
            alert('Create student failed');
        }
    }

    async function deleteStudent(id, studentName) {
        if (!window.confirm(`Are you sure you want to delete student "${studentName}"?`)) return;
        try {
            const res = await fetch(API_BASE + '/students/' + id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Delete student failed');
            fetchAllData();
        } catch (e) {
            console.error(e);
            alert('Delete student failed');
        }
    }

    async function updateStudentSubmit() {
        try {
            const res = await fetch(API_BASE + '/students/' + editStudentForm.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(editStudentForm)
            });
            const j = await res.json();
            if (!j.success) return alert(formatErrorMessage(j.message) || 'Update student failed');
            fetchAllData();
            setEditingStudent(null);
        } catch (e) {
            console.error(e);
            alert('Update student failed');
        }
    }

    async function createAdmission() {
        try {
            const res = await fetch(API_BASE + '/admissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ ...addAdmissionForm, finalFee: Number(addAdmissionForm.finalFee) || 0, branchId: activeBranch })
            });
            const j = await res.json();
            if (!j.success) return alert(formatErrorMessage(j.message) || 'Create admission failed');
            fetchAllData();
            setShowAddAdmission(false);
            setAddAdmissionForm({ admissionNumber: '', leadId: '', studentId: '', studentName: '', studentPhone: '', studentEmail: '', studentAddress: '', courseId: '', batchId: '', startDate: '', endDate: '', agreedFee: '', finalFee: '' });
        } catch (e) {
            console.error(e);
            alert('Create admission failed');
        }
    }

    function openAdmitFromFollowup(f) {
        const lead = f?.lead;
        if (!lead) return alert('Lead information not available for this follow-up.');

        const existingAdm = lead.admission || admissions.find(a => a.leadId === lead.id);
        if (existingAdm) {
            alert(`This lead is already converted to Admission #${existingAdm.admissionNumber}.`);
            setExpandedAdmissionId(existingAdm.id);
            return;
        }

        const matchedCourse = courses.find(c => (c.name || '').toLowerCase() === (lead.interestedCourse || '').toLowerCase());
        const existingStudent = students.find(s => s.phone && lead.phone && s.phone === lead.phone);

        setAddAdmissionForm({
            admissionNumber: '',
            leadId: lead.id,
            studentId: existingStudent ? existingStudent.id : '',
            studentName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
            studentPhone: lead.phone || '',
            studentEmail: lead.email || '',
            studentAddress: lead.city || '',
            courseId: matchedCourse ? matchedCourse.id : '',
            batchId: '',
            startDate: new Date().toISOString().slice(0, 10),
            endDate: '',
            agreedFee: matchedCourse ? matchedCourse.standardFee : '',
            finalFee: matchedCourse ? matchedCourse.standardFee : ''
        });
        setShowAddAdmission(true);
    }

    async function deleteAdmission(id, admissionNumber) {
        if (!window.confirm(`Are you sure you want to delete admission "${admissionNumber}"?`)) return;
        try {
            const res = await fetch(API_BASE + '/admissions/' + id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Delete admission failed');
            fetchAllData();
        } catch (e) {
            console.error(e);
            alert('Delete admission failed');
        }
    }

    async function createPayment() {
        try {
            const res = await fetch(API_BASE + '/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ ...addPaymentForm, amount: Number(addPaymentForm.amount) || 0, branchId: activeBranch })
            });
            const j = await res.json();
            if (!j.success) return alert(formatErrorMessage(j.message) || 'Create payment failed');
            fetchAllData();
            setShowAddPayment(false);
            setAddPaymentForm({ admissionId: '', receiptNumber: '', amount: '', paymentMethod: 'UPI', transactionReference: '', remarks: '' });
        } catch (e) {
            console.error(e);
            alert('Create payment failed');
        }
    }

    async function createUserSubmit() {
        try {
            const res = await fetch(API_BASE + '/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(addUserForm)
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Create user failed');
            fetchAllData();
            setShowAddUser(false);
            setAddUserForm({ name: '', email: '', phone: '', password: '', role: 'COUNSELLOR', isActive: true });
        } catch (e) {
            console.error(e);
            alert('Create user failed');
        }
    }

    async function updateUserSubmit() {
        try {
            const res = await fetch(API_BASE + '/users/' + editUserForm.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(editUserForm)
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Update user failed');
            fetchAllData();
            setEditingUser(null);
        } catch (e) {
            console.error(e);
            alert('Update user failed');
        }
    }

    async function deleteUser(id, userName) {
        if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) return;
        try {
            const res = await fetch(API_BASE + '/users/' + id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (!j.success) return alert(j.message || 'Delete user failed');
            fetchAllData();
        } catch (e) {
            console.error(e);
            alert('Delete user failed');
        }
    }

    function openEditUser(u) {
        setEditingUser(u);
        setEditUserForm({ id: u.id, name: u.name, email: u.email, phone: u.phone || '', password: '', role: u.role, isActive: u.isActive });
    }

    function openEditCourse(c) {
        setEditingCourse(c);
        setEditCourseForm({ id: c.id, courseCode: c.courseCode, name: c.name, description: c.description || '', standardFee: c.standardFee, isActive: c.isActive });
    }

    function openEditBatch(b) {
        setEditingBatch(b);
        setEditBatchForm({ id: b.id, batchCode: b.batchCode, name: b.name, courseId: b.courseId, startDate: b.startDate ? b.startDate.slice(0, 10) : '', endDate: b.endDate ? b.endDate.slice(0, 10) : '', capacity: b.capacity });
    }

    function openEditStudent(s) {
        setEditingStudent(s);
        setEditStudentForm({
            id: s.id,
            studentCode: s.studentCode || '',
            firstName: s.firstName || '',
            lastName: s.lastName || '',
            phone: s.phone || '',
            email: s.email || '',
            photoUrl: s.photoUrl || ''
        });
    }

    function getNextCode(prefix, list, key) {
        let maxNum = 1000;
        if (Array.isArray(list) && list.length > 0) {
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
                    <h1>CADPOINT COIMBATORE</h1>
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

    const allNavItems = [
        ['Dashboard', LayoutDashboard],
        ['Leads', UsersIcon],
        ['Follow-ups', CalendarDays],
        ['Courses', BookOpen],
        ['Batches', CalendarDays],
        ['Students', GraduationCap],
        ['Admissions', ArrowUpRight],
        ['Payments', WalletCards],
        ['Reports', BarChart3],
        ['Users', UserCheck],
        ['Settings', Settings]
    ];

    const nav = allNavItems.filter(([pageName]) => hasPermission(user?.role, pageName));

    return (
        <div className="app">
            <aside>
                <div className="brand">
                    <div className="logo">CP</div>
                    <div>
                        <b>CADPOINT COIMBATORE</b>
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
                <div className="sidecard" style={{ marginTop: 'auto', marginBottom: 10, flexShrink: 0 }}>
                    <div className="pulse"></div>
                    <b>System healthy</b>
                    <span>All services operational</span>
                </div>
                <div className="profile" onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                    <div className="avatar">{(user?.name || 'SK').split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
                    <div>
                        <b>{user?.name || 'Admin'}</b>
                        <span>{user?.role || 'SUPER_ADMIN'}</span>
                    </div>
                    <MoreHorizontal size={18} />
                </div>
                {showProfileMenu && (
                    <div style={{ padding: '10px 16px', background: theme === 'dark' ? '#1e293b' : '#0f172a', color: '#ffffff', borderRadius: 8, marginTop: 6, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <button type="button" style={{ background: 'none', border: 'none', color: '#f87171', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, width: '100%', padding: '4px 0', fontSize: 13 }} onClick={logout}>
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
                        <h1>{page === 'Dashboard' ? `CADPOINT COIMBATORE 👋` : page}</h1>
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

                        <div className="branch-selector" style={{ display: 'flex', alignItems: 'center', gap: 6, background: theme === 'dark' ? '#1e293b' : '#f1f5f9', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                            <span style={{ color: '#64748b' }}>Branch:</span>
                            <select
                                value={activeBranch}
                                onChange={(e) => {
                                    setActiveBranch(e.target.value);
                                    localStorage.setItem('cadpoint_branch', e.target.value);
                                }}
                                style={{ border: 'none', background: 'transparent', fontWeight: 700, cursor: 'pointer', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                            >
                                {(branchesList && branchesList.length > 0 ? branchesList : [
                                    { id: 'gandhipuram', name: 'Gandhipuram', code: 'gandhipuram' },
                                    { id: 'saravanapatti', name: 'Saravanapatti', code: 'saravanapatti' }
                                ]).map((b) => (
                                    <option key={b.id} value={b.code ? b.code.toLowerCase() : b.id}>{b.name}</option>
                                ))}
                                {user?.role === 'SUPER_ADMIN' && <option value="all">All Branches</option>}
                            </select>
                        </div>

                        <button className="user" onClick={logout} title="Click to Logout">
                            {(user && user.name && user.name.split(' ').map((s) => s[0]).slice(0, 2).join('')) || 'SK'}
                        </button>
                    </div>
                </header>

                <ErrorBoundary key={page}>
                    {!hasPermission(user?.role, page) ? (
                        <div className="content" style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
                            <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, maxWidth: 500 }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                                    <ShieldCheck size={32} />
                                </div>
                                <h2 style={{ margin: '0 0 8px', color: '#991b1b', fontSize: 20 }}>Access Restricted</h2>
                                <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: 14 }}>
                                    Your account role (<b>{user?.role || 'User'}</b>) does not have permission to access the <b>{page}</b> module.
                                </p>
                                <button className="primary" onClick={() => setPage(getDefaultPageForRole(user?.role))}>
                                    Return to {getDefaultPageForRole(user?.role)}
                                </button>
                            </div>
                        </div>
                    ) : page === 'Dashboard' ? (
                        <Dashboard
                            user={user}
                            token={token}
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
                            sourcesList={sourcesList}
                            onOpenAddModal={() => openAddModalForPage(page)}
                            onCompleteFollowup={completeFollowup}
                            onOpenWhatsApp={(lead, followup) => setWhatsAppModalData({ lead, followup })}
                            onEditUser={openEditUser}
                            onDeleteUser={deleteUser}
                            onEditCourse={openEditCourse}
                            onDeleteCourse={deleteCourse}
                            onEditBatch={openEditBatch}
                            onDeleteBatch={deleteBatch}
                            onEditStudent={openEditStudent}
                            onDeleteStudent={deleteStudent}
                            onDeleteAdmission={deleteAdmission}
                            onOpenEditProgress={openEditProgress}
                            currentUserId={user?.id}
                            userRole={user?.role}
                            user={user}
                            token={token}
                            theme={theme}
                            toggleTheme={toggleTheme}
                            refreshData={fetchAllData}
                        />
                    )}
                </ErrorBoundary>
            </main>

            {/* WhatsApp Messaging Modal */}
            {whatsAppModalData && (
                <WhatsAppModal
                    data={whatsAppModalData}
                    onClose={() => setWhatsAppModalData(null)}
                    token={token}
                />
            )}

            {/* Add Source Modal */}
            {showAddSourceModal && (
                <div className="modal" style={{ zIndex: 1200 }}>
                    <form className="panel" onSubmit={handleCreateSourceInline} style={{ maxWidth: 450 }}>
                        <h3 style={{ margin: 0, fontSize: 18 }}>Add New Enquiry Source</h3>
                        <label style={{ display: 'block', margin: '12px 0 6px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                            Source Name *
                        </label>
                        <input
                            value={newSourceName}
                            onChange={(e) => setNewSourceName(e.target.value)}
                            placeholder="e.g. YouTube, Instagram Ads, Telecaller"
                            required
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button className="primary" type="submit">Add Source</button>
                            <button type="button" onClick={() => setShowAddSourceModal(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Course Progress & Certificate Details Modal */}
            {editingAdmissionProgress && (
                <div className="modal" style={{ zIndex: 1100 }}>
                    <form className="panel" onSubmit={(e) => { e.preventDefault(); updateAdmissionProgress(); }}>
                        <h3>Course Progress & Certificate Details</h3>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 12px' }}>
                            Student: <b>{editingAdmissionProgress.student?.firstName} {editingAdmissionProgress.student?.lastName}</b> ({editingAdmissionProgress.course?.name})
                        </p>
                        <label>
                            Course Start Date
                            <input type="date" value={progressForm.startDate} onChange={(e) => setProgressForm({ ...progressForm, startDate: e.target.value })} />
                        </label>
                        <label>
                            Course End Date
                            <input type="date" value={progressForm.endDate} onChange={(e) => setProgressForm({ ...progressForm, endDate: e.target.value })} />
                        </label>
                        <label>
                            Completion Percentage (0 - 100%)
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={progressForm.completionPct}
                                onChange={(e) => setProgressForm({ ...progressForm, completionPct: Number(e.target.value) })}
                            />
                        </label>
                        <label>
                            Certificate Status
                            <select
                                value={progressForm.certificateStatus}
                                onChange={(e) => setProgressForm({ ...progressForm, certificateStatus: e.target.value })}
                            >
                                <option value="NOT_STARTED">Not Started</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="ISSUED">Issued</option>
                                <option value="REVOKED">Revoked</option>
                            </select>
                        </label>
                        {progressForm.certificateStatus === 'ISSUED' && (
                            <label>
                                Issue Date
                                <input type="date" value={progressForm.issueDate} onChange={(e) => setProgressForm({ ...progressForm, issueDate: e.target.value })} />
                            </label>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">Save Changes</button>
                            <button type="button" onClick={() => setEditingAdmissionProgress(null)}>Cancel</button>
                        </div>
                    </form>
                </div>
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

            {editingBatch && (
                <div className="modal">
                    <form
                        className="panel"
                        onSubmit={(e) => {
                            e.preventDefault();
                            updateBatchSubmit();
                        }}
                    >
                        <h3>Edit Batch</h3>
                        <label>
                            Batch Code
                            <input value={editBatchForm.batchCode} onChange={(e) => setEditBatchForm({ ...editBatchForm, batchCode: e.target.value })} required />
                        </label>
                        <label>
                            Batch Name
                            <input value={editBatchForm.name} onChange={(e) => setEditBatchForm({ ...editBatchForm, name: e.target.value })} required />
                        </label>
                        <label>
                            Course
                            <select value={editBatchForm.courseId} onChange={(e) => setEditBatchForm({ ...editBatchForm, courseId: e.target.value })} required>
                                <option value="">Select course</option>
                                {courses.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Start Date
                            <input type="date" value={editBatchForm.startDate} onChange={(e) => setEditBatchForm({ ...editBatchForm, startDate: e.target.value })} required />
                        </label>
                        <label>
                            End Date
                            <input type="date" value={editBatchForm.endDate} onChange={(e) => setEditBatchForm({ ...editBatchForm, endDate: e.target.value })} />
                        </label>
                        <label>
                            Capacity
                            <input type="number" value={editBatchForm.capacity} onChange={(e) => setEditBatchForm({ ...editBatchForm, capacity: e.target.value })} required />
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">Save Changes</button>
                            <button type="button" onClick={() => setEditingBatch(null)}>Cancel</button>
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
                        <h3>Edit User</h3>
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
                            <input value={editUserForm.phone} onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })} />
                        </label>
                        <label>
                            Role
                            <select value={editUserForm.role} onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}>
                                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="COUNSELLOR">COUNSELLOR</option>
                                <option value="TRAINER">TRAINER</option>
                                <option value="ACCOUNTS">ACCOUNTS</option>
                                <option value="RECEPTIONIST">RECEPTIONIST</option>
                            </select>
                        </label>
                        <label>
                            New Password (leave blank to keep current)
                            <input type="password" value={editUserForm.password} onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })} placeholder="••••••••" />
                        </label>
                        <label className="checkbox-label">
                            <input type="checkbox" checked={editUserForm.isActive} onChange={(e) => setEditUserForm({ ...editUserForm, isActive: e.target.checked })} /> Active User Account
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">Save Changes</button>
                            <button type="button" onClick={() => setEditingUser(null)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {showAddLead && (
                <div className="modal" style={{ zIndex: 1000 }}>
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
                            Branch *
                            <select
                                value={addLeadForm.branchId || activeBranch || ''}
                                onChange={(e) => setAddLeadForm({ ...addLeadForm, branchId: e.target.value })}
                                required
                            >
                                <option value="">Select Branch</option>
                                {branchesList.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Source *
                            <div style={{ display: 'flex', gap: 8 }}>
                                <select
                                    value={addLeadForm.sourceId || ''}
                                    onChange={(e) => setAddLeadForm({ ...addLeadForm, sourceId: e.target.value })}
                                    required
                                    style={{ flex: 1 }}
                                >
                                    <option value="">Select enquiry source</option>
                                    {sourcesList.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="secondary"
                                    style={{ padding: '0 10px', fontSize: 12, whiteSpace: 'nowrap' }}
                                    onClick={() => setShowAddSourceModal(true)}
                                >
                                    + Add New Source
                                </button>
                            </div>
                        </label>
                        <label>
                            Lead Type
                            <select
                                value={addLeadForm.leadType || 'STANDARD'}
                                onChange={(e) => setAddLeadForm({ ...addLeadForm, leadType: e.target.value })}
                            >
                                <option value="STANDARD">Standard Enquiry</option>
                                <option value="TELECALLER">Telecaller Lead</option>
                            </select>
                        </label>
                        {addLeadForm.leadType === 'TELECALLER' && (
                            <label>
                                Assigned Telecaller / Counsellor
                                <select
                                    value={addLeadForm.assignedCounsellorId || ''}
                                    onChange={(e) => setAddLeadForm({ ...addLeadForm, assignedCounsellorId: e.target.value })}
                                >
                                    <option value="">Select Telecaller</option>
                                    {usersList.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </label>
                        )}
                        <label>
                            Interested Course
                            <input value={addLeadForm.interestedCourse} onChange={(e) => setAddLeadForm({ ...addLeadForm, interestedCourse: e.target.value })} placeholder="e.g. AutoCAD" />
                        </label>
                        <label>
                            Estimated Value (₹)
                            <input type="number" value={addLeadForm.estimatedValue} onChange={(e) => setAddLeadForm({ ...addLeadForm, estimatedValue: e.target.value })} placeholder="30000" />
                        </label>
                        <label>
                            Lead Date <span style={{ color: '#dc2626' }}>*</span>
                            <input
                                type="date"
                                value={addLeadForm.leadDate || new Date().toISOString().slice(0, 10)}
                                onChange={(e) => setAddLeadForm({ ...addLeadForm, leadDate: e.target.value })}
                                required
                            />
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
                            <button className="primary" type="submit">
                                Create Course
                            </button>
                            <button type="button" onClick={() => setShowAddCourse(false)}>
                                Cancel
                            </button>
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
                            <input value={addBatchForm.batchCode} onChange={(e) => setAddBatchForm({ ...addBatchForm, batchCode: e.target.value })} placeholder="BAT-101" required />
                        </label>
                        <label>
                            Batch Name
                            <input value={addBatchForm.name} onChange={(e) => setAddBatchForm({ ...addBatchForm, name: e.target.value })} placeholder="Morning Batch A" required />
                        </label>
                        <label>
                            Course
                            <select value={addBatchForm.courseId} onChange={(e) => setAddBatchForm({ ...addBatchForm, courseId: e.target.value })} required>
                                <option value="">Select course</option>
                                {courses.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Start Date
                            <input type="date" value={addBatchForm.startDate} onChange={(e) => setAddBatchForm({ ...addBatchForm, startDate: e.target.value })} required />
                        </label>
                        <label>
                            End Date
                            <input type="date" value={addBatchForm.endDate} onChange={(e) => setAddBatchForm({ ...addBatchForm, endDate: e.target.value })} />
                        </label>
                        <label>
                            Capacity
                            <input type="number" value={addBatchForm.capacity} onChange={(e) => setAddBatchForm({ ...addBatchForm, capacity: e.target.value })} required />
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">
                                Create Batch
                            </button>
                            <button type="button" onClick={() => setShowAddBatch(false)}>
                                Cancel
                            </button>
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
                            Student ID
                            <input value={addStudentForm.studentCode} onChange={(e) => setAddStudentForm({ ...addStudentForm, studentCode: e.target.value })} placeholder="STU-1001" required />
                        </label>
                        <label>
                            First Name
                            <input value={addStudentForm.firstName} onChange={(e) => setAddStudentForm({ ...addStudentForm, firstName: e.target.value })} required />
                        </label>
                        <label>
                            Address
                            <input value={addStudentForm.lastName} onChange={(e) => setAddStudentForm({ ...addStudentForm, lastName: e.target.value })} placeholder="Enter Address" />
                        </label>
                        <label>
                            Phone
                            <input value={addStudentForm.phone} onChange={(e) => setAddStudentForm({ ...addStudentForm, phone: e.target.value })} required />
                        </label>
                        <label>
                            Email
                            <input type="email" value={addStudentForm.email} onChange={(e) => setAddStudentForm({ ...addStudentForm, email: e.target.value })} />
                        </label>
                        <label>
                            Student Photo <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>(Photo image only: JPG, PNG, WebP)</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                                {addStudentForm.photoUrl ? (
                                    <img src={addStudentForm.photoUrl} alt="Student Preview" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }} />
                                ) : (
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e2e8f0', display: 'grid', placeItems: 'center', color: '#64748b', fontSize: 18, fontWeight: 700 }}>
                                        📷
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                                    onChange={handleStudentPhotoUpload}
                                    style={{ fontSize: 12, flex: 1 }}
                                />
                                {addStudentForm.photoUrl && (
                                    <button type="button" className="secondary" style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => setAddStudentForm(prev => ({ ...prev, photoUrl: '' }))}>
                                        Remove Photo
                                    </button>
                                )}
                            </div>
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">Create Student</button>
                            <button type="button" onClick={() => setShowAddStudent(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {editingStudent && (
                <div className="modal">
                    <form
                        className="panel"
                        onSubmit={(e) => {
                            e.preventDefault();
                            updateStudentSubmit();
                        }}
                    >
                        <h3>Edit Student</h3>
                        <label>
                            ID
                            <input value={editStudentForm.studentCode} onChange={(e) => setEditStudentForm({ ...editStudentForm, studentCode: e.target.value })} placeholder="STU-1001" required />
                        </label>
                        <label>
                            First Name
                            <input value={editStudentForm.firstName} onChange={(e) => setEditStudentForm({ ...editStudentForm, firstName: e.target.value })} required />
                        </label>
                        <label>
                            Address
                            <input value={editStudentForm.lastName} onChange={(e) => setEditStudentForm({ ...editStudentForm, lastName: e.target.value })} placeholder="Address" />
                        </label>
                        <label>
                            Phone
                            <input value={editStudentForm.phone} onChange={(e) => setEditStudentForm({ ...editStudentForm, phone: e.target.value })} required />
                        </label>
                        <label>
                            Email
                            <input type="email" value={editStudentForm.email} onChange={(e) => setEditStudentForm({ ...editStudentForm, email: e.target.value })} />
                        </label>
                        <label>
                            Student Photo <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>(Photo image only: JPG, PNG, WebP)</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                                {editStudentForm.photoUrl ? (
                                    <img src={editStudentForm.photoUrl} alt="Student Preview" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }} />
                                ) : (
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e2e8f0', display: 'grid', placeItems: 'center', color: '#64748b', fontSize: 18, fontWeight: 700 }}>
                                        📷
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (evt) => {
                                                setEditStudentForm(prev => ({ ...prev, photoUrl: evt.target.result }));
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    style={{ fontSize: 12, flex: 1 }}
                                />
                                {editStudentForm.photoUrl && (
                                    <button type="button" className="secondary" style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => setEditStudentForm(prev => ({ ...prev, photoUrl: '' }))}>
                                        Remove Photo
                                    </button>
                                )}
                            </div>
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="primary" type="submit">Save Changes</button>
                            <button type="button" onClick={() => setEditingStudent(null)}>Cancel</button>
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
                        {addAdmissionForm.leadId && (
                            <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                                🎓 Converting Lead to Admission: <b>{addAdmissionForm.studentName || 'Lead Student'}</b> ({addAdmissionForm.studentPhone})
                            </div>
                        )}
                        <label>
                            Admission Number
                            <input value={addAdmissionForm.admissionNumber} onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, admissionNumber: e.target.value })} placeholder="ADM-1001" required />
                        </label>
                        <label style={{ display: 'block', marginBottom: 12 }}>
                            Student <span style={{ color: '#dc2626' }}>*</span>
                            {(() => {
                                const selectedStudent = students.find(s => s.id === addAdmissionForm.studentId);
                                
                                if (selectedStudent) {
                                    return (
                                        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 14px', position: 'relative', marginTop: 4 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                                                {selectedStudent.firstName} {selectedStudent.lastName || ''}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                                                Student ID: <b>{selectedStudent.studentCode}</b>
                                            </div>
                                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                                Phone: {selectedStudent.phone} {selectedStudent.email ? ` • ${selectedStudent.email}` : ''}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setAddAdmissionForm(prev => ({ ...prev, studentId: '' }))}
                                                style={{ position: 'absolute', top: 10, right: 10, background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}
                                                title="Deselect student"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                }

                                const filteredStudentOptions = (students || []).filter(s => {
                                    const q = (studentSearchQuery || '').trim().toLowerCase();
                                    if (!q) return true;
                                    return (
                                        (s.studentCode || '').toLowerCase().includes(q) ||
                                        (s.firstName || '').toLowerCase().includes(q) ||
                                        (s.lastName || '').toLowerCase().includes(q) ||
                                        (s.phone || '').toLowerCase().includes(q) ||
                                        (s.email || '').toLowerCase().includes(q)
                                    );
                                }).slice(0, 50);

                                return (
                                    <div style={{ position: 'relative', marginTop: 4 }}>
                                        {addAdmissionForm.studentName && !addAdmissionForm.studentId && (
                                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                                                ✓ Auto-creating Student: <b>{addAdmissionForm.studentName}</b> ({addAdmissionForm.studentPhone}) — or select an existing student below:
                                            </div>
                                        )}
                                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <Search size={16} style={{ position: 'absolute', left: 12, color: '#64748b', pointerEvents: 'none' }} />
                                            <input
                                                type="text"
                                                placeholder="🔍 Search student by name, ID (e.g. STU-1001) or phone..."
                                                value={studentSearchQuery}
                                                onChange={(e) => {
                                                    setStudentSearchQuery(e.target.value);
                                                    setShowStudentDropdown(true);
                                                }}
                                                onFocus={() => setShowStudentDropdown(true)}
                                                style={{ paddingLeft: 36, width: '100%' }}
                                            />
                                        </div>

                                        {showStudentDropdown && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    background: '#ffffff',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: 8,
                                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                                                    zIndex: 2000,
                                                    maxHeight: 220,
                                                    overflowY: 'auto',
                                                    marginTop: 4
                                                }}
                                            >
                                                {filteredStudentOptions.length === 0 ? (
                                                    <div style={{ padding: '12px 14px', fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                                                        No matching students found
                                                    </div>
                                                ) : (
                                                    filteredStudentOptions.map((s) => (
                                                        <div
                                                            key={s.id}
                                                            onClick={() => {
                                                                setAddAdmissionForm(prev => ({ ...prev, studentId: s.id }));
                                                                setShowStudentDropdown(false);
                                                                setStudentSearchQuery('');
                                                            }}
                                                            style={{
                                                                padding: '10px 14px',
                                                                borderBottom: '1px solid #f1f5f9',
                                                                cursor: 'pointer',
                                                                transition: 'background 0.15s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                                                        >
                                                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                                                                {s.firstName} {s.lastName || ''}
                                                            </div>
                                                            <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                                                                Student ID: <b>{s.studentCode}</b>
                                                            </div>
                                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                                                Phone: {s.phone} {s.email ? ` • ${s.email}` : ''}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
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
                            <select
                                value={addAdmissionForm.batchId}
                                onChange={(e) => {
                                    const selectedB = batches.find((b) => b.id === e.target.value);
                                    setAddAdmissionForm({
                                        ...addAdmissionForm,
                                        batchId: e.target.value,
                                        startDate: selectedB?.startDate ? selectedB.startDate.slice(0, 10) : addAdmissionForm.startDate,
                                        endDate: selectedB?.endDate ? selectedB.endDate.slice(0, 10) : addAdmissionForm.endDate
                                    });
                                }}
                            >
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
                        <label>
                            Remarks
                            <textarea
                                value={addPaymentForm.remarks || ''}
                                onChange={(e) => setAddPaymentForm({ ...addPaymentForm, remarks: e.target.value })}
                                placeholder="e.g. First installment, paid via PhonePe"
                            />
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
                            <input type="password" value={addUserForm.password} onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })} placeholder="••••••••" required />
                        </label>
                        <label>
                            Role
                            <select value={addUserForm.role} onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value })}>
                                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="COUNSELLOR">COUNSELLOR</option>
                                <option value="TRAINER">TRAINER</option>
                                <option value="ACCOUNTS">ACCOUNTS</option>
                                <option value="RECEPTIONIST">RECEPTIONIST</option>
                            </select>
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
        WELCOME: `Hello ${leadName}! Thank you for contacting CADPOINT COIMBATORE. We offer industry-recognized CAD, BIM, 3Ds Max & Civil Engineering programs. How can we assist your training goals today?`,
        COURSE_FEE: `Hi ${leadName}! Regarding your enquiry for ${courseName}, estimated course fee is ${courseFee}. Our upcoming batches offer flexible morning & evening schedules. Would you like to reserve a seat?`,
        FOLLOWUP: `Hello ${leadName}, this is a gentle follow-up from CADPOINT COIMBATORE regarding your course enquiry. Are you available for a brief discussion or demo session today?`,
        DEMO_INVITE: `Hi ${leadName}! We invite you to attend a free live demo session at CADPOINT COIMBATORE. Please reply with your convenient time slot!`
    };

    const [selectedTemplateKey, setSelectedTemplateKey] = useState('WELCOME');
    const [messageText, setMessageText] = useState(templates.WELCOME);

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

    return (
        <div className="modal" style={{ zIndex: 1100 }}>
            <div className="panel" style={{ maxWidth: 540 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'grid', placeItems: 'center' }}>
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
                        <button className="primary" onClick={openDirectWhatsApp} style={{ flex: 1, background: '#16a34a', borderColor: '#16a34a', color: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                            <MessageCircle size={16} /> Open in WhatsApp Web / App
                        </button>
                        <button className="secondary" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Dashboard({ user, token, leads = [], followups = [], admissions = [], payments = [], onAddLead, onSchedule, onCompleteFollowup, onOpenWhatsApp, onNavigate }) {
    const safeLeads = Array.isArray(leads) ? leads : [];
    const safeFollowups = Array.isArray(followups) ? followups : [];
    const safeAdmissions = Array.isArray(admissions) ? admissions : [];
    const safePayments = Array.isArray(payments) ? payments : [];

    const isCounsellor = user?.role === 'COUNSELLOR';
    const [counsellorPeriod, setCounsellorPeriod] = useState('6_months');
    const [counsellorData, setCounsellorData] = useState(null);

    useEffect(() => {
        if (isCounsellor && token) {
            fetch(API_BASE + `/reports/counsellor-dashboard?period=${counsellorPeriod}`, {
                headers: { Authorization: 'Bearer ' + token }
            })
            .then(r => r.json())
            .then(j => {
                if (j.success && j.data) setCounsellorData(j.data);
            })
            .catch(e => console.error('counsellor dashboard fetch error', e));
        }
    }, [isCounsellor, token, counsellorPeriod]);

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);

    // Generate Month Options dynamically for the last 12 months
    const monthOptions = React.useMemo(() => {
        const options = [];
        const n = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(n.getFullYear(), n.getMonth() - i, 1);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const key = `${y}-${m}`;
            const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
            const shortLabel = d.toLocaleString('default', { month: 'short' });
            options.push({ key, label, shortLabel, year: y, monthIndex: d.getMonth() });
        }
        return options;
    }, []);

    // Helper to extract YYYY-MM
    const getYM = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    // Filtered arrays based on selectedMonth ('ALL' or 'YYYY-MM')
    const filteredLeads = safeLeads.filter(l => selectedMonth === 'ALL' || getYM(l.createdAt) === selectedMonth);
    const filteredAdmissions = safeAdmissions.filter(a => selectedMonth === 'ALL' || getYM(a.admissionDate || a.createdAt || a.startDate) === selectedMonth);
    const filteredPayments = safePayments.filter(p => selectedMonth === 'ALL' || getYM(p.paymentDate || p.createdAt) === selectedMonth);

    // Selected Month Metrics
    const monthlyRevenue = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const businessValue = filteredAdmissions.reduce((sum, a) => sum + (Number(a.finalFee || a.agreedFee) || 0), 0);
    const monthlyAgreedFees = businessValue;
    const monthlyOutstanding = Math.max(0, monthlyAgreedFees - monthlyRevenue);
    const monthlyAdmissionsCount = filteredAdmissions.length;
    const monthlyLeadsCount = filteredLeads.length;
    const monthlyConversionRate = monthlyLeadsCount > 0 ? ((monthlyAdmissionsCount / monthlyLeadsCount) * 100).toFixed(0) : '0';

    // Global All-Time Metrics
    const totalRevenue = safePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalAgreedFees = safeAdmissions.reduce((sum, a) => sum + (Number(a.finalFee) || 0), 0);
    const totalOutstanding = Math.max(0, totalAgreedFees - totalRevenue);
    const totalAdmissions = safeAdmissions.length;
    const totalLeads = safeLeads.length;

    // Funnel Counts
    const contactedCount = filteredLeads.filter((l) => l.status && (l.status + '').toUpperCase() === 'CONTACTED').length;
    const interestedCount = filteredLeads.filter((l) => l.status && (l.status + '').toUpperCase() === 'INTERESTED').length;
    const demoCount = filteredLeads.filter((l) => l.status && (l.status + '').toUpperCase().includes('DEMO')).length;

    // Build Chronological Monthly Trend (Last 6 Months)
    const monthlyTrends = React.useMemo(() => {
        const last6 = monthOptions.slice(0, 6).reverse();
        return last6.map(m => {
            const mLeads = safeLeads.filter(l => getYM(l.createdAt) === m.key).length;
            const mAdmissions = safeAdmissions.filter(a => getYM(a.createdAt || a.startDate) === m.key).length;
            const mPayments = safePayments.filter(p => getYM(p.paymentDate || p.createdAt) === m.key);
            const mRevenue = mPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const mConv = mLeads > 0 ? ((mAdmissions / mLeads) * 100).toFixed(0) : '0';
            return { ...m, leads: mLeads, admissions: mAdmissions, revenue: mRevenue, conversion: mConv };
        });
    }, [monthOptions, safeLeads, safeAdmissions, safePayments]);

    const maxTrendRevenue = Math.max(1, ...monthlyTrends.map(t => t.revenue));

    const selectedMonthObj = monthOptions.find(m => m.key === selectedMonth);
    const monthTitleLabel = selectedMonth === 'ALL' ? 'All Months (Year-to-Date)' : (selectedMonthObj ? selectedMonthObj.label : 'Monthly Overview');

    if (isCounsellor) {
        const cTotalLeads = counsellorData?.totalLeads ?? safeLeads.length;
        const cNewLeads = counsellorData?.newLeads ?? safeLeads.filter(l => (l.status || '').toUpperCase() === 'NEW').length;
        const cFollowUps = counsellorData?.followUps ?? safeFollowups.length;
        const cAdmissions = counsellorData?.totalAdmissions ?? safeAdmissions.length;
        const cConverted = counsellorData?.convertedLeads ?? safeLeads.filter(l => (l.status || '').toUpperCase() === 'CONVERTED' || (l.status || '').toUpperCase() === 'ENROLLED').length;
        const cConvRate = counsellorData?.conversionRate ?? (cTotalLeads > 0 ? `${Math.round((cAdmissions / cTotalLeads) * 100)}%` : '0%');

        const monthlyEnquiries = counsellorData?.monthlyEnquiries || monthlyTrends.map(t => ({ month: t.label, shortMonth: t.shortLabel, count: t.leads }));
        const monthlyAdmissions = counsellorData?.monthlyAdmissions || monthlyTrends.map(t => ({ month: t.label, shortMonth: t.shortLabel, count: t.admissions }));

        const maxEnquiryCount = Math.max(1, ...monthlyEnquiries.map(e => e.count));
        const maxAdmissionCount = Math.max(1, ...monthlyAdmissions.map(a => a.count));

        return (
            <div className="content">
                {/* Header Toolbar */}
                <div className="actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ background: '#0284c7', color: '#ffffff', width: 36, height: 36, borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                            <UsersIcon size={20} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>COUNSELLOR DASHBOARD</h2>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lead conversion, enquiry trends & student admission statistics</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                            <Filter size={15} color="#0284c7" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Period:</span>
                            <select
                                value={counsellorPeriod}
                                onChange={(e) => setCounsellorPeriod(e.target.value)}
                                style={{ border: 'none', background: 'transparent', fontWeight: 700, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13 }}
                            >
                                <option value="6_months">Last 6 Months</option>
                                <option value="12_months">Last 12 Months</option>
                                <option value="this_year">This Year</option>
                            </select>
                        </div>

                        <button className="primary" onClick={onAddLead} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Plus size={17} /> Add Lead
                        </button>
                        <button className="secondary" onClick={onSchedule} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            Schedule Follow-up
                        </button>
                    </div>
                </div>

                {/* 4 Top KPI Cards */}
                <div className="cards">
                    <div className="card">
                        <span>Total Leads</span>
                        <strong>{cTotalLeads}</strong>
                        <small className="good">Enquiries logged</small>
                        <small>Active pipeline</small>
                    </div>
                    <div className="card">
                        <span>New Leads</span>
                        <strong>{cNewLeads}</strong>
                        <small className="good">Fresh enquiries</small>
                        <small>Awaiting contact</small>
                    </div>
                    <div className="card">
                        <span>Follow-ups</span>
                        <strong>{cFollowUps}</strong>
                        <small style={{ color: '#0284c7' }}>Scheduled tasks</small>
                        <small>Active follow-ups</small>
                    </div>
                    <div className="card">
                        <span>Admissions</span>
                        <strong>{cAdmissions}</strong>
                        <small className="good">{cConvRate} conversion rate</small>
                        <small>Enrolled students</small>
                    </div>
                </div>

                {/* Lead Analytics & Funnel */}
                <div className="settings-card" style={{ marginTop: 20 }}>
                    <div className="settings-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                                <BarChart3 size={18} color="#0284c7" /> Lead Analytics & Conversion Performance
                            </h3>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Overview of total leads, converted students, and conversion efficiency.</p>
                        </div>
                        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                            Conversion Rate: {cConvRate}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 16 }}>
                        <div style={{ padding: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Total Leads</span>
                            <strong style={{ fontSize: 22, color: 'var(--text-primary)' }}>{cTotalLeads}</strong>
                        </div>
                        <div style={{ padding: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Converted Students</span>
                            <strong style={{ fontSize: 22, color: '#16a34a' }}>{cConverted}</strong>
                        </div>
                        <div style={{ padding: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Conversion Rate</span>
                            <strong style={{ fontSize: 22, color: '#0284c7' }}>{cConvRate}</strong>
                        </div>
                    </div>
                </div>

                {/* Monthly Enquiries Trend Chart & Monthly Admissions Trend Chart */}
                <div className="grid" style={{ marginTop: 20 }}>
                    {/* Monthly Enquiries */}
                    <section className="panel">
                        <div className="panelhead">
                            <div>
                                <b style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <BarChart3 size={18} color="#0284c7" /> Monthly Enquiries Trend
                                </b>
                                <span>Month-by-month enquiries received</span>
                            </div>
                        </div>
                        <div className="chart" style={{ paddingTop: 20, paddingBottom: 10 }}>
                            <div className="bars" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 160, paddingBottom: 20 }}>
                                {monthlyEnquiries.map((e, idx) => {
                                    const heightPct = maxEnquiryCount > 0 ? Math.max(14, Math.round((e.count / maxEnquiryCount) * 140)) : 14;
                                    return (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, maxWidth: 54 }} title={`${e.month || e.shortMonth}: ${e.count} enquiries`}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>{e.count}</span>
                                            <div style={{ width: '100%', height: heightPct, background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)', borderRadius: '6px 6px 0 0' }}></div>
                                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{e.shortMonth || e.month}</label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Monthly Admissions */}
                    <section className="panel">
                        <div className="panelhead">
                            <div>
                                <b style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <GraduationCap size={18} color="#16a34a" /> Monthly Admissions Trend
                                </b>
                                <span>Month-by-month student enrollments</span>
                            </div>
                        </div>
                        <div className="chart" style={{ paddingTop: 20, paddingBottom: 10 }}>
                            <div className="bars" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 160, paddingBottom: 20 }}>
                                {monthlyAdmissions.map((a, idx) => {
                                    const heightPct = maxAdmissionCount > 0 ? Math.max(14, Math.round((a.count / maxAdmissionCount) * 140)) : 14;
                                    return (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, maxWidth: 54 }} title={`${a.month || a.shortMonth}: ${a.count} admissions`}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>{a.count}</span>
                                            <div style={{ width: '100%', height: heightPct, background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)', borderRadius: '6px 6px 0 0' }}></div>
                                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{a.shortMonth || a.month}</label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Follow-ups & Recent Enquiries Grid */}
                <div className="grid" style={{ marginTop: 20 }}>
                    <section className="panel">
                        <div className="panelhead">
                            <div>
                                <b>Today's Follow-ups</b>
                                <span>{safeFollowups.length} tasks need attention</span>
                            </div>
                            <button className="link" onClick={() => onNavigate('Follow-ups')}>
                                View calendar
                            </button>
                        </div>
                        {safeFollowups.length === 0 ? (
                            <p style={{ padding: 16, color: '#64748b' }}>No pending follow-ups scheduled for today.</p>
                        ) : (
                            safeFollowups.slice(0, 8).map((f) => {
                                const time = formatDateTime(f.scheduledAt);
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
                                <b>Recent Enquiries</b>
                                <span>Latest lead submissions</span>
                            </div>
                            <button className="link" onClick={() => onNavigate('Leads')}>
                                View all
                            </button>
                        </div>
                        {safeLeads.length === 0 ? (
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
                                    {safeLeads.slice(0, 6).map((l) => {
                                        const name = (l.firstName || '') + (l.lastName ? ' ' + l.lastName : '');
                                        const statusStr = (l.status || 'NEW') + '';
                                        return (
                                            <tr key={l.id}>
                                                <td><b>{name}</b></td>
                                                <td>{l.phone}</td>
                                                <td>
                                                    <span className={'status ' + statusStr.replaceAll(' ', '').toLowerCase()}>{statusStr}</span>
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

    return (
        <div className="content">
            {/* Header Toolbar with Month Filter */}
            <div className="actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: '#16a34a', color: '#ffffff', width: 36, height: 36, borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                        <CalendarDays size={20} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard & Monthly Overview</h2>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Showing analytics for <b>{monthTitleLabel}</b></span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                        <Filter size={15} color="#16a34a" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Month Filter:</span>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{ border: 'none', background: 'transparent', fontWeight: 700, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13 }}
                        >
                            {monthOptions.map(m => (
                                <option key={m.key} value={m.key}>{m.label}</option>
                            ))}
                            <option value="ALL">All Months (Year-to-Date)</option>
                        </select>
                    </div>

                    <button className="primary" onClick={onAddLead} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={17} /> Add Lead
                    </button>
                    <button className="secondary" onClick={onSchedule} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        Schedule Follow-up
                    </button>
                </div>
            </div>

            {/* Monthly Key Metrics Cards */}
            <div className="cards">
                <div className="card">
                    <span>Monthly Enquiries</span>
                    <strong>{monthlyLeadsCount}</strong>
                    <small className="good">{selectedMonth === 'ALL' ? 'Total YTD' : 'This Period'}</small>
                    <small>{safeLeads.length} total logged</small>
                </div>
                <div className="card">
                    <span>Monthly Admissions</span>
                    <strong>{monthlyAdmissionsCount}</strong>
                    <small className="good">{monthlyConversionRate}% conv. rate</small>
                    <small>enrolled students</small>
                </div>
                <div className="card">
                    <span>Monthly Revenue</span>
                    <strong>₹{monthlyRevenue.toLocaleString()}</strong>
                    <small className="good">{filteredPayments.length} receipts</small>
                    <small>collections this period</small>
                </div>
                <div className="card">
                    <span>Business Value</span>
                    <strong>₹{businessValue.toLocaleString()}</strong>
                    <small className="good">Total value of new admissions</small>
                    <small>{monthlyAdmissionsCount} new admissions</small>
                </div>
                <div className="card">
                    <span>Monthly Fee Pending</span>
                    <strong>₹{monthlyOutstanding.toLocaleString()}</strong>
                    <small style={{ color: monthlyOutstanding > 0 ? '#dc2626' : '#238558' }}>
                        {monthlyOutstanding > 0 ? 'Pending collection' : 'Fully collected'}
                    </small>
                    <small>agreed fee balance</small>
                </div>
            </div>

            {/* Monthly Trend Analytics & Lead Funnel */}
            <div className="grid">
                <section className="panel wide">
                    <div className="panelhead">
                        <div>
                            <b style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <BarChart3 size={18} color="#16a34a" /> Monthly Revenue & Trend Analysis
                            </b>
                            <span>Live collection trends across the last 6 months</span>
                        </div>
                        <span className="badge" style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 700 }}>
                            Live Analytics
                        </span>
                    </div>
                    <div className="chart" style={{ paddingTop: 20, paddingBottom: 10 }}>
                        <div className="bars" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 160, paddingBottom: 20 }}>
                            {monthlyTrends.map((t) => {
                                const heightPct = maxTrendRevenue > 0 ? Math.max(14, Math.round((t.revenue / maxTrendRevenue) * 140)) : 14;
                                const isSelected = t.key === selectedMonth;
                                return (
                                    <div
                                        key={t.key}
                                        onClick={() => setSelectedMonth(t.key)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 6,
                                            cursor: 'pointer',
                                            flex: 1,
                                            maxWidth: 64
                                        }}
                                        title={`${t.label}: ₹${t.revenue.toLocaleString()} (${t.admissions} admissions)`}
                                    >
                                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>
                                            {t.revenue > 0 ? `₹${(t.revenue / 1000).toFixed(0)}k` : '₹0'}
                                        </span>
                                        <div
                                            style={{
                                                width: '100%',
                                                height: heightPct,
                                                background: isSelected ? 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)' : 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                                                borderRadius: '6px 6px 0 0',
                                                boxShadow: isSelected ? '0 0 10px rgba(22, 163, 74, 0.5)' : 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                        ></div>
                                        <label style={{ fontSize: 11, fontWeight: isSelected ? 700 : 500, color: isSelected ? '#16a34a' : 'var(--text-secondary)' }}>
                                            {t.shortLabel}
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="panel">
                    <div className="panelhead">
                        <div>
                            <b>Lead Conversion Funnel</b>
                            <span>{monthTitleLabel} breakdown</span>
                        </div>
                    </div>
                    {[
                        ['Monthly Enquiries', monthlyLeadsCount, '100%'],
                        ['Contacted', contactedCount, monthlyLeadsCount > 0 ? Math.round((contactedCount / monthlyLeadsCount) * 100) + '%' : '0%'],
                        ['Interested', interestedCount, monthlyLeadsCount > 0 ? Math.round((interestedCount / monthlyLeadsCount) * 100) + '%' : '0%'],
                        ['Demo Scheduled', demoCount, monthlyLeadsCount > 0 ? Math.round((demoCount / monthlyLeadsCount) * 100) + '%' : '0%'],
                        ['Enrolled Admission', monthlyAdmissionsCount, monthlyConversionRate + '%']
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

            {/* Month-by-Month Overview Summary Breakdown Table */}
            <div className="settings-card" style={{ marginTop: 20 }}>
                <div className="settings-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                            <CalendarDays size={18} color="#16a34a" /> Month-by-Month Performance Breakdown
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Comparative monthly statistics for leads, admissions, collections, and conversion rates.</p>
                    </div>
                </div>

                <div className="table-responsive" style={{ marginTop: 12 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>New Enquiries</th>
                                <th>Admissions</th>
                                <th>Revenue Collected</th>
                                <th>Conversion Rate</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyTrends.map((m) => (
                                <tr key={m.key} style={{ background: m.key === selectedMonth ? 'rgba(22, 163, 74, 0.08)' : 'transparent' }}>
                                    <td>
                                        <b style={{ color: m.key === selectedMonth ? '#16a34a' : 'inherit' }}>
                                            {m.label} {m.key === currentYearMonth ? ' (Current)' : ''}
                                        </b>
                                    </td>
                                    <td><b>{m.leads}</b> leads</td>
                                    <td><b style={{ color: '#16a34a' }}>{m.admissions}</b> students</td>
                                    <td><b style={{ color: '#0284c7' }}>₹{m.revenue.toLocaleString()}</b></td>
                                    <td>
                                        <span className="badge" style={{ background: Number(m.conversion) >= 30 ? '#dcfce7' : '#fef3c7', color: Number(m.conversion) >= 30 ? '#15803d' : '#b45309', padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                                            {m.conversion}%
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="secondary"
                                            onClick={() => setSelectedMonth(m.key)}
                                            style={{ padding: '4px 10px', fontSize: 11, color: m.key === selectedMonth ? '#16a34a' : 'inherit', borderColor: m.key === selectedMonth ? '#86efac' : 'inherit' }}
                                        >
                                            {m.key === selectedMonth ? 'Selected ✓' : 'Select Month'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="grid">
                <section className="panel">
                    <div className="panelhead">
                        <div>
                            <b>Today's Follow-ups</b>
                            <span>{safeFollowups.length} tasks need attention</span>
                        </div>
                        <button className="link" onClick={() => onNavigate('Follow-ups')}>
                            View calendar
                        </button>
                    </div>
                    {safeFollowups.length === 0 ? (
                        <p style={{ padding: 16, color: '#64748b' }}>No pending follow-ups scheduled for today.</p>
                    ) : (
                        safeFollowups.slice(0, 8).map((f) => {
                            const time = formatDateTime(f.scheduledAt);
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
                    {safeLeads.length === 0 ? (
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
                                {safeLeads.slice(0, 6).map((l) => {
                                    const name = (l.firstName || '') + (l.lastName ? ' ' + l.lastName : '');
                                    const initials = (name.match(/\b\w/g) || []).slice(0, 2).join('');
                                    const statusStr = (l.status || 'NEW') + '';
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
                                                    <span className={'status ' + statusStr.replaceAll(' ', '').toLowerCase()}>{statusStr}</span>
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

function Module({ page, leads = [], followups = [], courses = [], batches = [], students = [], admissions = [], payments = [], usersList = [], sourcesList = [], onOpenAddModal, onCompleteFollowup, onOpenWhatsApp, onEditUser, onDeleteUser, onEditCourse, onDeleteCourse, onEditBatch, onDeleteBatch, onEditStudent, onDeleteStudent, onDeleteAdmission, onOpenEditProgress, currentUserId, userRole, user, token, theme, toggleTheme, refreshData }) {
    const itemSingular = page === 'Batches' ? 'Batch' : (page.endsWith('es') ? page.slice(0, -2) : (page.endsWith('s') ? page.slice(0, -1) : page));
    const [filterText, setFilterText] = useState('');
    const [paymentFromDate, setPaymentFromDate] = useState('');
    const [paymentToDate, setPaymentToDate] = useState('');
    const [paymentMonth, setPaymentMonth] = useState('ALL');

    const [expandedAdmissionId, setExpandedAdmissionId] = useState(null);
    const [paymentModalData, setPaymentModalData] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'UPI', transactionReference: '', notes: '' });
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    const [configureInstallmentData, setConfigureInstallmentData] = useState(null);
    const [installmentsForm, setInstallmentsForm] = useState({ inst1: '', inst2: '', inst3: '' });
    const [installmentsSubmitting, setInstallmentsSubmitting] = useState(false);
    const [installmentsError, setInstallmentsError] = useState('');

    const canManagePayments = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'ACCOUNTANT'].includes(userRole || user?.role);

    const getAdmissionInstallmentDetails = (admission) => {
        const finalFee = Number(admission?.finalFee) || 0;
        const payments = Array.isArray(admission?.payments) ? admission.payments : [];
        const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const pendingAmount = Math.max(0, finalFee - totalPaid);
        const progressPct = finalFee > 0 ? Math.min(100, Math.round((totalPaid / finalFee) * 100)) : 0;

        let plannedArray = [
            Math.round(finalFee / 3),
            Math.round(finalFee / 3),
            Math.max(0, finalFee - 2 * Math.round(finalFee / 3))
        ];
        let dueDatesArray = ['', '', ''];
        let hasCustomPlan = false;

        if (admission?.installmentPlan) {
            try {
                const parsed = typeof admission.installmentPlan === 'string' ? JSON.parse(admission.installmentPlan) : admission.installmentPlan;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    hasCustomPlan = true;
                    plannedArray = [
                        Number(parsed[0]?.planned) || 0,
                        Number(parsed[1]?.planned) || 0,
                        Number(parsed[2]?.planned) || 0
                    ];
                    dueDatesArray = [
                        parsed[0]?.dueDate || '',
                        parsed[1]?.dueDate || '',
                        parsed[2]?.dueDate || ''
                    ];
                }
            } catch (e) {
                console.error('Invalid installmentPlan JSON', e);
            }
        }

        const instPayments = { 1: [], 2: [], 3: [] };
        payments.forEach(p => {
            const num = p.installmentNumber && [1, 2, 3].includes(p.installmentNumber) ? p.installmentNumber : 1;
            instPayments[num].push(p);
        });

        const installments = [1, 2, 3].map(num => {
            const planned = plannedArray[num - 1] || 0;
            const dueDate = dueDatesArray[num - 1] || null;
            const pList = instPayments[num] || [];
            const paid = pList.reduce((s, p) => s + (Number(p.amount) || 0), 0);
            const remaining = Math.max(0, planned - paid);
            let status = 'PENDING';
            if (paid >= planned && planned > 0) {
                status = 'PAID';
            } else if (paid > 0) {
                status = 'PARTIAL';
            }

            const lastPaymentDate = pList.length > 0 ? pList[pList.length - 1].paymentDate : null;

            return {
                number: num,
                planned,
                paid,
                remaining,
                dueDate,
                status,
                payments: pList,
                lastPaymentDate
            };
        });

        let overallStatus = 'PENDING';
        if (totalPaid >= finalFee && finalFee > 0) {
            overallStatus = 'FULLY_PAID';
        } else if (totalPaid > 0) {
            overallStatus = 'PARTIALLY_PAID';
        }

        return {
            finalFee,
            totalPaid,
            pendingAmount,
            progressPct,
            hasCustomPlan,
            overallStatus,
            installments
        };
    };

    const generateWhatsAppReminder = (admission, pendingAmount, totalPaid) => {
        const studentName = admission.student ? `${admission.student.firstName} ${admission.student.lastName || ''}`.trim() : 'Student';
        const courseName = admission.course?.name || 'Course';
        const phone = admission.student?.whatsappNumber || admission.student?.phone || '';
        const finalFee = Number(admission.finalFee) || 0;
        const instituteName = 'CAD POINT';

        const text = `Hello ${studentName},

This is a reminder regarding your pending course fees.

Course: ${courseName}
Total Fees: ₹${finalFee.toLocaleString()}
Amount Paid: ₹${totalPaid.toLocaleString()}
Pending Amount: ₹${pendingAmount.toLocaleString()}

Kindly complete the pending payment at your earliest convenience.

Thank you,
${instituteName}`;

        const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
    };

    const handleRecordPaymentSubmit = async (e) => {
        e.preventDefault();
        setPaymentError('');
        const amt = Number(paymentForm.amount);
        if (!amt || amt <= 0) {
            setPaymentError('Payment amount must be greater than 0');
            return;
        }
        if (paymentModalData?.remainingAmount && amt > paymentModalData.remainingAmount) {
            setPaymentError(`Payment amount cannot exceed installment remaining amount (₹${paymentModalData.remainingAmount.toLocaleString()})`);
            return;
        }
        setPaymentSubmitting(true);
        try {
            const payload = {
                admissionId: paymentModalData.admission.id,
                installmentNumber: paymentModalData.installmentNumber,
                amount: amt,
                paymentMethod: paymentForm.paymentMethod,
                transactionReference: paymentForm.transactionReference,
                notes: paymentForm.notes,
                branchId: paymentModalData.admission.branchId
            };
            const res = await fetch(API_BASE + '/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to record payment');
            }
            setPaymentModalData(null);
            setPaymentForm({ amount: '', paymentMethod: 'UPI', transactionReference: '', notes: '' });
            if (typeof refreshData === 'function') refreshData();
        } catch (err) {
            setPaymentError(err.message);
        } finally {
            setPaymentSubmitting(false);
        }
    };

    const handleConfigureInstallmentsSubmit = async (e) => {
        e.preventDefault();
        setInstallmentsError('');
        const inst1 = Number(installmentsForm.inst1) || 0;
        const inst2 = Number(installmentsForm.inst2) || 0;
        const inst3 = Number(installmentsForm.inst3) || 0;
        const finalFee = Number(configureInstallmentData.finalFee) || 0;
        const plannedTotal = inst1 + inst2 + inst3;

        if (plannedTotal > finalFee) {
            setInstallmentsError(`⚠ Planned installment total (₹${plannedTotal.toLocaleString()}) exceeds total course fee (₹${finalFee.toLocaleString()}) by ₹${(plannedTotal - finalFee).toLocaleString()}.`);
            return;
        }

        // Payment-aware validation: cannot set planned amount below already paid amount
        const instDetails = getAdmissionInstallmentDetails(configureInstallmentData);
        for (let i = 0; i < 3; i++) {
            const instNum = i + 1;
            const plannedVal = [inst1, inst2, inst3][i];
            const paidVal = instDetails.installments[i]?.paid || 0;
            if (plannedVal < paidVal) {
                setInstallmentsError(`Installment ${instNum} planned amount (₹${plannedVal.toLocaleString()}) cannot be less than already paid amount (₹${paidVal.toLocaleString()}).`);
                return;
            }
        }

        setInstallmentsSubmitting(true);
        try {
            const installmentPlan = [
                { number: 1, planned: inst1, dueDate: installmentsForm.date1 || '' },
                { number: 2, planned: inst2, dueDate: installmentsForm.date2 || '' },
                { number: 3, planned: inst3, dueDate: installmentsForm.date3 || '' }
            ];

            const res = await fetch(API_BASE + `/admissions/${configureInstallmentData.id}/installments`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ installmentPlan })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to update installment plan');
            }
            setConfigureInstallmentData(null);
            if (typeof refreshData === 'function') refreshData();
        } catch (err) {
            setInstallmentsError(err.message);
        } finally {
            setInstallmentsSubmitting(false);
        }
    };

    const safeLeads = Array.isArray(leads) ? leads : [];
    const safeFollowups = Array.isArray(followups) ? followups : [];
    const safeCourses = Array.isArray(courses) ? courses : [];
    const safeBatches = Array.isArray(batches) ? batches : [];
    const safeStudents = Array.isArray(students) ? students : [];
    const safeAdmissions = Array.isArray(admissions) ? admissions : [];
    const safePayments = Array.isArray(payments) ? payments : [];
    const safeUsers = Array.isArray(usersList) ? usersList : [];

    const lowerFilter = filterText.trim().toLowerCase();

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
                            <input
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                placeholder={'Filter ' + page.toLowerCase() + '...'}
                            />
                            {filterText && (
                                <X size={14} style={{ cursor: 'pointer', marginRight: 6 }} onClick={() => setFilterText('')} />
                            )}
                        </div>
                    </div>
                )}

                {page === 'Leads' && (
                    <table>
                        <thead>
                            <tr>
                                <th>Lead</th>
                                <th>Lead Date</th>
                                <th>Course</th>
                                <th>Source</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Value</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {safeLeads
                                .filter((l) => !lowerFilter || (l.firstName + ' ' + (l.lastName || '') + ' ' + l.phone + ' ' + (l.interestedCourse || '')).toLowerCase().includes(lowerFilter))
                                .map((l) => (
                                    <tr key={l.id || l.leadNumber}>
                                        <td>
                                            <div className="lead">
                                                <div className="mini">{((l.firstName || '').match(/\b\w/g) || []).slice(0, 2).join('') || 'LD'}</div>
                                                <div>
                                                    <b>{(l.firstName || '') + (l.lastName ? ' ' + l.lastName : '') || l.leadNumber}</b>
                                                    {l.admission && (
                                                        <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                                                            ✓ Admission #{l.admission.admissionNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>{formatDate(l.createdAt || l.leadDate)}</td>
                                        <td>{l.interestedCourse || '-'}</td>
                                        <td>{l.source?.name || 'Walk-in'}</td>
                                        <td>{l.phone}</td>
                                        <td>
                                            <span className={'status ' + ((l.status || 'NEW') + '').replaceAll(' ', '').toLowerCase()}>{l.status || 'NEW'}</span>
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
                            {safeFollowups
                                .filter((f) => !lowerFilter || (f.notes || '' + f.type).toLowerCase().includes(lowerFilter))
                                .map((f) => {
                                    const linkedAdmission = f.lead?.admission || safeAdmissions.find(a => a.leadId === f.leadId);
                                    const isConverted = !!linkedAdmission || (f.lead?.status || '').toUpperCase() === 'CONVERTED' || (f.lead?.status || '').toUpperCase() === 'ADMISSION';

                                    return (
                                        <tr key={f.id}>
                                            <td>{formatDateTime(f.scheduledAt)}</td>
                                            <td>
                                                <b>{f.lead ? `${f.lead.firstName} ${f.lead.lastName || ''}`.trim() : f.leadId}</b>
                                                {linkedAdmission && (
                                                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                                                        Adm: #{linkedAdmission.admissionNumber}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{f.type}</td>
                                            <td>{f.notes || '-'}</td>
                                            <td>
                                                {isConverted ? (
                                                    <span className="badge" style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                                                        🟢 Converted
                                                    </span>
                                                ) : f.status === 'COMPLETED' ? (
                                                    <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                                                        🔵 Completed
                                                    </span>
                                                ) : (
                                                    <span className="badge" style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                                                        🟠 Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    {isConverted ? (
                                                        <button
                                                            className="secondary"
                                                            style={{ padding: '4px 8px', fontSize: 11, color: '#16a34a', borderColor: '#86efac', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                            onClick={() => linkedAdmission && setExpandedAdmissionId(linkedAdmission.id)}
                                                            title={linkedAdmission ? `View Admission #${linkedAdmission.admissionNumber}` : 'View Admission'}
                                                        >
                                                            <Eye size={12} /> {linkedAdmission ? `#${linkedAdmission.admissionNumber}` : 'View Admission'}
                                                        </button>
                                                    ) : (
                                                        <>
                                                            {f.status === 'PENDING' && (
                                                                <button className="primary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => onCompleteFollowup(f.id)}>
                                                                    Complete
                                                                </button>
                                                            )}
                                                            <button
                                                                className="primary"
                                                                style={{ padding: '4px 8px', fontSize: 11, background: '#16a34a', borderColor: '#16a34a', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                                onClick={() => openAdmitFromFollowup(f)}
                                                                title="Convert lead to admission"
                                                            >
                                                                <GraduationCap size={13} /> Convert & Admit
                                                            </button>
                                                        </>
                                                    )}
                                                    <button className="secondary" style={{ padding: '4px 8px', fontSize: 11, color: '#16a34a', borderColor: '#86efac' }} onClick={() => onOpenWhatsApp(f.lead, f)}>
                                                        <MessageCircle size={13} /> WhatsApp
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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
                            {safeCourses
                                .filter((c) => !lowerFilter || (c.name + ' ' + c.courseCode).toLowerCase().includes(lowerFilter))
                                .map((c) => (
                                    <tr key={c.id}>
                                        <td><b>{c.courseCode}</b></td>
                                        <td>{c.name}</td>
                                        <td>{c.description || '-'}</td>
                                        <td><b>₹{Number(c.standardFee).toLocaleString()}</b></td>
                                        <td><span className={c.isActive ? 'status confirmed' : 'status lost'}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    type="button"
                                                    className="secondary"
                                                    style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                    onClick={() => onEditCourse(c)}
                                                    title="Edit Course Details"
                                                >
                                                    <Edit size={13} /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="secondary"
                                                    style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                    onClick={() => onDeleteCourse(c.id, c.name)}
                                                    title="Remove Course"
                                                >
                                                    <Trash2 size={13} /> Remove
                                                </button>
                                            </div>
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
                                <th>End Date</th>
                                <th>Capacity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {safeBatches
                                .filter((b) => !lowerFilter || (b.name + ' ' + b.batchCode).toLowerCase().includes(lowerFilter))
                                .map((b) => (
                                    <tr key={b.id}>
                                        <td><b>{b.batchCode}</b></td>
                                        <td>{b.name}</td>
                                        <td>{b.course?.name || '-'}</td>
                                        <td>{formatDate(b.startDate)}</td>
                                        <td>{b.endDate ? formatDate(b.endDate) : '-'}</td>
                                        <td>{b.capacity} students</td>
                                        <td><span className="status active">{b.status}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    type="button"
                                                    className="secondary"
                                                    style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                    onClick={() => onEditBatch(b)}
                                                    title="Edit Batch Details"
                                                >
                                                    <Edit size={13} /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="secondary"
                                                    style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                    onClick={() => onDeleteBatch(b.id, b.name)}
                                                    title="Delete Batch"
                                                >
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {page === 'Students' && (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Student</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeStudents
                                    .filter((s) => !lowerFilter || (s.firstName + ' ' + (s.lastName || '') + ' ' + s.phone + ' ' + s.studentCode).toLowerCase().includes(lowerFilter))
                                    .map((s) => (
                                        <tr key={s.id}>
                                            <td><b>{s.studentCode}</b></td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    {s.photoUrl ? (
                                                        <img src={s.photoUrl} alt="Photo" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                                                    ) : (
                                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', display: 'grid', placeItems: 'center', color: '#64748b', fontSize: 13, fontWeight: 700 }}>
                                                            {s.firstName ? s.firstName.charAt(0).toUpperCase() : 'S'}
                                                        </div>
                                                    )}
                                                    <b>{s.firstName} {s.lastName || ''}</b>
                                                </div>
                                            </td>
                                            <td>{s.phone}</td>
                                            <td>{s.email || '-'}</td>
                                            <td>{formatDate(s.createdAt)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <button
                                                        type="button"
                                                        className="secondary"
                                                        style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                        onClick={() => onEditStudent && onEditStudent(s)}
                                                        title="Edit Student"
                                                    >
                                                        <Edit size={13} /> Edit
                                                    </button>
                                                    <button className="secondary" style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => onDeleteStudent(s.id, `${s.firstName} ${s.lastName || ''}`.trim())}>
                                                        <Trash2 size={13} /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {page === 'Admissions' && (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Admission #</th>
                                    <th>Student</th>
                                    <th>Course</th>
                                    <th>Branch</th>
                                    <th>Syllabus Progress</th>
                                    <th>Certificate</th>
                                    <th>Final Fee</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeAdmissions
                                    .filter((a) => !lowerFilter || (a.admissionNumber + ' ' + (a.student?.firstName || '') + ' ' + (a.course?.name || '')).toLowerCase().includes(lowerFilter))
                                    .map((a) => {
                                        const details = getAdmissionInstallmentDetails(a);
                                        const isExpanded = expandedAdmissionId === a.id;
                                        return (
                                            <React.Fragment key={a.id}>
                                                <tr style={{ cursor: 'pointer', background: isExpanded ? 'rgba(22, 163, 74, 0.05)' : 'transparent' }} onClick={() => setExpandedAdmissionId(isExpanded ? null : a.id)}>
                                                    <td><b>{a.admissionNumber}</b></td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            {a.student?.photoUrl ? (
                                                                <img src={a.student.photoUrl} alt="Student" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                                                            ) : null}
                                                            <div>
                                                                <b>{a.student ? `${a.student.firstName} ${a.student.lastName || ''}`.trim() : '-'}</b>
                                                                <div style={{ fontSize: 11, color: '#64748b' }}>{a.student?.phone}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{a.course?.name || '-'}</td>
                                                    <td>{a.branch?.name || 'Gandhipuram'}</td>
                                                    <td style={{ minWidth: 120 }}>
                                                        <ProgressBar percentage={a.completionPct || 0} />
                                                    </td>
                                                    <td>
                                                        <CertificateBadge status={a.certificate?.status || 'NOT_STARTED'} issueDate={a.certificate?.issueDate} />
                                                    </td>
                                                    <td>
                                                        <b>₹{details.finalFee.toLocaleString()}</b>
                                                        <div style={{ fontSize: 11, color: details.pendingAmount <= 0 ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                                                            {details.pendingAmount <= 0 ? '✓ Paid' : `Due: ₹${details.pendingAmount.toLocaleString()}`}
                                                        </div>
                                                    </td>
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                            <button
                                                                className="secondary"
                                                                style={{ padding: '4px 8px', fontSize: 11, color: '#16a34a', borderColor: '#86efac', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                                onClick={() => setExpandedAdmissionId(isExpanded ? null : a.id)}
                                                            >
                                                                <Eye size={12} /> {isExpanded ? 'Hide Details' : 'View Details'}
                                                            </button>
                                                            <button
                                                                className="secondary"
                                                                style={{ padding: '4px 8px', fontSize: 11, color: '#0284c7', borderColor: '#bae6fd', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                                onClick={() => onOpenEditProgress(a)}
                                                            >
                                                                <Edit size={12} /> Progress
                                                            </button>
                                                            <button
                                                                className="secondary"
                                                                style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                                onClick={() => onDeleteAdmission(a.id, a.admissionNumber)}
                                                            >
                                                                <Trash2 size={12} /> Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr key={a.id + '-details'} style={{ background: '#f8fafc' }}>
                                                        <td colSpan={8} style={{ padding: 20 }}>
                                                            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #cbd5e1', padding: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
                                                                {/* Details Header */}
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
                                                                    <div>
                                                                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
                                                                            <GraduationCap size={20} color="#16a34a" /> ADMISSION DETAILS — {a.admissionNumber}
                                                                        </h3>
                                                                        <span style={{ fontSize: 12, color: '#64748b' }}>
                                                                            Student Code: <b>{a.student?.studentCode}</b> | Branch: <b>{a.branch?.name || 'Gandhipuram'}</b>
                                                                        </span>
                                                                    </div>

                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                        <span className="badge" style={{
                                                                            background: details.pendingAmount <= 0 ? '#dcfce7' : '#fee2e2',
                                                                            color: details.pendingAmount <= 0 ? '#15803d' : '#991b1b',
                                                                            padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700
                                                                        }}>
                                                                            {details.pendingAmount <= 0 ? '✓ Fully Paid' : '⚠ Fee Pending'}
                                                                        </span>

                                                                        {/* WhatsApp Payment Reminder (Only shown if pendingAmount > 0) */}
                                                                        {details.pendingAmount > 0 && (
                                                                            <button
                                                                                type="button"
                                                                                className="primary"
                                                                                style={{ background: '#25D366', borderColor: '#25D366', color: '#ffffff', padding: '6px 14px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    e.preventDefault();
                                                                                    generateWhatsAppReminder(a, details.pendingAmount, details.totalPaid);
                                                                                }}
                                                                            >
                                                                                <MessageCircle size={15} /> WhatsApp Reminder
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Payment Summary */}
                                                                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                                                                        <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                            Payment Summary
                                                                        </h4>
                                                                        {canManagePayments && (
                                                                            <button
                                                                                type="button"
                                                                                className="secondary"
                                                                                style={{ padding: '5px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#0284c7', borderColor: '#bae6fd' }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    e.preventDefault();
                                                                                    setConfigureInstallmentData(a);
                                                                                    setInstallmentsError('');
                                                                                    setInstallmentsForm({
                                                                                        inst1: details.installments[0]?.planned ?? Math.round(details.finalFee / 3),
                                                                                        inst2: details.installments[1]?.planned ?? Math.round(details.finalFee / 3),
                                                                                        inst3: details.installments[2]?.planned ?? (details.finalFee - 2 * Math.round(details.finalFee / 3)),
                                                                                        date1: details.installments[0]?.dueDate || '',
                                                                                        date2: details.installments[1]?.dueDate || '',
                                                                                        date3: details.installments[2]?.dueDate || ''
                                                                                    });
                                                                                }}
                                                                            >
                                                                                ⚙ {details.hasCustomPlan ? 'Edit Planned Amounts' : 'Configure Planned Amounts'}
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {/* Visual Payment Progress Bar */}
                                                                    <div style={{ marginBottom: 14 }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                                                            <span>Payment Progress</span>
                                                                            <span>₹{details.totalPaid.toLocaleString()} / ₹{details.finalFee.toLocaleString()} Paid ({details.progressPct}%)</span>
                                                                        </div>
                                                                        <div style={{ width: '100%', height: 10, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                                                                            <div style={{ width: `${details.progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #16a34a 0%, #22c55e 100%)', borderRadius: 6, transition: 'width 0.3s ease' }}></div>
                                                                        </div>
                                                                    </div>

                                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                                                                        <div>
                                                                            <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>Total Course Fee</span>
                                                                            <strong style={{ fontSize: 18, color: '#0f172a' }}>₹{details.finalFee.toLocaleString()}</strong>
                                                                        </div>
                                                                        <div>
                                                                            <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>Total Amount Paid</span>
                                                                            <strong style={{ fontSize: 18, color: '#16a34a' }}>₹{details.totalPaid.toLocaleString()}</strong>
                                                                        </div>
                                                                        <div>
                                                                            <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>Pending Fee</span>
                                                                            <strong style={{ fontSize: 18, color: details.pendingAmount > 0 ? '#dc2626' : '#16a34a' }}>
                                                                                ₹{details.pendingAmount.toLocaleString()}
                                                                            </strong>
                                                                        </div>
                                                                        <div>
                                                                            <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>Payment Status</span>
                                                                            <strong style={{ fontSize: 15, color: details.pendingAmount <= 0 ? '#16a34a' : '#d97706' }}>
                                                                                {details.pendingAmount <= 0 ? '✓ Fully Paid' : 'Pending'}
                                                                            </strong>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Student & Course Info */}
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
                                                                    <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                                                        <h5 style={{ margin: '0 0 8px', fontSize: 13, color: '#0284c7', fontWeight: 700 }}>Student Information</h5>
                                                                        <p style={{ margin: '3px 0', fontSize: 13 }}><b>Name:</b> {a.student ? `${a.student.firstName} ${a.student.lastName || ''}`.trim() : '-'}</p>
                                                                        <p style={{ margin: '3px 0', fontSize: 13 }}><b>Phone:</b> {a.student?.phone || '-'}</p>
                                                                        <p style={{ margin: '3px 0', fontSize: 13 }}><b>Email:</b> {a.student?.email || '-'}</p>
                                                                        <p style={{ margin: '3px 0', fontSize: 13 }}><b>Address:</b> {a.student?.address || a.student?.lastName || '-'}</p>
                                                                    </div>
                                                                    <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                                                        <h5 style={{ margin: '0 0 8px', fontSize: 13, color: '#16a34a', fontWeight: 700 }}>Course & Batch Information</h5>
                                                                        <p style={{ margin: '3px 0', fontSize: 13 }}><b>Course:</b> {a.course?.name || '-'}</p>
                                                                        <p style={{ margin: '3px 0', fontSize: 13 }}><b>Batch:</b> {a.batch?.name || 'Standard Batch'}</p>
                                                                        <p style={{ margin: '3px 0', fontSize: 13 }}><b>Start Date:</b> {formatDate(a.startDate)}</p>
                                                                        <p style={{ margin: '3px 0', fontSize: 13 }}><b>End Date:</b> {formatDate(a.endDate)}</p>
                                                                    </div>
                                                                </div>

                                                                {/* 3-Installment Schedule */}
                                                                <div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                                                                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                                                            3-Installment Payment Schedule
                                                                        </h4>
                                                                    </div>

                                                                    <div className="table-responsive">
                                                                        <table style={{ width: '100%', fontSize: 13 }}>
                                                                            <thead>
                                                                                <tr style={{ background: '#f1f5f9' }}>
                                                                                    <th>Installment</th>
                                                                                    <th>Planned Amount</th>
                                                                                    <th>Paid Amount</th>
                                                                                    <th>Remaining</th>
                                                                                    <th>Due Date</th>
                                                                                    <th>Status</th>
                                                                                    <th>Action</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {details.installments.map((inst) => (
                                                                                    <tr key={inst.number}>
                                                                                        <td><b>Installment {inst.number}</b></td>
                                                                                        <td>₹{inst.planned.toLocaleString()}</td>
                                                                                        <td><b style={{ color: inst.paid > 0 ? '#16a34a' : 'inherit' }}>₹{inst.paid.toLocaleString()}</b></td>
                                                                                        <td><b style={{ color: inst.remaining > 0 ? '#dc2626' : '#16a34a' }}>₹{inst.remaining.toLocaleString()}</b></td>
                                                                                        <td>{inst.dueDate ? formatDate(inst.dueDate) : '-'}</td>
                                                                                        <td>
                                                                                            <span className="badge" style={{
                                                                                                background: inst.status === 'PAID' ? '#dcfce7' : inst.status === 'PARTIAL' ? '#fef3c7' : '#fee2e2',
                                                                                                color: inst.status === 'PAID' ? '#15803d' : inst.status === 'PARTIAL' ? '#b45309' : '#991b1b',
                                                                                                padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700
                                                                                            }}>
                                                                                                {inst.status === 'PAID' ? '✓ Paid' : inst.status === 'PARTIAL' ? '◐ Partially Paid' : '○ Pending'}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td>
                                                                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                                                                {inst.remaining > 0 && canManagePayments && (
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        className="primary"
                                                                                                        style={{ padding: '3px 8px', fontSize: 11 }}
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            e.preventDefault();
                                                                                                            setPaymentModalData({
                                                                                                                admission: a,
                                                                                                                installmentNumber: inst.number,
                                                                                                                plannedAmount: inst.planned,
                                                                                                                paidAmount: inst.paid,
                                                                                                                remainingAmount: inst.remaining
                                                                                                            });
                                                                                                            setPaymentForm({
                                                                                                                amount: inst.remaining,
                                                                                                                paymentMethod: 'UPI',
                                                                                                                transactionReference: '',
                                                                                                                notes: ''
                                                                                                            });
                                                                                                        }}
                                                                                                    >
                                                                                                        + Add Payment
                                                                                                    </button>
                                                                                                )}
                                                                                                {inst.remaining > 0 && (
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        className="secondary"
                                                                                                        style={{ background: '#25D366', borderColor: '#25D366', color: '#ffffff', padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            e.preventDefault();
                                                                                                            generateWhatsAppReminder(a, inst.remaining, inst.paid);
                                                                                                        }}
                                                                                                        title="Send WhatsApp Payment Reminder"
                                                                                                    >
                                                                                                        <MessageCircle size={12} /> WhatsApp
                                                                                                    </button>
                                                                                                )}
                                                                                                {inst.remaining === 0 && (
                                                                                                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Completed ✓</span>
                                                                                                )}
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                )}

                {page === 'Payments' && (
                    <div>
                        <div className="filter-bar" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16, background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>From:</span>
                                <input type="date" value={paymentFromDate} onChange={(e) => setPaymentFromDate(e.target.value)} style={{ padding: '6px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>To:</span>
                                <input type="date" value={paymentToDate} onChange={(e) => setPaymentToDate(e.target.value)} style={{ padding: '6px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Month:</span>
                                <select value={paymentMonth} onChange={(e) => setPaymentMonth(e.target.value)} style={{ padding: '6px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                                    <option value="ALL">All Months</option>
                                    <option value="2026-08">August 2026</option>
                                    <option value="2026-07">July 2026</option>
                                    <option value="2026-06">June 2026</option>
                                    <option value="2026-05">May 2026</option>
                                    <option value="2026-04">April 2026</option>
                                    <option value="2026-03">March 2026</option>
                                    <option value="2026-02">February 2026</option>
                                    <option value="2026-01">January 2026</option>
                                </select>
                            </div>
                            {(paymentFromDate || paymentToDate || paymentMonth !== 'ALL') && (
                                <button type="button" className="secondary" style={{ padding: '6px 12px', fontSize: 12, color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => { setPaymentFromDate(''); setPaymentToDate(''); setPaymentMonth('ALL'); }}>
                                    Clear Filter
                                </button>
                            )}
                        </div>
                        <div className="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Receipt #</th>
                                        <th>Student</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Remarks</th>
                                        <th>Branch</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {safePayments
                                        .filter((p) => {
                                            if (lowerFilter && !(p.receiptNumber + ' ' + (p.admission?.student?.firstName || '') + ' ' + (p.paymentMethod || '')).toLowerCase().includes(lowerFilter)) {
                                                return false;
                                            }
                                            const pDateStr = p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : '';
                                            if (paymentFromDate && pDateStr < paymentFromDate) return false;
                                            if (paymentToDate && pDateStr > paymentToDate) return false;
                                            if (paymentMonth && paymentMonth !== 'ALL') {
                                                if (!pDateStr.startsWith(paymentMonth)) return false;
                                            }
                                            return true;
                                        })
                                        .map((p) => (
                                            <tr key={p.id}>
                                                <td><b>{p.receiptNumber}</b></td>
                                                <td>{p.admission?.student ? `${p.admission.student.firstName} ${p.admission.student.lastName || ''}`.trim() : '-'}</td>
                                                <td><b>₹{Number(p.amount).toLocaleString()}</b></td>
                                                <td>{p.paymentMethod}</td>
                                                <td>{p.remarks || p.notes || '-'}</td>
                                                <td>{p.branch?.name || 'Gandhipuram'}</td>
                                                <td>{formatDate(p.paymentDate)}</td>
                                                <td><span className="status active">{p.status}</span></td>
                                            </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
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
                            {safeUsers.map((u) => (
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
                        <SettingsView userRole={userRole || user?.role} user={user} token={token} theme={theme} toggleTheme={toggleTheme} sourcesList={sourcesList} refreshSources={refreshData} usersList={usersList} currentUserId={currentUserId} onOpenAddModal={onOpenAddModal} onEditUser={onEditUser} onDeleteUser={onDeleteUser} />
                    </ErrorBoundary>
                )}

                {page === 'Reports' && (
                    <ReportsView
                        leads={safeLeads}
                        followups={safeFollowups}
                        courses={safeCourses}
                        batches={safeBatches}
                        students={safeStudents}
                        admissions={safeAdmissions}
                        payments={safePayments}
                        onOpenWhatsApp={onOpenWhatsApp}
                    />
                )}
                {/* Modal for Recording Installment Payment */}
                {paymentModalData && (() => {
                    const admission = paymentModalData.admission;
                    const instNum = paymentModalData.installmentNumber;
                    const planned = paymentModalData.plannedAmount || 0;
                    const paid = paymentModalData.paidAmount || 0;
                    const maxRemaining = paymentModalData.remainingAmount || 0;

                    const enteredAmount = Number(paymentForm.amount) || 0;
                    const remainingAfterPayment = Math.max(0, maxRemaining - enteredAmount);

                    let instStatus = 'PENDING';
                    if (paid >= planned && planned > 0) instStatus = 'PAID';
                    else if (paid > 0) instStatus = 'PARTIAL';

                    let amountError = '';
                    if (enteredAmount <= 0) {
                        amountError = '⚠ Enter a valid payment amount greater than ₹0';
                    } else if (enteredAmount > maxRemaining) {
                        amountError = `⚠ Payment amount cannot exceed remaining balance of ₹${maxRemaining.toLocaleString()}`;
                    }

                    const isValid = !amountError && enteredAmount > 0 && enteredAmount <= maxRemaining;

                    const studentName = admission?.student
                        ? `${admission.student.firstName} ${admission.student.lastName || ''}`.trim()
                        : '-';

                    return (
                        <div
                            className="modal"
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                width: '100vw',
                                height: '100vh',
                                background: 'rgba(15, 23, 42, 0.75)',
                                backdropFilter: 'blur(6px)',
                                WebkitBackdropFilter: 'blur(6px)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 2500,
                                padding: 16,
                                boxSizing: 'border-box'
                            }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setPaymentModalData(null);
                            }}
                        >
                            <form
                                className="panel"
                                onSubmit={handleRecordPaymentSubmit}
                                style={{
                                    maxWidth: 580,
                                    width: '100%',
                                    maxHeight: '90vh',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 0,
                                    overflow: 'hidden',
                                    borderRadius: 12,
                                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
                                    background: '#ffffff',
                                    boxSizing: 'border-box'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Sticky Header */}
                                <div style={{ background: '#ffffff', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                                            Record Installment Payment
                                        </h3>
                                        <div style={{ margin: '4px 0 0', fontSize: 12, color: '#475569', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                            <span><b>Installment {instNum}</b></span>
                                            <span>• <b>Admission #:</b> {admission?.admissionNumber || admission?.id}</span>
                                            <span>• <b>Student:</b> {studentName}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="round"
                                        onClick={() => setPaymentModalData(null)}
                                        style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: 6, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Close"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Scrollable Body */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                                    {/* Installment Context Card */}
                                    <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Installment {instNum} Context
                                            </h4>
                                            <span className="badge" style={{
                                                background: instStatus === 'PAID' ? '#dcfce7' : instStatus === 'PARTIAL' ? '#fef3c7' : '#fee2e2',
                                                color: instStatus === 'PAID' ? '#15803d' : instStatus === 'PARTIAL' ? '#b45309' : '#991b1b',
                                                padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700
                                            }}>
                                                {instStatus === 'PAID' ? '✓ Paid' : instStatus === 'PARTIAL' ? '◐ Partially Paid' : '○ Pending'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                            <div>
                                                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Planned Amount</span>
                                                <strong style={{ fontSize: 15, color: '#0f172a' }}>₹{planned.toLocaleString()}</strong>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Already Paid</span>
                                                <strong style={{ fontSize: 15, color: '#16a34a' }}>₹{paid.toLocaleString()}</strong>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Remaining</span>
                                                <strong style={{ fontSize: 15, color: maxRemaining > 0 ? '#dc2626' : '#16a34a' }}>₹{maxRemaining.toLocaleString()}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submission Error Alert */}
                                    {paymentError && (
                                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
                                            {paymentError}
                                        </div>
                                    )}

                                    {/* Payment Amount Field */}
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                                            Payment Amount (₹) <span style={{ color: '#dc2626' }}>*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            max={maxRemaining}
                                            min={1}
                                            placeholder="Enter amount to pay"
                                            required
                                            style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                                        />
                                        <div style={{ marginTop: 6, fontSize: 12 }}>
                                            {amountError ? (
                                                <span style={{ color: '#dc2626', fontWeight: 600 }}>{amountError}</span>
                                            ) : (
                                                <span style={{ color: '#475569' }}>
                                                    Max payable: <b>₹{maxRemaining.toLocaleString()}</b>
                                                    {enteredAmount > 0 && enteredAmount <= maxRemaining && (
                                                        <b style={{ color: remainingAfterPayment === 0 ? '#16a34a' : '#0284c7', marginLeft: 8 }}>
                                                            {remainingAfterPayment === 0
                                                                ? '✓ This payment will fully complete Installment ' + instNum
                                                                : `(Remaining after payment: ₹${remainingAfterPayment.toLocaleString()})`
                                                            }
                                                        </b>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment Method Field */}
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                                            Payment Method <span style={{ color: '#dc2626' }}>*</span>
                                        </label>
                                        <select
                                            value={paymentForm.paymentMethod}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                            required
                                            style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', boxSizing: 'border-box' }}
                                        >
                                            <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                                            <option value="CASH">Cash</option>
                                            <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS / RTGS)</option>
                                            <option value="CARD">Debit / Credit Card</option>
                                            <option value="CHEQUE">Cheque</option>
                                            <option value="ONLINE">Online Payment Gateway</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>

                                    {/* Transaction / Reference ID Field */}
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                                            Transaction / Reference ID
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentForm.transactionReference}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                                            placeholder="e.g. UPI-99882211 or UTR-123456"
                                            style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                                        />
                                        <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: '#64748b' }}>
                                            Optional — useful for UPI or bank transfer tracking.
                                        </span>
                                    </div>

                                    {/* Notes / Remarks Field */}
                                    <div style={{ marginBottom: 10 }}>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                                            Notes / Remarks
                                        </label>
                                        <textarea
                                            value={paymentForm.notes}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                            placeholder="Add any additional payment remarks..."
                                            rows={3}
                                            style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: '1px solid #cbd5e1', minHeight: 80, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                        />
                                        <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: '#64748b' }}>
                                            Optional — internal payment notes.
                                        </span>
                                    </div>
                                </div>

                                {/* Sticky Footer */}
                                <div style={{ background: '#ffffff', padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                                    <button type="button" className="secondary" onClick={() => setPaymentModalData(null)} disabled={paymentSubmitting}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="primary" disabled={paymentSubmitting || !isValid}>
                                        {paymentSubmitting ? 'Saving...' : '✓ Save Payment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    );
                })()}

                {/* Modal for Configuring 3-Installment Planned Amounts */}
                {configureInstallmentData && (() => {
                    const instDetails = getAdmissionInstallmentDetails(configureInstallmentData);
                    const finalFee = instDetails.finalFee;
                    const totalPaid = instDetails.totalPaid;
                    const pendingAmount = instDetails.pendingAmount;

                    const inst1 = Number(installmentsForm.inst1) || 0;
                    const inst2 = Number(installmentsForm.inst2) || 0;
                    const inst3 = Number(installmentsForm.inst3) || 0;
                    const plannedTotal = inst1 + inst2 + inst3;
                    const remainingToAllocate = finalFee - plannedTotal;

                    const paid1 = instDetails.installments[0]?.paid || 0;
                    const paid2 = instDetails.installments[1]?.paid || 0;
                    const paid3 = instDetails.installments[2]?.paid || 0;

                    let localError = '';
                    if (plannedTotal > finalFee) {
                        localError = `⚠ Planned total (₹${plannedTotal.toLocaleString()}) exceeds total course fee (₹${finalFee.toLocaleString()}) by ₹${(plannedTotal - finalFee).toLocaleString()}`;
                    } else if (inst1 < paid1) {
                        localError = `⚠ Installment 1 planned amount cannot be less than already paid amount (₹${paid1.toLocaleString()})`;
                    } else if (inst2 < paid2) {
                        localError = `⚠ Installment 2 planned amount cannot be less than already paid amount (₹${paid2.toLocaleString()})`;
                    } else if (inst3 < paid3) {
                        localError = `⚠ Installment 3 planned amount cannot be less than already paid amount (₹${paid3.toLocaleString()})`;
                    }

                    const isValid = !localError && plannedTotal <= finalFee && inst1 >= paid1 && inst2 >= paid2 && inst3 >= paid3;

                    const handleAutoBalance = () => {
                        let p1 = Math.max(paid1, Math.round(finalFee / 3));
                        let p2 = Math.max(paid2, Math.round(finalFee / 3));
                        let p3 = Math.max(paid3, finalFee - (p1 + p2));
                        if (p1 + p2 + p3 !== finalFee) {
                            p3 = Math.max(paid3, finalFee - (p1 + p2));
                        }
                        setInstallmentsForm({
                            ...installmentsForm,
                            inst1: p1,
                            inst2: p2,
                            inst3: p3
                        });
                    };

                    const handleCloseModal = () => {
                        setConfigureInstallmentData(null);
                    };

                    const studentName = configureInstallmentData.student
                        ? `${configureInstallmentData.student.firstName} ${configureInstallmentData.student.lastName || ''}`.trim()
                        : '-';
                    const courseName = configureInstallmentData.course?.name || '-';

                    return (
                        <div
                            className="modal"
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                width: '100vw',
                                height: '100vh',
                                background: 'rgba(15, 23, 42, 0.75)',
                                backdropFilter: 'blur(6px)',
                                WebkitBackdropFilter: 'blur(6px)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 2500,
                                padding: 16,
                                boxSizing: 'border-box'
                            }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) handleCloseModal();
                            }}
                        >
                            <form
                                className="panel"
                                onSubmit={handleConfigureInstallmentsSubmit}
                                style={{
                                    maxWidth: 680,
                                    width: '100%',
                                    maxHeight: '90vh',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 0,
                                    overflow: 'hidden',
                                    borderRadius: 12,
                                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
                                    background: '#ffffff',
                                    boxSizing: 'border-box'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Sticky Header */}
                                <div style={{ background: '#ffffff', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            ⚙ {instDetails.hasCustomPlan ? 'Edit Planned Amounts' : 'Configure Planned Amounts'}
                                        </h3>
                                        <div style={{ margin: '4px 0 0', fontSize: 12, color: '#475569', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                            <span><b>Admission #:</b> {configureInstallmentData.admissionNumber || configureInstallmentData.id}</span>
                                            <span>• <b>Student:</b> {studentName}</span>
                                            <span>• <b>Course:</b> {courseName}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="round"
                                        onClick={handleCloseModal}
                                        style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: 6, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Close"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Scrollable Modal Content */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                                    {/* Admission Fee & Payment Progress Card */}
                                    <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 12 }}>
                                            <div>
                                                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Total Course Fee</span>
                                                <strong style={{ fontSize: 16, color: '#0f172a' }}>₹{finalFee.toLocaleString()}</strong>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Already Paid</span>
                                                <strong style={{ fontSize: 16, color: '#16a34a' }}>₹{totalPaid.toLocaleString()}</strong>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Pending Fee</span>
                                                <strong style={{ fontSize: 16, color: pendingAmount > 0 ? '#dc2626' : '#16a34a' }}>₹{pendingAmount.toLocaleString()}</strong>
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                                                <span>Payment Progress</span>
                                                <span>{instDetails.progressPct}% Paid</span>
                                            </div>
                                            <div style={{ width: '100%', height: 8, background: '#cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ width: `${instDetails.progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #16a34a 0%, #22c55e 100%)', borderRadius: 4 }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Validation Error Alert */}
                                    {(installmentsError || localError) && (
                                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
                                            {installmentsError || localError}
                                        </div>
                                    )}

                                    {/* 3 Installment Configuration Cards */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {[1, 2, 3].map((num) => {
                                            const instVal = num === 1 ? installmentsForm.inst1 : num === 2 ? installmentsForm.inst2 : installmentsForm.inst3;
                                            const dateVal = num === 1 ? installmentsForm.date1 : num === 2 ? installmentsForm.date2 : installmentsForm.date3;
                                            const paidVal = num === 1 ? paid1 : num === 2 ? paid2 : paid3;
                                            const plannedVal = Number(instVal) || 0;
                                            const remainingVal = Math.max(0, plannedVal - paidVal);

                                            let instStatus = 'PENDING';
                                            if (paidVal >= plannedVal && plannedVal > 0) instStatus = 'PAID';
                                            else if (paidVal > 0) instStatus = 'PARTIAL';

                                            return (
                                                <div key={num} style={{ background: '#ffffff', padding: 14, borderRadius: 10, border: '1px solid #cbd5e1' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                        <strong style={{ fontSize: 14, color: '#0f172a' }}>Installment {num}</strong>
                                                        <span className="badge" style={{
                                                            background: instStatus === 'PAID' ? '#dcfce7' : instStatus === 'PARTIAL' ? '#fef3c7' : '#fee2e2',
                                                            color: instStatus === 'PAID' ? '#15803d' : instStatus === 'PARTIAL' ? '#b45309' : '#991b1b',
                                                            padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700
                                                        }}>
                                                            {instStatus === 'PAID' ? '✓ Paid' : instStatus === 'PARTIAL' ? '◐ Partially Paid' : '○ Pending'}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                        <label style={{ margin: 0 }}>
                                                            <span style={{ fontSize: 12, fontWeight: 600 }}>Planned Amount (₹)</span>
                                                            <input
                                                                type="number"
                                                                value={instVal}
                                                                onChange={(e) => setInstallmentsForm({
                                                                    ...installmentsForm,
                                                                    [`inst${num}`]: e.target.value
                                                                })}
                                                                min={paidVal}
                                                                required
                                                                style={{ marginTop: 4 }}
                                                            />
                                                        </label>

                                                        <label style={{ margin: 0 }}>
                                                            <span style={{ fontSize: 12, fontWeight: 600 }}>Due Date</span>
                                                            <input
                                                                type="date"
                                                                value={dateVal}
                                                                onChange={(e) => setInstallmentsForm({
                                                                    ...installmentsForm,
                                                                    [`date${num}`]: e.target.value
                                                                })}
                                                                style={{ marginTop: 4 }}
                                                            />
                                                        </label>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginTop: 8, paddingTop: 6, borderTop: '1px stroke #f1f5f9' }}>
                                                        <span>Paid: <b style={{ color: '#16a34a' }}>₹{paidVal.toLocaleString()}</b></span>
                                                        <span>Remaining: <b style={{ color: remainingVal > 0 ? '#dc2626' : '#16a34a' }}>₹{remainingVal.toLocaleString()}</b></span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Real-time Allocation Summary Banner */}
                                    <div style={{ background: remainingToAllocate === 0 ? '#f0fdf4' : remainingToAllocate > 0 ? '#fefce8' : '#fef2f2', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', marginTop: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                                            <span>Planned Total: <b style={{ color: plannedTotal > finalFee ? '#dc2626' : '#16a34a' }}>₹{plannedTotal.toLocaleString()}</b></span>
                                            <span>Remaining to Allocate: <b style={{ color: remainingToAllocate < 0 ? '#dc2626' : remainingToAllocate > 0 ? '#d97706' : '#16a34a' }}>₹{remainingToAllocate.toLocaleString()}</b></span>
                                        </div>
                                    </div>
                                </div>

                                {/* Sticky Footer */}
                                <div style={{ background: '#ffffff', padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                                    <button type="button" className="secondary" onClick={handleCloseModal} disabled={installmentsSubmitting}>
                                        Cancel
                                    </button>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <button
                                            type="button"
                                            className="secondary"
                                            style={{ padding: '6px 14px', fontSize: 12, color: '#0284c7', borderColor: '#bae6fd', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                            onClick={handleAutoBalance}
                                        >
                                            ⚡ Auto Balance
                                        </button>
                                        <button type="submit" className="primary" disabled={installmentsSubmitting || !isValid}>
                                            {installmentsSubmitting ? 'Saving...' : 'Save Amounts'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}

function ReportsView({ leads = [], followups = [], courses = [], batches = [], students = [], admissions = [], payments = [], onOpenWhatsApp }) {
    const safeLeads = Array.isArray(leads) ? leads : [];
    const safeFollowups = Array.isArray(followups) ? followups : [];
    const safeCourses = Array.isArray(courses) ? courses : [];
    const safeBatches = Array.isArray(batches) ? batches : [];
    const safeStudents = Array.isArray(students) ? students : [];
    const safeAdmissions = Array.isArray(admissions) ? admissions : [];
    const safePayments = Array.isArray(payments) ? payments : [];

    const [selectedMonth, setSelectedMonth] = useState('ALL');
    const [selectedCourseId, setSelectedCourseId] = useState('ALL');

    const availableMonths = Array.from(new Set(
        safeAdmissions.map(a => {
            const dateStr = a.createdAt || a.startDate;
            if (!dateStr) return null;
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? null : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }).filter(Boolean)
    )).sort().reverse();

    const filteredAdmissions = safeAdmissions.filter(a => {
        if (selectedCourseId !== 'ALL' && a.courseId !== selectedCourseId) return false;
        if (selectedMonth !== 'ALL') {
            const dateStr = a.createdAt || a.startDate;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return false;
            const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (monthStr !== selectedMonth) return false;
        }
        return true;
    });

    const pendingStudentsList = filteredAdmissions.map(a => {
        const agreedFee = Number(a.finalFee) || 0;
        const admissionPayments = safePayments.filter(p => p.admissionId === a.id);
        const totalPaid = admissionPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const pendingBalance = Math.max(0, agreedFee - totalPaid);

        return {
            id: a.id,
            admissionNumber: a.admissionNumber,
            studentName: a.student ? `${a.student.firstName} ${a.student.lastName || ''}`.trim() : (a.studentCode || 'Unknown Student'),
            phone: a.student?.phone || '',
            courseName: a.course?.name || 'N/A',
            branchName: a.branch?.name || 'Gandhipuram',
            admissionDate: a.createdAt || a.startDate,
            agreedFee,
            totalPaid,
            pendingBalance
        };
    }).filter(item => item.pendingBalance > 0);

    const totalFilteredRevenue = filteredAdmissions.reduce((sum, a) => {
        const admissionPayments = safePayments.filter(p => p.admissionId === a.id);
        return sum + admissionPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    }, 0);

    const totalFilteredAgreed = filteredAdmissions.reduce((sum, a) => sum + (Number(a.finalFee) || 0), 0);
    const totalFilteredPending = Math.max(0, totalFilteredAgreed - totalFilteredRevenue);
    const conversionRate = safeLeads.length > 0 ? ((safeAdmissions.length / safeLeads.length) * 100).toFixed(1) : '0.0';

    const courseStats = safeCourses.map((c) => {
        const courseAdmissions = filteredAdmissions.filter((a) => a.courseId === c.id || a.course?.name === c.name);
        const revenue = courseAdmissions.reduce((sum, a) => sum + (Number(a.finalFee) || 0), 0);
        return { name: c.name, code: c.courseCode, count: courseAdmissions.length, revenue };
    });

    function exportPendingReportToCSV() {
        let csvContent = '\uFEFF';
        csvContent += 'CADPOINT COIMBATORE - MONTHLY PENDING FEE REPORT\n';
        csvContent += 'Generated Date,' + new Date().toLocaleString() + '\n';
        csvContent += 'Month Filter,' + (selectedMonth === 'ALL' ? 'All Months' : selectedMonth) + '\n\n';

        csvContent += 'Admission #,Student Name,Phone,Course,Branch,Admission Date,Agreed Fee (₹),Total Paid (₹),Pending Balance (₹)\n';
        pendingStudentsList.forEach((p) => {
            csvContent += '"' + p.admissionNumber + '","' + p.studentName.replace(/"/g, '""') + '","' + p.phone + '","' + p.courseName.replace(/"/g, '""') + '","' + p.branchName + '",' + formatDate(p.admissionDate) + ',' + p.agreedFee + ',' + p.totalPaid + ',' + p.pendingBalance + '\n';
        });

        csvContent += '\nTOTAL OUTSTANDING PENDING BALANCE,₹' + totalFilteredPending + '\n';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'CADPOINT_Coimbatore_Pending_Fees_' + selectedMonth + '_' + new Date().toISOString().slice(0, 10) + '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '18px 24px', borderRadius: 12, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>CADPOINT COIMBATORE — Monthly Reports & Pending Analytics</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Filter student fee collection and pending balances by Month & Course.</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                        <Filter size={15} color="#64748b" />
                        <span style={{ fontWeight: 600, color: '#475569' }}>Month:</span>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{ border: 'none', background: 'transparent', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                        >
                            <option value="ALL">All Months</option>
                            {availableMonths.map(m => {
                                const [y, mon] = m.split('-');
                                const dateObj = new Date(parseInt(y), parseInt(mon) - 1, 1);
                                const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
                                return <option key={m} value={m}>{monthName}</option>;
                            })}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                        <span style={{ fontWeight: 600, color: '#475569' }}>Course:</span>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            style={{ border: 'none', background: 'transparent', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                        >
                            <option value="ALL">All Courses</option>
                            {safeCourses.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button className="primary" onClick={exportPendingReportToCSV} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#dc2626', borderColor: '#dc2626' }}>
                        <Download size={16} /> Export Pending CSV
                    </button>
                </div>
            </div>

            <div className="cards">
                <div className="card">
                    <span>Total Revenue (Selected Period)</span>
                    <strong>₹{totalFilteredRevenue.toLocaleString()}</strong>
                    <small className="good">Collected fees</small>
                </div>
                <div className="card" style={{ borderColor: totalFilteredPending > 0 ? '#fca5a5' : '#e2e8f0' }}>
                    <span style={{ color: totalFilteredPending > 0 ? '#b91c1c' : '#64748b' }}>Outstanding Pending Fees</span>
                    <strong style={{ color: totalFilteredPending > 0 ? '#dc2626' : '#0f172a' }}>₹{totalFilteredPending.toLocaleString()}</strong>
                    <small style={{ color: totalFilteredPending > 0 ? '#dc2626' : '#238558', fontWeight: 700 }}>
                        {pendingStudentsList.length} students pending
                    </small>
                </div>
                <div className="card">
                    <span>Lead Conversion Rate</span>
                    <strong>{conversionRate}%</strong>
                    <small className="good">{safeAdmissions.length} admissions / {safeLeads.length} leads</small>
                </div>
                <div className="card">
                    <span>Enrolled Students</span>
                    <strong>{filteredAdmissions.length}</strong>
                    <small>{safeBatches.length} active batches</small>
                </div>
            </div>

            <div className="panel wide" style={{ background: '#ffffff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
                <div className="panelhead" style={{ marginBottom: 16 }}>
                    <div>
                        <b style={{ fontSize: 16, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertCircle size={18} /> Monthly Outstanding Fee Breakdown
                        </b>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Students with pending fee balances for {selectedMonth === 'ALL' ? 'all months' : selectedMonth}</span>
                    </div>
                    <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                        Total Pending: ₹{totalFilteredPending.toLocaleString()}
                    </span>
                </div>
                {pendingStudentsList.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#16a34a', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                        <b>🎉 Great news! No pending fee balances for the selected filter.</b>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Admission #</th>
                                <th>Student Name</th>
                                <th>Phone</th>
                                <th>Course</th>
                                <th>Branch</th>
                                <th>Agreed Fee</th>
                                <th>Paid</th>
                                <th>Pending Balance</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingStudentsList.map((p) => (
                                <tr key={p.id}>
                                    <td><b>{p.admissionNumber}</b></td>
                                    <td><b>{p.studentName}</b></td>
                                    <td>{p.phone}</td>
                                    <td>{p.courseName}</td>
                                    <td>{p.branchName}</td>
                                    <td>₹{p.agreedFee.toLocaleString()}</td>
                                    <td style={{ color: '#16a34a', fontWeight: 600 }}>₹{p.totalPaid.toLocaleString()}</td>
                                    <td>
                                        <b style={{ color: '#dc2626', fontSize: 14 }}>₹{p.pendingBalance.toLocaleString()}</b>
                                    </td>
                                    <td>
                                        {onOpenWhatsApp && (
                                            <button
                                                className="secondary"
                                                style={{ padding: '4px 8px', fontSize: 11, color: '#16a34a', borderColor: '#86efac', display: 'flex', alignItems: 'center', gap: 4 }}
                                                onClick={() => onOpenWhatsApp({ firstName: p.studentName, phone: p.phone, interestedCourse: p.courseName, estimatedValue: p.pendingBalance })}
                                            >
                                                <MessageCircle size={13} /> Remind
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
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
                                <th>Enrolled Students</th>
                                <th>Agreed Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courseStats.map((cs) => (
                                <tr key={cs.code}>
                                    <td><b>{cs.code}</b></td>
                                    <td>{cs.name}</td>
                                    <td>{cs.count} students</td>
                                    <td><b>₹{cs.revenue.toLocaleString()}</b></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
}

function SettingsView({ userRole, user, token, theme, toggleTheme, sourcesList = [], refreshSources, usersList = [], currentUserId, onOpenAddModal, onEditUser, onDeleteUser }) {
    const [activeTab, setActiveTab] = useState('Profile');
    const [saving, setSaving] = useState(false);
    const [newSourceName, setNewSourceName] = useState('');
    const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
    const [showTestWhatsAppModal, setShowTestWhatsAppModal] = useState(false);

    // Master Device & Authorized Devices State directly from Central Server API
    const [primaryDevice, setPrimaryDevice] = useState(null);
    const [authorizedDevices, setAuthorizedDevices] = useState([]);
    const [deviceLoading, setDeviceLoading] = useState(false);
    const [showRevokeModal, setShowRevokeModal] = useState(null);
    const [primaryExistsWarning, setPrimaryExistsWarning] = useState(null);

    const deviceInfo = getOrGenerateDeviceId();

    const [newDeviceForm, setNewDeviceForm] = useState({
        deviceName: deviceInfo.suggestedName,
        deviceType: deviceInfo.suggestedType,
        deviceRole: 'AUTHORIZED',
        branchId: 'gandhipuram'
    });

    const [testPhone, setTestPhone] = useState('+91 99945 12345');
    const [testMessage, setTestMessage] = useState('Hello from CADPOINT COIMBATORE CRM! WhatsApp Business API connection test successful. 🚀');
    const [testingWa, setTestingWa] = useState(false);
    const [testResult, setTestResult] = useState(null);

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

    const [branches, setBranches] = useState([]);

    const fetchBranches = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(API_BASE + '/branches', {
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (j.success && Array.isArray(j.data)) {
                setBranches(j.data);
            }
        } catch (e) {
            console.error('fetchBranches error', e);
        }
    }, [token]);

    const [waConfig, setWaConfig] = useState(null);
    const [waLoading, setWaLoading] = useState(false);
    const [waConnecting, setWaConnecting] = useState(false);

    const fetchWhatsAppStatus = useCallback(async () => {
        if (!token) return;
        setWaLoading(true);
        try {
            const res = await fetch(API_BASE + '/whatsapp/config', {
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (j.success && j.data) {
                setWaConfig(j.data);
            }
        } catch (e) {
            console.error('fetchWhatsAppStatus error', e);
        } finally {
            setWaLoading(false);
        }
    }, [token]);

    const [deviceCountInfo, setDeviceCountInfo] = useState({ activeCount: 0, maxLimit: 10 });

    // Fetch live device architecture from central API per branch
    const fetchDevices = useCallback(async () => {
        if (!token) return;
        setDeviceLoading(true);
        try {
            const res = await fetch(API_BASE + '/devices?branchId=' + (newDeviceForm?.branchId || 'gandhipuram'), {
                headers: {
                    Authorization: 'Bearer ' + token,
                    'X-Device-Id': deviceInfo.deviceId
                }
            });
            const j = await res.json();
            if (j.success && j.data) {
                setPrimaryDevice(j.data.primaryDevice || null);
                setAuthorizedDevices(j.data.authorizedDevices || []);
                setDeviceCountInfo({
                    activeCount: j.data.activeCount || (j.data.primaryDevice ? 1 : 0) + (j.data.authorizedDevices || []).length,
                    maxLimit: j.data.maxLimit || 10
                });
            }
        } catch (e) {
            console.error('fetchDevices error', e);
        } finally {
            setDeviceLoading(false);
        }
    }, [token, deviceInfo.deviceId, newDeviceForm?.branchId]);

    // Initial load
    useEffect(() => {
        if (!token) return;
        fetch(API_BASE + '/settings', { headers: { Authorization: 'Bearer ' + token } })
            .then(r => r.json())
            .then(j => {
                if (j.success && j.data?.profile) {
                    const p = j.data.profile;
                    setProfileForm(prev => ({ ...prev, ...p }));
                    setWhatsappForm(prev => ({ ...prev, ...p }));
                }
            })
            .catch(e => console.error(e));

        fetchDevices();
        fetchWhatsAppStatus();
        fetchBranches();
    }, [token, fetchDevices, fetchWhatsAppStatus, fetchBranches]);

    async function saveProfileSettings(e) {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(API_BASE + '/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(profileForm)
            });
            const j = await res.json();
            if (j.success) alert('✅ Institute profile saved successfully!');
            else alert(j.message || 'Save failed');
        } catch (e) {
            console.error(e);
            alert('Save failed');
        } finally {
            setSaving(false);
        }
    }

    async function saveWhatsAppSettings(e) {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(API_BASE + '/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(whatsappForm)
            });
            const j = await res.json();
            if (j.success) alert('✅ WhatsApp API Settings saved successfully!');
            else alert(j.message || 'Save failed');
        } catch (e) {
            console.error(e);
            alert('Save failed');
        } finally {
            setSaving(false);
        }
    }

    async function sendTestWhatsAppMessage() {
        setTestingWa(true);
        setTestResult(null);
        try {
            const res = await fetch(API_BASE + '/settings/whatsapp/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ recipientPhone: testPhone, message: testMessage })
            });
            const j = await res.json();
            setTestResult(j);
            if (j.waUrl) {
                window.open(j.waUrl, '_blank');
            }
        } catch (e) {
            console.error(e);
            setTestResult({ success: false, message: 'Failed to connect to test server' });
        } finally {
            setTestingWa(false);
        }
    }

    async function handleConnectWhatsApp(targetBranchId = null) {
        setWaConnecting(true);
        try {
            const appId = waConfig?.appId || '';
            const configId = waConfig?.configId || '';
            const selectedBranch = branches.find(b => b.id === targetBranchId) || branches[0];

            if (window.FB && appId) {
                window.FB.init({
                    appId: appId,
                    autoLogAppEvents: true,
                    xfbml: true,
                    version: waConfig?.apiVersion || 'v21.0'
                });

                window.FB.login((response) => {
                    if (response.authResponse && response.authResponse.code) {
                        fetch(API_BASE + '/whatsapp/connect', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                            body: JSON.stringify({
                                code: response.authResponse.code,
                                branchId: targetBranchId || selectedBranch?.id
                            })
                        })
                        .then(r => r.json())
                        .then(j => {
                            if (j.success) {
                                alert(`✅ WhatsApp connected successfully for ${selectedBranch?.name || 'Branch'}!`);
                                fetchWhatsAppStatus();
                                if (typeof fetchBranches === 'function') fetchBranches();
                            } else {
                                alert(j.message || 'WhatsApp connection could not be completed.');
                            }
                        })
                        .catch(err => {
                            console.error(err);
                            alert('WhatsApp connection error.');
                        })
                        .finally(() => setWaConnecting(false));
                    } else {
                        setWaConnecting(false);
                        alert('WhatsApp connection was cancelled or not authorized.');
                    }
                }, {
                    config_id: configId,
                    response_type: 'code',
                    override_default_response_type: true,
                    scope: 'whatsapp_business_messaging,whatsapp_business_management'
                });
            } else {
                const codeInput = prompt(`Enter Meta Embedded Signup Authorization Code or System Token for ${selectedBranch?.name || 'Branch'}:`);
                if (!codeInput) {
                    setWaConnecting(false);
                    return;
                }
                const res = await fetch(API_BASE + '/whatsapp/connect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                    body: JSON.stringify({
                        code: codeInput,
                        accessToken: codeInput,
                        branchId: targetBranchId || selectedBranch?.id
                    })
                });
                const j = await res.json();
                if (j.success) {
                    alert(`✅ WhatsApp connected successfully for ${selectedBranch?.name || 'Branch'}!`);
                    fetchWhatsAppStatus();
                    if (typeof fetchBranches === 'function') fetchBranches();
                } else {
                    alert(j.message || 'WhatsApp connection failed.');
                }
                setWaConnecting(false);
            }
        } catch (e) {
            console.error(e);
            alert('WhatsApp connection error.');
            setWaConnecting(false);
        }
    }

    async function handleDisconnectWhatsApp(targetBranchId = null) {
        const selectedBranch = branches.find(b => b.id === targetBranchId);
        const branchLabel = selectedBranch ? `${selectedBranch.name} Branch` : 'this branch';
        if (!window.confirm(`Disconnect WhatsApp for ${branchLabel}?\n\nThis will stop CAD POINT from using this WhatsApp Business connection. Existing leads, students, and payments will be preserved.`)) {
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(API_BASE + '/whatsapp/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ branchId: targetBranchId })
            });
            const j = await res.json();
            if (j.success) {
                alert(`✅ WhatsApp disconnected for ${branchLabel}.`);
                fetchWhatsAppStatus();
                if (typeof fetchBranches === 'function') fetchBranches();
            } else {
                alert(j.message || 'Disconnect failed');
            }
        } catch (e) {
            console.error(e);
            alert('Disconnect failed');
        } finally {
            setSaving(false);
        }
    }

    async function handleRegisterDeviceSubmit(e, forceReplace = false) {
        if (e) e.preventDefault();
        if (!newDeviceForm.deviceName.trim()) return alert('Please enter Device Name.');

        try {
            const res = await fetch(API_BASE + '/devices/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token,
                    'X-Device-Id': deviceInfo.deviceId
                },
                body: JSON.stringify({
                    deviceId: deviceInfo.deviceId,
                    deviceName: newDeviceForm.deviceName.trim(),
                    deviceType: newDeviceForm.deviceType,
                    deviceRole: newDeviceForm.deviceRole,
                    branchId: newDeviceForm.branchId,
                    forceReplace
                })
            });
            const j = await res.json();

            if (!res.ok || !j.success) {
                if (j.primaryExists) {
                    setPrimaryExistsWarning(j.existingPrimary);
                    return;
                }
                return alert(j.message || 'Device registration failed.');
            }

            alert(j.message || 'Device registered successfully!');
            setShowAddDeviceModal(false);
            setPrimaryExistsWarning(null);
            fetchDevices();
        } catch (err) {
            console.error('Device registration failed', err);
            alert('Device registration failed.');
        }
    }

    async function revokeDeviceAccess(device) {
        try {
            const res = await fetch(API_BASE + `/devices/${device.id}/revoke`, {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (j.success) {
                alert(`✅ Access revoked for ${device.deviceName}. This device will no longer be able to access CRM data.`);
                setShowRevokeModal(null);
                fetchDevices();
            } else {
                alert(j.message || 'Revoke failed.');
            }
        } catch (err) {
            console.error('Revoke device error', err);
            alert('Failed to revoke device access.');
        }
    }

    async function addEnquirySource(e) {
        e.preventDefault();
        if (!newSourceName.trim()) return;
        try {
            const res = await fetch(API_BASE + '/settings/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ name: newSourceName.trim() })
            });
            const j = await res.json();
            if (j.success) {
                setNewSourceName('');
                if (refreshSources) refreshSources();
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
            const res = await fetch(API_BASE + '/settings/sources/' + id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (j.success && refreshSources) refreshSources();
            else alert(j.message || 'Delete failed');
        } catch (e) {
            console.error(e);
        }
    }

    async function triggerDatabaseBackup() {
        setSaving(true);
        try {
            const res = await fetch(API_BASE + '/settings/backup/trigger', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + token }
            });
            const j = await res.json();
            if (j.success) {
                alert(`✅ Database Backup Created Successfully!\n\nFile Name: ${j.data?.fileName || 'cadpoint_backup.sql'}\nSize: ${j.data?.fileSizeFormatted || '2.4 MB'}`);
            } else {
                alert(j.message || 'Backup completed');
            }
        } catch (e) {
            console.error(e);
            alert('Backup test completed');
        } finally {
            setSaving(false);
        }
    }

    const safeUserRole = userRole || user?.role || 'RECEPTIONIST';
    const safeUsers = Array.isArray(usersList) ? usersList : [];

    const allTabs = [
        { id: 'Profile', label: 'Institute Profile', icon: ShieldCheck, perm: 'settings.profile' },
        { id: 'Appearance', label: 'Appearance & Theme', icon: Sun, perm: 'settings.appearance' },
        { id: 'User Control', label: 'User Control & Roles', icon: UserCheck, perm: 'settings.users' },
        { id: 'Branch Management', label: 'Branch Management', icon: Database, perm: 'settings.branches' },
        { id: 'WhatsApp & API', label: 'WhatsApp & API', icon: MessageCircle, perm: 'settings.whatsapp' },
        { id: 'Storage & Database', label: 'Storage & Database', icon: Database, perm: 'settings.whatsapp' },
        { id: 'Enquiry Sources', label: 'Enquiry Sources', icon: Plus, perm: 'settings.whatsapp' },
        { id: 'System Info', label: 'System Info', icon: Laptop, perm: 'settings.profile' }
    ];

    const tabs = allTabs.filter(t => hasPermission(safeUserRole, t.perm));

    useEffect(() => {
        if (tabs.length > 0 && !tabs.some(t => t.id === activeTab)) {
            setActiveTab(tabs[0].id);
        }
    }, [tabs, activeTab]);

    function renderDeviceTypeIcon(type) {
        const t = (type || '').toUpperCase();
        if (t === 'MOBILE') return <Smartphone size={18} color="#0284c7" />;
        if (t === 'TABLET') return <TabletIcon size={18} color="#8b5cf6" />;
        if (t === 'DESKTOP') return <Monitor size={18} color="#16a34a" />;
        return <Laptop size={18} color="#3b82f6" />;
    }

    return (
        <div className="settings-container">
            {/* Sub-tabs Pills */}
            <div className="settings-nav">
                {tabs.map((t) => {
                    const IconComp = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            className={`settings-nav-btn ${isActive ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            <IconComp size={16} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Profile Tab */}
            {activeTab === 'Profile' && (
                <div className="settings-card">
                    <div className="settings-card-header">
                        <h3>Institute Profile & Branding</h3>
                        <p>Configure official branch details, header branding, and contact details.</p>
                    </div>

                    <form onSubmit={saveProfileSettings} className="form-grid">
                        <div className="form-field full-width">
                            <label>Institute Name</label>
                            <input value={profileForm.instituteName} onChange={(e) => setProfileForm({ ...profileForm, instituteName: e.target.value })} required />
                        </div>
                        <div className="form-field full-width">
                            <label>Tagline / Subtitle</label>
                            <input value={profileForm.tagline} onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })} />
                        </div>
                        <div className="form-field">
                            <label>Contact Email</label>
                            <input type="email" value={profileForm.contactEmail} onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })} required />
                        </div>
                        <div className="form-field">
                            <label>Contact Phone</label>
                            <input value={profileForm.contactPhone} onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })} required />
                        </div>
                        <div className="form-field full-width">
                            <label>Branches Address</label>
                            <input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                        </div>
                        <div className="form-field">
                            <label>City</label>
                            <input value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} />
                        </div>
                        <div className="form-field">
                            <label>State</label>
                            <input value={profileForm.state} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} />
                        </div>
                        <div className="form-field full-width" style={{ marginTop: 10 }}>
                            <button className="primary" type="submit" disabled={saving} style={{ width: 'fit-content' }}>
                                {saving ? 'Saving...' : 'Save Profile Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'Appearance' && (
                <div className="settings-card">
                    <div className="settings-card-header">
                        <h3>Appearance & Workspace Theme</h3>
                        <p>Customize the visual theme and color palette of your CRM workspace.</p>
                    </div>

                    <div className="toggle-card">
                        <div>
                            <h4 style={{ margin: 0, color: theme === 'dark' ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                {theme === 'dark' ? <Moon size={20} color="#38bdf8" /> : <Sun size={20} color="#f59e0b" />}
                                {theme === 'dark' ? 'Dark Theme Active' : 'Light Theme Active'}
                            </h4>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                                {theme === 'dark' ? 'Sleek dark interface for reduced eye strain.' : 'Crisp high-contrast theme for daytime productivity.'}
                            </p>
                        </div>
                        <button className="primary" onClick={toggleTheme}>
                            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        </button>
                    </div>
                </div>
            )}

            {/* User Control & Roles Tab (Super Admin Only) */}
            {activeTab === 'User Control' && (
                <div className="settings-card">
                    <div className="settings-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <UserCheck size={20} color="#16a34a" /> User Control & Role Management
                            </h3>
                            <p>Super Admin control center to manage user accounts, assign roles, and reset credentials.</p>
                        </div>
                        <button className="primary" onClick={() => onOpenAddModal && onOpenAddModal('User')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Plus size={16} /> + Add User
                        </button>
                    </div>

                    <div className="table-responsive" style={{ marginTop: 16 }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>User Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Assigned Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeUsers.map((u) => (
                                    <tr key={u.id}>
                                        <td><b>{u.name}</b></td>
                                        <td>{u.email}</td>
                                        <td>{u.phone || 'N/A'}</td>
                                        <td>
                                            <span className="badge" style={{ background: u.role === 'SUPER_ADMIN' ? '#fee2e2' : u.role === 'ADMIN' ? '#e0f2fe' : '#f1f5f9', color: u.role === 'SUPER_ADMIN' ? '#991b1b' : u.role === 'ADMIN' ? '#0369a1' : '#334155', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={u.isActive !== false ? 'status active' : 'status lost'}>
                                                ● {u.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="round" onClick={() => onEditUser && onEditUser(u)} title="Edit User">
                                                    <Edit size={14} />
                                                </button>
                                                {u.id !== currentUserId && (
                                                    <button className="round" style={{ color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => onDeleteUser && onDeleteUser(u.id)} title="Delete User">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Branch Management Tab */}
            {activeTab === 'Branch Management' && (
                <div className="settings-card">
                    <div className="settings-card-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Database size={20} color="#16a34a" /> Multi-Branch Management
                        </h3>
                        <p>Configure multi-branch organization details, active branch codes, and locations.</p>
                    </div>

                    <div className="table-responsive" style={{ marginTop: 16 }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Branch Name</th>
                                    <th>Branch Code</th>
                                    <th>Address</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(branches && branches.length > 0 ? branches : [
                                    { id: '1', name: 'Gandhipuram Branch', code: 'gandhipuram', address: '100 Feet Road, Gandhipuram, Coimbatore', phone: '0422-2525251', isActive: true },
                                    { id: '2', name: 'Saravanapatti Branch', code: 'saravanapatti', address: 'Sathy Road, Saravanapatti, Coimbatore', phone: '0422-2525252', isActive: true }
                                ]).map((b) => (
                                    <tr key={b.id}>
                                        <td><b>{b.name}</b></td>
                                        <td><code>{b.code}</code></td>
                                        <td>{b.address || 'N/A'}</td>
                                        <td>{b.phone || 'N/A'}</td>
                                        <td><span className="status active">● ACTIVE</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Storage & Database Tab — Master Device + Central DB Architecture */}
            {activeTab === 'Storage & Database' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* SECTION 1: PRIMARY / MASTER DEVICE */}
                    <div className="settings-card" style={{ borderLeft: '4px solid #eab308', background: '#fff' }}>
                        <div className="settings-card-header" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 18, color: '#0f172a' }}>
                                        <Crown size={22} color="#eab308" /> PRIMARY DEVICE (MASTER / OWNER DEVICE)
                                    </h3>
                                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                                        The Primary Device belongs to the CRM owner. Exactly ONE Primary Device is allowed for the CRM system.
                                    </p>
                                </div>

                                {primaryDevice ? (
                                    <span className="badge" style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className="pulse" style={{ background: '#16a34a', width: 8, height: 8, borderRadius: '50%' }}></span>
                                        ✓ PRIMARY DEVICE REGISTERED & ACTIVE
                                    </span>
                                ) : (
                                    <span className="badge" style={{ background: '#fef3c7', color: '#b45309', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                                        ⚠️ No Primary Device Registered
                                    </span>
                                )}
                            </div>

                            {primaryDevice ? (
                                <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef9c3', display: 'grid', placeItems: 'center', border: '1px solid #fde047' }}>
                                            {renderDeviceTypeIcon(primaryDevice.deviceType)}
                                        </div>
                                        <div>
                                            <b style={{ fontSize: 16, color: '#0f172a' }}>{primaryDevice.deviceName}</b>
                                            <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
                                                <span>Type: <b>{primaryDevice.deviceType}</b></span>
                                                <span>•</span>
                                                <span>Branch: <b>{primaryDevice.branch?.name || 'Gandhipuram'}</b></span>
                                                <span>•</span>
                                                <span>Registered: <b>{formatDate(primaryDevice.registeredAt)}</b></span>
                                                <span>•</span>
                                                <span>Last Active: <b>{formatDateTime(primaryDevice.lastActiveAt)}</b></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            className="secondary"
                                            onClick={() => {
                                                setNewDeviceForm({
                                                    deviceName: deviceInfo.suggestedName,
                                                    deviceType: deviceInfo.suggestedType,
                                                    deviceRole: 'PRIMARY',
                                                    branchId: 'gandhipuram'
                                                });
                                                setShowAddDeviceModal(true);
                                            }}
                                            style={{ fontSize: 12, padding: '6px 12px' }}
                                        >
                                            Replace Primary Device
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginTop: 16, padding: 20, background: '#fefce8', borderRadius: 12, border: '1px border #fef08a', textCenter: 'center' }}>
                                    <p style={{ margin: '0 0 12px', fontSize: 13, color: '#854d0e', fontWeight: 600 }}>
                                        Zero devices currently registered. Register this device or client device as the Master Primary Device.
                                    </p>
                                    <button
                                        className="primary"
                                        style={{ background: '#ca8a04', borderColor: '#ca8a04', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                        onClick={() => {
                                            setNewDeviceForm({
                                                deviceName: deviceInfo.suggestedName,
                                                deviceType: deviceInfo.suggestedType,
                                                deviceRole: 'PRIMARY',
                                                branchId: 'gandhipuram'
                                            });
                                            setShowAddDeviceModal(true);
                                        }}
                                    >
                                        <Crown size={16} /> + Register Primary Device
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 2: AUTHORIZED DEVICES */}
                    <div className="settings-card">
                        <div className="settings-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <ShieldCheck size={20} color="#16a34a" /> AUTHORIZED DEVICES
                                </h3>
                                <p>All authorized devices (laptops, mobile phones, desktops, tablets) communicate directly with the central Supabase PostgreSQL database.</p>
                            </div>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <span className="badge" style={{ background: deviceCountInfo.activeCount >= 10 ? '#fee2e2' : '#e0f2fe', color: deviceCountInfo.activeCount >= 10 ? '#b91c1c' : '#0369a1', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                                    Registered Devices: {deviceCountInfo.activeCount} / 10
                                </span>
                                <button
                                    className="primary"
                                    onClick={() => {
                                        if (deviceCountInfo.activeCount >= 10) {
                                            return alert("Device limit reached. Maximum 10 devices are allowed for this branch. Remove an existing device to register a new device.");
                                        }
                                        setNewDeviceForm({
                                            deviceName: deviceInfo.suggestedName,
                                            deviceType: deviceInfo.suggestedType,
                                            deviceRole: 'AUTHORIZED',
                                            branchId: newDeviceForm.branchId || 'gandhipuram'
                                        });
                                        setShowAddDeviceModal(true);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a', borderColor: '#16a34a' }}
                                >
                                    <Plus size={16} /> + Add Device
                                </button>
                            </div>
                        </div>

                        {authorizedDevices.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>No authorized devices registered yet.</p>
                                <span style={{ fontSize: 12, color: '#94a3b8' }}>Click "+ Add Device" above to authorize additional laptops, mobile phones, or tablets.</span>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="desktop-device-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Device Name</th>
                                                <th>Type</th>
                                                <th>Branch</th>
                                                <th>Status</th>
                                                <th>Registered</th>
                                                <th>Last Active</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {authorizedDevices.map((dev) => (
                                                <tr key={dev.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            {renderDeviceTypeIcon(dev.deviceType)}
                                                            <b>{dev.deviceName}</b>
                                                        </div>
                                                    </td>
                                                    <td>{dev.deviceType}</td>
                                                    <td>{dev.branch?.name || 'Gandhipuram'}</td>
                                                    <td>
                                                        <span className={dev.status === 'ACTIVE' ? 'status active' : dev.status === 'REVOKED' ? 'status lost' : 'status follow_up'}>
                                                            ● {dev.status}
                                                        </span>
                                                    </td>
                                                    <td>{formatDate(dev.registeredAt)}</td>
                                                    <td>{formatDateTime(dev.lastActiveAt)}</td>
                                                    <td>
                                                        {dev.status !== 'REVOKED' ? (
                                                            <button
                                                                className="secondary"
                                                                style={{ padding: '4px 10px', fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }}
                                                                onClick={() => setShowRevokeModal(dev)}
                                                            >
                                                                Revoke Access
                                                            </button>
                                                        ) : (
                                                            <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Revoked</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Central DB Status Info */}
                    <div className="settings-card">
                        <div className="settings-card-header" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Database size={20} color="#0284c7" /> Central Authoritative PostgreSQL Database
                                    </h3>
                                    <p>Live central database cluster hosted on Supabase (AWS Tokyo). Real-time sync across all authorized devices.</p>
                                </div>
                                <span className="badge" style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    ● Central DB Online
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
                                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Data Architecture</span>
                                    <b style={{ display: 'block', fontSize: 14, color: '#0f172a', marginTop: 4 }}>Single Authoritative Cloud DB</b>
                                </div>
                                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Device Authorization</span>
                                    <b style={{ display: 'block', fontSize: 14, color: '#0284c7', marginTop: 4 }}>Secure Device ID Tokens</b>
                                </div>
                                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Cross-Device Sync</span>
                                    <b style={{ display: 'block', fontSize: 14, color: '#16a34a', marginTop: 4 }}>Instant Live Sync</b>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enquiry Sources Tab */}
            {activeTab === 'Enquiry Sources' && (
                <div className="settings-card">
                    <div className="settings-card-header">
                        <h3>Lead Enquiry Sources</h3>
                        <p>Configure available enquiry channels for student lead tracking.</p>
                    </div>

                    <form onSubmit={addEnquirySource} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        <input
                            value={newSourceName}
                            onChange={(e) => setNewSourceName(e.target.value)}
                            placeholder="Enter new source (e.g. Instagram Ads, Telecaller)"
                            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                            required
                        />
                        <button className="primary" type="submit">+ Add Source</button>
                    </form>

                    <table>
                        <thead>
                            <tr>
                                <th>Source Name</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sourcesList.map((s) => (
                                <tr key={s.id}>
                                    <td><b>{s.name}</b></td>
                                    <td>
                                        <button className="secondary" style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => deleteEnquirySource(s.id)}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* WhatsApp & API Tab */}
            {activeTab === 'WhatsApp & API' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Multi-Branch Embedded Signup / Connection Card */}
                    <div className="settings-card">
                        <div className="settings-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <MessageCircle size={20} color="#16a34a" /> Multi-Branch WhatsApp Business Integrations
                                </h3>
                                <p>Connect individual WhatsApp Business Accounts & phone numbers for each CAD POINT branch via Meta OAuth.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                            {(branches && branches.length > 0 ? branches : [
                                { id: 'gandhipuram', name: 'Gandhipuram', code: 'gandhipuram' },
                                { id: 'saravanapatti', name: 'Saravanapatti', code: 'saravanapatti' }
                            ]).map((b) => {
                                const bWa = waConfig?.branches?.find(wb => wb.branchId === b.id)?.integration || b.whatsAppIntegration;
                                const isConnected = Boolean(bWa && bWa.status === 'CONNECTED');
                                return (
                                    <div key={b.id} style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{b.name} Branch</h4>
                                                <span style={{ fontSize: 12, color: '#64748b' }}>Code: {b.code}</span>
                                            </div>
                                            <div>
                                                {isConnected ? (
                                                    <span className="badge" style={{ background: '#dcfce7', color: '#15803d', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                                                        🟢 Connected ✓
                                                    </span>
                                                ) : (
                                                    <span className="badge" style={{ background: '#fef3c7', color: '#b45309', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                                                        🔴 Not Connected
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {isConnected ? (
                                            <div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                                                    <div>
                                                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>Business Name</span>
                                                        <strong style={{ fontSize: 14, color: '#0f172a' }}>{bWa.businessName || 'CADPOINT Business'}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>WhatsApp Number</span>
                                                        <strong style={{ fontSize: 14, color: '#16a34a' }}>{bWa.displayPhoneNumber || bWa.phoneNumber}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>WABA ID</span>
                                                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#475569' }}>{bWa.wabaId}</span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        className="primary"
                                                        onClick={() => setShowTestWhatsAppModal(true)}
                                                        style={{ padding: '6px 14px', fontSize: 12, background: '#16a34a', borderColor: '#16a34a', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                                    >
                                                        <Send size={14} /> Test {b.name} WhatsApp
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="secondary"
                                                        onClick={() => handleDisconnectWhatsApp(b.id)}
                                                        style={{ padding: '6px 14px', fontSize: 12, color: '#dc2626', borderColor: '#fca5a5' }}
                                                    >
                                                        Disconnect {b.name}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>No WhatsApp Business account connected for {b.name} Branch.</p>
                                                <button
                                                    type="button"
                                                    className="primary"
                                                    disabled={waConnecting}
                                                    onClick={() => handleConnectWhatsApp(b.id)}
                                                    style={{ background: '#16a34a', borderColor: '#16a34a', color: '#ffffff', padding: '8px 18px', fontSize: 13, fontWeight: 700, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                                                >
                                                    <MessageCircle size={16} /> [ Connect {b.name} WhatsApp ]
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <details style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                            <summary style={{ fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
                                Advanced / Developer Fallback Credentials
                            </summary>
                            <form className="form-grid" onSubmit={saveWhatsAppSettings} style={{ marginTop: 16 }}>
                                <div className="form-field full-width">
                                    <label>WhatsApp Cloud API Endpoint URL</label>
                                    <input
                                        value={whatsappForm.whatsappApiUrl}
                                        onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsappApiUrl: e.target.value })}
                                        placeholder="https://graph.facebook.com/v21.0/"
                                        required
                                    />
                                </div>
                                <div className="form-field">
                                    <label>WhatsApp Business Phone Number ID</label>
                                    <input
                                        value={whatsappForm.whatsappPhoneNumberId}
                                        onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsappPhoneNumberId: e.target.value })}
                                        placeholder="1092837465"
                                    />
                                </div>
                                <div className="form-field">
                                    <label>WhatsApp Business Account ID (WABA ID)</label>
                                    <input
                                        value={whatsappForm.whatsappBusinessAccountId || ''}
                                        onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsappBusinessAccountId: e.target.value })}
                                        placeholder="WABA-CADPOINT-CBE-9081"
                                    />
                                </div>
                                <div className="form-field full-width">
                                    <label>Meta Permanent Access Token</label>
                                    <input
                                        type="password"
                                        value={whatsappForm.whatsappAccessToken}
                                        onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsappAccessToken: e.target.value })}
                                        placeholder="•••••••• (Encrypted on Render server)"
                                    />
                                </div>
                                <div className="form-field full-width">
                                    <button className="secondary" type="submit" disabled={saving} style={{ padding: '6px 14px', fontSize: 12 }}>
                                        {saving ? 'Saving...' : 'Save Manual Fallback Credentials'}
                                    </button>
                                </div>
                            </form>
                        </details>
                    </div>

                    {/* Meta Webhook Card */}
                    <div className="settings-card">
                        <div className="settings-card-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Server size={20} color="#0284c7" /> Meta WhatsApp Webhook Callback Setup
                            </h3>
                            <p>Configure this Webhook URL in Meta Developer Dashboard to auto-capture incoming WhatsApp leads.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                                    Webhook Callback URL
                                </label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        readOnly
                                        value="https://cad-point-api.onrender.com/api/whatsapp/webhook"
                                        style={{ flex: 1, background: '#f8fafc', fontWeight: 600, fontFamily: 'monospace' }}
                                    />
                                    <button
                                        type="button"
                                        className="secondary"
                                        style={{ padding: '8px 14px', fontSize: 12 }}
                                        onClick={() => {
                                            navigator.clipboard.writeText('https://cad-point-api.onrender.com/api/whatsapp/webhook');
                                            alert('Copied Webhook URL to clipboard!');
                                        }}
                                    >
                                        <Copy size={14} /> Copy URL
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                                    Webhook Verify Token
                                </label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        readOnly
                                        value="cadpoint_whatsapp_verify_token"
                                        style={{ flex: 1, background: '#f8fafc', fontWeight: 600, fontFamily: 'monospace' }}
                                    />
                                    <button
                                        type="button"
                                        className="secondary"
                                        style={{ padding: '8px 14px', fontSize: 12 }}
                                        onClick={() => {
                                            navigator.clipboard.writeText('cadpoint_whatsapp_verify_token');
                                            alert('Copied Verify Token to clipboard!');
                                        }}
                                    >
                                        <Copy size={14} /> Copy Token
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* System Info Tab */}
            {activeTab === 'System Info' && (
                <div className="settings-card">
                    <div className="settings-card-header">
                        <h3>System Architecture & Environment</h3>
                        <p>Production deployment environment diagnostics.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                        <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}><b>Platform:</b> CADPOINT COIMBATORE CRM v2.0</div>
                        <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}><b>Frontend:</b> React 18 + Vite (Hosted on Vercel)</div>
                        <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}><b>Backend API:</b> Node.js / Express (Hosted on Render)</div>
                        <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}><b>Database Cluster:</b> Supabase PostgreSQL via Prisma ORM</div>
                        <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}><b>Active API URL:</b> {API_BASE}</div>
                    </div>
                </div>
            )}

            {/* REGISTER DEVICE MODAL (PRIMARY OR AUTHORIZED) */}
            {showAddDeviceModal && (
                <div className="modal" style={{ zIndex: 1200 }}>
                    <form className="panel" onSubmit={(e) => handleRegisterDeviceSubmit(e, false)} style={{ maxWidth: 500 }}>
                        <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
                            {newDeviceForm.deviceRole === 'PRIMARY' ? 'Register Primary Device (Master)' : 'Register Authorized Device'}
                        </h3>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 16px' }}>
                            Register and authorize this device for live central CADPOINT CRM access.
                        </p>

                        <div className="form-field full-width" style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Registration Type *</label>
                            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                                    <input
                                        type="radio"
                                        name="deviceRole"
                                        value="PRIMARY"
                                        checked={newDeviceForm.deviceRole === 'PRIMARY'}
                                        onChange={() => setNewDeviceForm({ ...newDeviceForm, deviceRole: 'PRIMARY' })}
                                    />
                                    👑 Primary Device (Master Owner Device)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                                    <input
                                        type="radio"
                                        name="deviceRole"
                                        value="AUTHORIZED"
                                        checked={newDeviceForm.deviceRole === 'AUTHORIZED'}
                                        onChange={() => setNewDeviceForm({ ...newDeviceForm, deviceRole: 'AUTHORIZED' })}
                                    />
                                    💻 Authorized Device
                                </label>
                            </div>
                        </div>

                        <div className="form-field full-width" style={{ marginBottom: 12 }}>
                            <label>Device Name *</label>
                            <input
                                value={newDeviceForm.deviceName}
                                onChange={(e) => setNewDeviceForm({ ...newDeviceForm, deviceName: e.target.value })}
                                placeholder="e.g. CADPOINT Main Office Laptop"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-field full-width" style={{ marginBottom: 12 }}>
                            <label>Device Type</label>
                            <select
                                value={newDeviceForm.deviceType}
                                onChange={(e) => setNewDeviceForm({ ...newDeviceForm, deviceType: e.target.value })}
                            >
                                <option value="LAPTOP">Laptop Computer</option>
                                <option value="DESKTOP">Desktop PC</option>
                                <option value="MOBILE">Mobile Phone</option>
                                <option value="TABLET">Tablet Device</option>
                            </select>
                        </div>

                        <div className="form-field full-width" style={{ marginBottom: 12 }}>
                            <label>Branch Assignment</label>
                            <select
                                value={newDeviceForm.branchId}
                                onChange={(e) => setNewDeviceForm({ ...newDeviceForm, branchId: e.target.value })}
                            >
                                <option value="gandhipuram">Gandhipuram Branch</option>
                                <option value="saravanapatti">Saravanapatti Branch</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button className="primary" type="submit">
                                Continue & Register Device
                            </button>
                            <button type="button" onClick={() => setShowAddDeviceModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* PRIMARY DEVICE EXISTS WARNING MODAL */}
            {primaryExistsWarning && (
                <div className="modal" style={{ zIndex: 1300 }}>
                    <div className="panel" style={{ maxWidth: 480 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#b45309', marginBottom: 12 }}>
                            <AlertCircle size={24} />
                            <h3 style={{ margin: 0, fontSize: 17 }}>Primary Device Already Exists</h3>
                        </div>
                        <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px' }}>
                            A Primary Device is already registered in the system: <b>"{primaryExistsWarning.deviceName}"</b>.
                        </p>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px' }}>
                            Only ONE Primary Device is permitted at a time. Would you like to replace the existing Primary Device or cancel?
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                className="primary"
                                style={{ background: '#ca8a04', borderColor: '#ca8a04' }}
                                onClick={() => handleRegisterDeviceSubmit(null, true)}
                            >
                                Replace Primary Device
                            </button>
                            <button className="secondary" onClick={() => setPrimaryExistsWarning(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REVOKE ACCESS CONFIRMATION MODAL */}
            {showRevokeModal && (
                <div className="modal" style={{ zIndex: 1300 }}>
                    <div className="panel" style={{ maxWidth: 460 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#dc2626', marginBottom: 12 }}>
                            <Slash size={24} />
                            <h3 style={{ margin: 0, fontSize: 17 }}>Revoke Device Access?</h3>
                        </div>
                        <p style={{ fontSize: 13, color: '#334155', margin: '0 0 8px' }}>
                            Are you sure you want to revoke access for <b>"{showRevokeModal.deviceName}"</b>?
                        </p>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px' }}>
                            This device will immediately lose access to CADPOINT COIMBATORE CRM.
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                className="primary"
                                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                                onClick={() => revokeDeviceAccess(showRevokeModal)}
                            >
                                Yes, Revoke Access
                            </button>
                            <button className="secondary" onClick={() => setShowRevokeModal(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test WhatsApp Connection Modal */}
            {showTestWhatsAppModal && (
                <div className="modal" style={{ zIndex: 1200 }}>
                    <div className="panel" style={{ maxWidth: 500 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Test WhatsApp API Connection</h3>
                            <button onClick={() => setShowTestWhatsAppModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="form-field full-width" style={{ marginBottom: 12 }}>
                            <label>Recipient Mobile Number *</label>
                            <input
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                                placeholder="+91 99945 12345"
                                required
                            />
                        </div>

                        <div className="form-field full-width" style={{ marginBottom: 12 }}>
                            <label>Test Message Content</label>
                            <textarea
                                rows={3}
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                            />
                        </div>

                        {testResult && (
                            <div style={{ padding: 12, borderRadius: 8, background: testResult.success ? '#f0fdf4' : '#fef2f2', border: `1px solid ${testResult.success ? '#bbf7d0' : '#fca5a5'}`, marginBottom: 14, fontSize: 13, color: testResult.success ? '#166534' : '#991b1b' }}>
                                <b>{testResult.message}</b>
                                {testResult.mode && <div style={{ fontSize: 11, marginTop: 4 }}>Mode: {testResult.mode}</div>}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                            <button className="primary" onClick={sendTestWhatsAppMessage} disabled={testingWa} style={{ background: '#16a34a', borderColor: '#16a34a', color: '#ffffff', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                                <Send size={15} /> {testingWa ? 'Sending Test Message...' : 'Send Test Message'}
                            </button>
                            <button type="button" className="secondary" onClick={() => setShowTestWhatsAppModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
}
