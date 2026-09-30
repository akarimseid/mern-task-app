import React, { useState } from 'react';
import { DashboardIcon, PlusIcon, TasksIcon, LogOutIcon, ShieldCheckIcon, MenuIcon, XIcon } from './Icons.jsx';

export default function Navbar({
  activeTab,
  onTabChange,
  activeCount,
  user,
  onLogout,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const handleNavClick = (tab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar sticky-top">
      <div className="container-xl navbar-inner d-flex align-items-center justify-content-between">
        {/* Brand */}
        <div className="brand" onClick={() => handleNavClick('dashboard')}>
          <div className="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="brand-name">MyTasks</span>
              <span className="brand-badge">{user?.role === 'admin' ? 'ADMIN' : 'PRO'}</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="nav-tabs d-none d-lg-flex" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <DashboardIcon size={16} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => handleNavClick('schedule')}
          >
            <PlusIcon size={16} />
            <span>Schedule Task</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => handleNavClick('tasks')}
          >
            <TasksIcon size={16} />
            <span>Tasks</span>
            {user && activeCount > 0 && (
              <span className="nav-count-badge">{activeCount}</span>
            )}
          </button>

          {/* ADMIN PORTAL TAB (Visible to Administrators) */}
          {user?.role === 'admin' && (
            <button
              type="button"
              className={`nav-tab-btn admin-nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleNavClick('admin')}
              title="Administrator Management Portal"
            >
              <ShieldCheckIcon size={16} color="var(--accent-purple, #c084fc)" />
              <span>Admin Portal</span>
            </button>
          )}
        </nav>

        {/* Desktop User Section */}
        <div className="nav-user d-none d-lg-flex align-items-center gap-2">
          {user ? (
            <>
              <div
                className="user-pill"
                title={`Signed in as ${user.email} (${user.role || 'user'})`}
                onClick={() => user.role === 'admin' && handleNavClick('admin')}
                style={{ cursor: user.role === 'admin' ? 'pointer' : 'default' }}
              >
                <div
                  className="user-avatar"
                  style={user.role === 'admin' ? { background: 'linear-gradient(135deg, #a855f7, #6366f1)' } : undefined}
                >
                  {getInitial(user.name)}
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span className="user-name">{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="admin-tag-pill">ADMIN</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="logout-btn"
                onClick={onLogout}
                title="Sign out of your account"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <LogOutIcon size={14} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => handleNavClick('auth')}
              style={{ padding: '0.45rem 1.15rem', borderRadius: 'var(--radius-full)' }}
            >
              Sign In / Register
            </button>
          )}
        </div>

        {/* Mobile Header Controls (< 992px) */}
        <div className="d-flex d-lg-none align-items-center gap-2">
          {user && (
            <div
              className="user-avatar"
              title={user.name}
              onClick={() => handleNavClick(user.role === 'admin' ? 'admin' : 'dashboard')}
              style={{ cursor: 'pointer', width: '32px', height: '32px', fontSize: '0.85rem' }}
            >
              {getInitial(user.name)}
            </div>
          )}

          {user && activeCount > 0 && (
            <span
              className="badge bg-primary rounded-pill px-2 py-1"
              style={{ fontSize: '0.75rem', cursor: 'pointer' }}
              onClick={() => handleNavClick('tasks')}
            >
              {activeCount}
            </span>
          )}

          <button
            type="button"
            className="mobile-toggler-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer d-lg-none animate-fade-in">
          <div className="container-xl d-flex flex-column gap-2 py-3">
            <button
              type="button"
              className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('dashboard')}
            >
              <DashboardIcon size={18} />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              className={`mobile-nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => handleNavClick('schedule')}
            >
              <PlusIcon size={18} />
              <span>Schedule Task</span>
            </button>

            <button
              type="button"
              className={`mobile-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => handleNavClick('tasks')}
            >
              <TasksIcon size={18} />
              <span className="flex-grow-1 text-start">Tasks</span>
              {user && activeCount > 0 && (
                <span className="badge bg-primary rounded-pill">{activeCount}</span>
              )}
            </button>

            {user?.role === 'admin' && (
              <button
                type="button"
                className={`mobile-nav-item admin-item ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin')}
              >
                <ShieldCheckIcon size={18} color="#c084fc" />
                <span className="flex-grow-1 text-start">Admin Portal</span>
                <span className="admin-tag-pill">ADMIN</span>
              </button>
            )}

            <div className="mobile-user-section pt-3 mt-1 border-top border-secondary-subtle">
              {user ? (
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <div className="user-avatar">{getInitial(user.name)}</div>
                    <div>
                      <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{user.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.email}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger d-inline-flex align-items-center gap-1"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOutIcon size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary w-100 py-2"
                  onClick={() => handleNavClick('auth')}
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
