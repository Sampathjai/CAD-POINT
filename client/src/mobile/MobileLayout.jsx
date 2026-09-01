import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  CalendarDays, 
  BookOpen, 
  GraduationCap, 
  ArrowUpRight, 
  WalletCards, 
  BarChart3, 
  UserCheck, 
  Settings, 
  Plus, 
  Bell, 
  Menu, 
  X, 
  Search, 
  Moon, 
  Sun, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  Building,
  Check,
  ChevronDown
} from 'lucide-react';
import { MobileBottomSheet } from './MobileBottomSheet';
import { hasPermission, getDefaultPageForRole } from '../permissions';

export function MobileLayout({
  page,
  setPage,
  user,
  token,
  activeBranch,
  setActiveBranch,
  branchesList = [],
  theme,
  toggleTheme,
  logout,
  leadsCount = 0,
  followupsCount = 0,
  notifications = [],
  onOpenAddModal,
  onOpenSearch,
  children
}) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showQuickAddSheet, setShowQuickAddSheet] = useState(false);
  const [showNotificationsSheet, setShowNotificationsSheet] = useState(false);
  const [showBranchSheet, setShowBranchSheet] = useState(false);

  const allNavItems = [
    { name: 'Dashboard', label: 'Home', icon: LayoutDashboard, primary: true },
    { name: 'Leads', label: 'Leads', icon: UsersIcon, primary: true, badge: leadsCount },
    { name: 'Follow-ups', label: 'Follow-ups', icon: CalendarDays, primary: true, badge: followupsCount },
    { name: 'Students', label: 'Students', icon: GraduationCap, primary: true },
    { name: 'Courses', label: 'Courses', icon: BookOpen },
    { name: 'Batches', label: 'Batches', icon: CalendarDays },
    { name: 'Admissions', label: 'Admissions', icon: ArrowUpRight },
    { name: 'Payments', label: 'Payments', icon: WalletCards },
    { name: 'Reports', label: 'Reports', icon: BarChart3 },
    { name: 'Users', label: 'Users', icon: UserCheck },
    { name: 'Settings', label: 'Settings', icon: Settings }
  ];

  const allowedNavItems = allNavItems.filter(item => hasPermission(user?.role, item.name));

  function handleNavigate(targetPage) {
    setPage(targetPage);
    setShowMoreMenu(false);
  }

  function handleQuickAdd(targetPage) {
    setShowQuickAddSheet(false);
    onOpenAddModal(targetPage);
  }

  const activeBranchObj = (branchesList || []).find(b => (b.code ? b.code.toLowerCase() : b.id) === activeBranch);
  const activeBranchName = activeBranch === 'all' ? 'All Branches' : (activeBranchObj ? activeBranchObj.name : (activeBranch === 'saravanapatti' ? 'Saravanapatti' : 'Gandhipuram'));

  const userInitials = (user?.name || 'SK').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="mobile-app">
      {/* Mobile Top Sticky Header */}
      <header className="mobile-header">
        <div className="mobile-header-left">
          <div className="mobile-brand-logo">CP</div>
          <div className="mobile-header-title-box">
            <span className="mobile-header-page-title">{page === 'Dashboard' ? 'Dashboard' : page}</span>
            {/* Branch Selector Pill */}
            <button className="mobile-branch-pill-btn" onClick={() => setShowBranchSheet(true)}>
              <Building size={11} />
              <span>{activeBranchName}</span>
              <ChevronDown size={11} />
            </button>
          </div>
        </div>

        <div className="mobile-header-right">
          {/* Search Button */}
          <button className="mobile-header-btn" onClick={onOpenSearch} aria-label="Search">
            <Search size={18} />
          </button>

          {/* Notification Bell */}
          <button 
            className="mobile-header-btn mobile-notif-btn" 
            onClick={() => setShowNotificationsSheet(true)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {notifications.length > 0 && <span className="mobile-notif-badge">{notifications.length}</span>}
          </button>

          {/* User Profile Avatar */}
          <div className="mobile-header-avatar" onClick={() => setShowMoreMenu(true)}>
            {userInitials}
          </div>
        </div>
      </header>

      {/* Main Page View Container */}
      <main className="mobile-main-content">
        {!hasPermission(user?.role, page) ? (
          <div className="mobile-restricted-view">
            <div className="mobile-restricted-card">
              <div className="mobile-restricted-icon">
                <ShieldCheck size={32} />
              </div>
              <h2>Access Restricted</h2>
              <p>Your role (<b>{user?.role || 'User'}</b>) does not have permission to view <b>{page}</b>.</p>
              <button 
                className="mobile-btn-primary" 
                onClick={() => setPage(getDefaultPageForRole(user?.role))}
              >
                Return to {getDefaultPageForRole(user?.role)}
              </button>
            </div>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Safe-Area Aware Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`mobile-nav-item ${page === 'Dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigate('Dashboard')}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </button>

        {hasPermission(user?.role, 'Leads') && (
          <button 
            className={`mobile-nav-item ${page === 'Leads' ? 'active' : ''}`}
            onClick={() => handleNavigate('Leads')}
          >
            <div className="mobile-nav-icon-wrap">
              <UsersIcon size={20} />
              {leadsCount > 0 && <span className="mobile-nav-badge">{leadsCount}</span>}
            </div>
            <span>Leads</span>
          </button>
        )}

        {/* Center Floating Quick Add Action Button */}
        <button 
          className="mobile-nav-add-btn"
          onClick={() => setShowQuickAddSheet(true)}
          aria-label="Quick Add"
        >
          <Plus size={24} />
        </button>

        {hasPermission(user?.role, 'Follow-ups') && (
          <button 
            className={`mobile-nav-item ${page === 'Follow-ups' ? 'active' : ''}`}
            onClick={() => handleNavigate('Follow-ups')}
          >
            <div className="mobile-nav-icon-wrap">
              <CalendarDays size={20} />
              {followupsCount > 0 && <span className="mobile-nav-badge">{followupsCount}</span>}
            </div>
            <span>Follow-ups</span>
          </button>
        )}

        {hasPermission(user?.role, 'Students') && (
          <button 
            className={`mobile-nav-item ${page === 'Students' ? 'active' : ''}`}
            onClick={() => handleNavigate('Students')}
          >
            <GraduationCap size={20} />
            <span>Students</span>
          </button>
        )}

        <button 
          className={`mobile-nav-item ${showMoreMenu || !['Dashboard', 'Leads', 'Follow-ups', 'Students'].includes(page) ? 'active' : ''}`}
          onClick={() => setShowMoreMenu(true)}
        >
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>

      {/* Branch Selection Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showBranchSheet}
        onClose={() => setShowBranchSheet(false)}
        title="Select Active Branch"
      >
        <div className="mobile-branch-list">
          {(branchesList && branchesList.length > 0 ? branchesList : [
            { id: 'gandhipuram', name: 'Gandhipuram Branch', code: 'gandhipuram' },
            { id: 'saravanapatti', name: 'Saravanapatti Branch', code: 'saravanapatti' }
          ]).map((b) => {
            const bCode = (b.code ? b.code.toLowerCase() : b.id);
            const isSelected = activeBranch === bCode;
            return (
              <button
                key={b.id}
                className={`mobile-branch-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setActiveBranch(bCode);
                  localStorage.setItem('cadpoint_branch', bCode);
                  setShowBranchSheet(false);
                }}
              >
                <div className="mobile-branch-item-text">
                  <Building size={16} />
                  <b>{b.name}</b>
                </div>
                {isSelected && <Check size={18} className="text-emerald" />}
              </button>
            );
          })}

          {user?.role === 'SUPER_ADMIN' && (
            <button
              className={`mobile-branch-item ${activeBranch === 'all' ? 'selected' : ''}`}
              onClick={() => {
                setActiveBranch('all');
                localStorage.setItem('cadpoint_branch', 'all');
                setShowBranchSheet(false);
              }}
            >
              <div className="mobile-branch-item-text">
                <Building size={16} />
                <b>All Branches (Combined)</b>
              </div>
              {activeBranch === 'all' && <Check size={18} className="text-emerald" />}
            </button>
          )}
        </div>
      </MobileBottomSheet>

      {/* Quick Add Bottom Sheet */}
      <MobileBottomSheet 
        isOpen={showQuickAddSheet} 
        onClose={() => setShowQuickAddSheet(false)}
        title="Quick Actions"
      >
        <div className="mobile-quick-add-grid">
          {hasPermission(user?.role, 'Leads') && (
            <button className="mobile-quick-add-card" onClick={() => handleQuickAdd('Leads')}>
              <div className="mobile-quick-add-icon bg-blue">
                <UsersIcon size={22} />
              </div>
              <b>+ Add New Lead</b>
              <span>Register new prospect</span>
            </button>
          )}

          {hasPermission(user?.role, 'Follow-ups') && (
            <button className="mobile-quick-add-card" onClick={() => handleQuickAdd('Follow-ups')}>
              <div className="mobile-quick-add-icon bg-purple">
                <CalendarDays size={22} />
              </div>
              <b>+ Schedule Follow-up</b>
              <span>Set call or meeting</span>
            </button>
          )}

          {hasPermission(user?.role, 'Students') && (
            <button className="mobile-quick-add-card" onClick={() => handleQuickAdd('Students')}>
              <div className="mobile-quick-add-icon bg-emerald">
                <GraduationCap size={22} />
              </div>
              <b>+ Register Student</b>
              <span>New student record</span>
            </button>
          )}

          {hasPermission(user?.role, 'Admissions') && (
            <button className="mobile-quick-add-card" onClick={() => handleQuickAdd('Admissions')}>
              <div className="mobile-quick-add-icon bg-amber">
                <ArrowUpRight size={22} />
              </div>
              <b>+ Create Admission</b>
              <span>Enroll student to course</span>
            </button>
          )}

          {hasPermission(user?.role, 'Payments') && (
            <button className="mobile-quick-add-card" onClick={() => handleQuickAdd('Payments')}>
              <div className="mobile-quick-add-icon bg-teal">
                <WalletCards size={22} />
              </div>
              <b>+ Record Payment</b>
              <span>Collect fee payment</span>
            </button>
          )}

          {hasPermission(user?.role, 'Batches') && (
            <button className="mobile-quick-add-card" onClick={() => handleQuickAdd('Batches')}>
              <div className="mobile-quick-add-icon bg-indigo">
                <CalendarDays size={22} />
              </div>
              <b>+ Create Batch</b>
              <span>New class schedule</span>
            </button>
          )}
        </div>
      </MobileBottomSheet>

      {/* More Menu Drawer */}
      <MobileBottomSheet
        isOpen={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        title="CRM Navigation"
        maxHeight="90vh"
      >
        <div className="mobile-user-profile-card">
          <div className="mobile-user-avatar">{userInitials}</div>
          <div className="mobile-user-info">
            <b>{user?.name || 'User'}</b>
            <span>{user?.role || 'COUNSELLOR'}</span>
          </div>
          <button className="mobile-logout-btn" onClick={logout} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>

        <div className="mobile-menu-section-title">WORKSPACE MODULES</div>

        <div className="mobile-menu-list">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = page === item.name;
            return (
              <button
                key={item.name}
                className={`mobile-menu-item ${isCurrent ? 'active' : ''}`}
                onClick={() => handleNavigate(item.name)}
              >
                <div className="mobile-menu-item-left">
                  <Icon size={18} />
                  <span>{item.name}</span>
                </div>
                <div className="mobile-menu-item-right">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="mobile-menu-badge">{item.badge}</span>
                  )}
                  <ChevronRight size={16} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mobile-menu-section-title" style={{ marginTop: 16 }}>SYSTEM & THEME</div>
        <div className="mobile-menu-list">
          <button className="mobile-menu-item" onClick={toggleTheme}>
            <div className="mobile-menu-item-left">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>Theme: <b>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</b></span>
            </div>
          </button>
        </div>
      </MobileBottomSheet>

      {/* Notifications Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showNotificationsSheet}
        onClose={() => setShowNotificationsSheet(false)}
        title="Notifications"
      >
        <div className="mobile-notif-list">
          {notifications.length === 0 ? (
            <div className="mobile-empty-state">
              <Bell size={32} />
              <p>No new notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="mobile-notif-card">
                <b>{n.title}</b>
                <p>{n.message}</p>
                <small>{n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</small>
              </div>
            ))
          )}
        </div>
      </MobileBottomSheet>
    </div>
  );
}
