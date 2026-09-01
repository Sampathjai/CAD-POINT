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
  ChevronDown,
  Layers
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
    hasPermission(user, 'adminDashboard') && { name: 'Admin Dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    hasPermission(user, 'leadsDashboard') && { name: 'Leads Dashboard', label: 'Leads Dashboard', icon: LayoutDashboard },
    hasPermission(user, 'leads') && { name: 'Leads', label: 'Leads', icon: UsersIcon, badge: leadsCount },
    hasPermission(user, 'followups') && { name: 'Follow-ups', label: 'Follow-ups', icon: CalendarDays, badge: followupsCount },
    hasPermission(user, 'courses') && { name: 'Courses', label: 'Courses', icon: BookOpen },
    hasPermission(user, 'batches') && { name: 'Batches', label: 'Batches', icon: CalendarDays },
    hasPermission(user, 'students') && { name: 'Students', label: 'Students', icon: GraduationCap },
    hasPermission(user, 'admissions') && { name: 'Admissions', label: 'Admissions', icon: ArrowUpRight },
    hasPermission(user, 'payments') && { name: 'Payments', label: 'Payments', icon: WalletCards },
    hasPermission(user, 'reports') && { name: 'Reports', label: 'Reports', icon: BarChart3 },
    hasPermission(user, 'userControl') && { name: 'Users', label: 'Users', icon: UserCheck },
    hasPermission(user, 'adminSettings') && { name: 'Admin Settings', label: 'Admin Settings', icon: Settings },
    hasPermission(user, 'userSettings') && !hasPermission(user, 'adminSettings') && { name: 'Settings', label: 'Settings', icon: Settings }
  ].filter(Boolean);

  const allowedNavItems = allNavItems;

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
          {/* Quick Add Button */}
          <button className="mobile-header-btn text-emerald" onClick={() => setShowQuickAddSheet(true)} aria-label="Quick Add">
            <Plus size={20} />
          </button>

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
        {!hasPermission(user, page) ? (
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

      {/* Horizontally Scrollable Safe-Area Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav scrollable">
        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.name;
          return (
            <button 
              key={item.name}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavigate(item.name)}
            >
              <div className="mobile-nav-icon-wrap">
                <Icon size={19} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="mobile-nav-badge">{item.badge}</span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
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
          {hasPermission(user, 'Leads') && (
            <button className="mobile-quick-add-card" onClick={() => handleQuickAdd('Leads')}>
              <div className="mobile-quick-add-icon bg-blue">
                <UsersIcon size={20} />
              </div>
              <div className="mobile-quick-add-text">
                <b>Add New Lead</b>
                <span>Register new prospect</span>
              </div>
              <ChevronRight size={18} className="mobile-quick-add-chevron" />
            </button>
          )}

          {hasPermission(user, 'Follow-ups') && (
            <button className="mobile-quick-add-card" onClick={() => handleQuickAdd('Follow-ups')}>
              <div className="mobile-quick-add-icon bg-purple">
                <CalendarDays size={20} />
              </div>
              <div className="mobile-quick-add-text">
                <b>Schedule Follow-up</b>
                <span>Set call or meeting</span>
              </div>
              <ChevronRight size={18} className="mobile-quick-add-chevron" />
            </button>
          )}

          {hasPermission(user, 'Students') && (
            <button className="mobile-quick-add-card" onClick={() => handleQuickAdd('Students')}>
              <div className="mobile-quick-add-icon bg-emerald">
                <GraduationCap size={20} />
              </div>
              <div className="mobile-quick-add-text">
                <b>Register Student</b>
                <span>New student record</span>
              </div>
              <ChevronRight size={18} className="mobile-quick-add-chevron" />
            </button>
          )}

          {hasPermission(user, 'Admissions') && (
            <button className="mobile-quick-add-card" onClick={() => handleQuickAdd('Admissions')}>
              <div className="mobile-quick-add-icon bg-amber">
                <ArrowUpRight size={20} />
              </div>
              <div className="mobile-quick-add-text">
                <b>Create Admission</b>
                <span>Enroll student to course</span>
              </div>
              <ChevronRight size={18} className="mobile-quick-add-chevron" />
            </button>
          )}

          {hasPermission(user, 'Payments') && (
            <button className="mobile-quick-add-card" onClick={() => handleQuickAdd('Payments')}>
              <div className="mobile-quick-add-icon bg-teal">
                <WalletCards size={20} />
              </div>
              <div className="mobile-quick-add-text">
                <b>Record Payment</b>
                <span>Collect fee payment</span>
              </div>
              <ChevronRight size={18} className="mobile-quick-add-chevron" />
            </button>
          )}

          {hasPermission(user, 'Batches') && (
            <button className="mobile-quick-add-card" onClick={() => handleQuickAdd('Batches')}>
              <div className="mobile-quick-add-icon bg-indigo">
                <CalendarDays size={20} />
              </div>
              <div className="mobile-quick-add-text">
                <b>Create Batch</b>
                <span>New class schedule</span>
              </div>
              <ChevronRight size={18} className="mobile-quick-add-chevron" />
            </button>
          )}
        </div>
      </MobileBottomSheet>

      {/* More Menu Drawer */}
      <MobileBottomSheet
        isOpen={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        title="Account & Preferences"
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

        <div className="mobile-menu-section-title">SYSTEM & THEME</div>
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
