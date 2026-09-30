import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api.js';
import { formatDateTime, formatDateFull } from '../utils/dateUtils.js';
import {
  ShieldCheckIcon,
  UsersIcon,
  DashboardIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SearchIcon,
  TrashIcon,
  RotateCcwIcon,
  EditIcon,
  ClockIcon,
  FlameIcon,
  ZapIcon,
  LeafIcon,
  PaperclipIcon,
  VideoIcon,
  FileTextIcon,
  XIcon,
  UserIcon,
  DatabaseIcon,
  ActivityIcon,
  TrendingUpIcon,
  DownloadIcon,
  PlusIcon,
  ArrowRightIcon,
  ImageIcon,
} from './Icons.jsx';

export default function AdminPage({
  user,
  onNavigate,
  onViewAttachment,
  onUserRoleChange,
}) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'users' | 'tasks' | 'health'
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'admin' | 'active' | 'idle'
  const [taskSearch, setTaskSearch] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');

  const showNotification = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, usersData, tasksData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(userSearch),
        api.getAdminTasks({
          search: taskSearch,
          priority: taskPriorityFilter,
          status: taskStatusFilter,
        }),
      ]);
      setStats(statsData);
      setUsersList(usersData);
      setTasksList(tasksData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load administrator data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user, userSearch, taskPriorityFilter, taskStatusFilter]);

  // Handle User Role Toggle
  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const confirmMsg =
      newRole === 'admin'
        ? `Grant administrator privileges to ${targetUser.name}?`
        : `Demote ${targetUser.name} back to regular user?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.updateUserRole(targetUser._id, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, role: newRole } : u))
      );
      if (stats) {
        setStats((prev) => ({
          ...prev,
          adminCount: newRole === 'admin' ? prev.adminCount + 1 : prev.adminCount - 1,
        }));
      }
      showNotification(`Updated ${targetUser.name}'s role to ${newRole.toUpperCase()}.`);
    } catch (err) {
      alert(err.message || 'Failed to update user role');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (targetUser) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete user "${targetUser.name}" (${targetUser.email}) and ALL their tasks? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.deleteAdminUser(targetUser._id);
      setUsersList((prev) => prev.filter((u) => u._id !== targetUser._id));
      showNotification(`User ${targetUser.name} and their records were deleted.`);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Handle Delete Task by Admin
  const handleDeleteTask = async (taskId, taskTitle) => {
    if (!window.confirm(`Delete task "${taskTitle}" from the platform?`)) return;

    try {
      await api.deleteAdminTask(taskId);
      setTasksList((prev) => prev.filter((t) => t._id !== taskId));
      showNotification(`Task "${taskTitle}" removed by administrator.`);
      if (stats) {
        setStats((prev) => ({
          ...prev,
          totalTasks: Math.max(0, prev.totalTasks - 1),
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  // Handle Self-Claim Admin in dev if needed
  const handleClaimAdmin = async () => {
    try {
      const updatedUser = await api.claimAdmin();
      if (onUserRoleChange) onUserRoleChange(updatedUser);
      showNotification('Administrator privileges activated!');
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to claim administrator privileges');
    }
  };

  // Export Users CSV
  const handleExportUsersCSV = () => {
    if (!usersList.length) return;
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Total Tasks', 'Completed Tasks', 'Joined Date'];
    const rows = usersList.map((u) => [
      `"${u._id}"`,
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      u.tasksCount || 0,
      u.completedTasksCount || 0,
      `"${new Date(u.createdAt).toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mytasks_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Users directory exported to CSV.');
  };

  // Export Tasks CSV
  const handleExportTasksCSV = () => {
    if (!tasksList.length) return;
    const headers = ['Task ID', 'Title', 'Priority', 'Status', 'Owner Name', 'Owner Email', 'Due Date', 'Created Date'];
    const rows = tasksList.map((t) => [
      `"${t._id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${t.user?.name || 'Unknown'}"`,
      `"${t.user?.email || 'N/A'}"`,
      `"${t.dueDate ? new Date(t.dueDate).toISOString() : ''}"`,
      `"${new Date(t.createdAt).toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mytasks_tasks_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Tasks audit log exported to CSV.');
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (userRoleFilter === 'admin' && u.role !== 'admin') return false;
      if (userRoleFilter === 'active' && (!u.tasksCount || u.tasksCount === 0)) return false;
      if (userRoleFilter === 'idle' && u.tasksCount > 0) return false;
      return true;
    });
  }, [usersList, userRoleFilter]);

  // Max value in 7-day trend chart for scale
  const maxTrendVal = useMemo(() => {
    if (!stats?.last7DaysTrend) return 10;
    const max = Math.max(
      ...stats.last7DaysTrend.map((d) => Math.max(d.created, d.completed, d.signups)),
      1
    );
    return Math.max(max, 5);
  }, [stats?.last7DaysTrend]);

  // 7-day summary totals
  const trendTotals = useMemo(() => {
    if (!stats?.last7DaysTrend) return { created: 0, completed: 0, signups: 0, ratio: '0' };
    const created = stats.last7DaysTrend.reduce((acc, d) => acc + (d.created || 0), 0);
    const completed = stats.last7DaysTrend.reduce((acc, d) => acc + (d.completed || 0), 0);
    const signups = stats.last7DaysTrend.reduce((acc, d) => acc + (d.signups || 0), 0);
    const ratio = created > 0 ? (completed / created).toFixed(2) : (completed > 0 ? '1.0' : '0');
    return { created, completed, signups, ratio };
  }, [stats?.last7DaysTrend]);

  // Status breakdown percentages
  const statusPercentages = useMemo(() => {
    if (!stats || !stats.totalTasks) return { completed: 0, inProgress: 0, pending: 0 };
    const total = stats.totalTasks;
    return {
      completed: Math.round(((stats.completedTasks || 0) / total) * 100),
      inProgress: Math.round(((stats.inProgressTasks || 0) / total) * 100),
      pending: Math.round(((stats.pendingTasks || 0) / total) * 100),
    };
  }, [stats]);

  // Priority breakdown percentages
  const priorityPercentages = useMemo(() => {
    if (!stats || !stats.totalTasks) return { high: 0, medium: 0, low: 0 };
    const total = stats.totalTasks;
    return {
      high: Math.round(((stats.highPriorityTasks || 0) / total) * 100),
      medium: Math.round(((stats.mediumPriorityTasks || 0) / total) * 100),
      low: Math.round(((stats.lowPriorityTasks || 0) / total) * 100),
    };
  }, [stats]);

  // If user is not admin
  if (user?.role !== 'admin') {
    return (
      <div className="admin-page-view animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '640px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ color: 'var(--accent-rose)', marginBottom: '1.25rem' }}>
            <ShieldCheckIcon size={56} />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.65rem' }}>Administrator Access Required</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1.75rem' }}>
            This section is restricted to system administrators. Click the button below to grant admin privileges to your current account.
          </p>
          <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleClaimAdmin}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <ShieldCheckIcon size={16} />
              <span>Claim Admin Privileges</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-view animate-fade-in">
      {/* Header Banner */}
      <div className="user-dashboard-banner admin-banner">
        <div className="banner-left">
          <div className="banner-avatar" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
            <ShieldCheckIcon size={24} color="#ffffff" />
          </div>
          <div>
            <span className="banner-badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', borderColor: 'rgba(168, 85, 247, 0.35)' }}>
              Root Administrator Control Center
            </span>
            <h1 className="banner-greeting">
              Platform Intelligence & Governance
            </h1>
            <p className="banner-desc">
              Monitor real-time task velocity, audit registered accounts, track storage footprint, and moderate system data.
            </p>
          </div>
        </div>

        <div className="banner-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadAdminData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <RotateCcwIcon size={14} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* Floating Action Banner */}
      {actionSuccess && (
        <div className="alert-banner animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)', color: '#6ee7b7', margin: '1rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircleIcon size={16} color="var(--accent-emerald)" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            className="toast-dismiss-btn"
            onClick={() => setActionSuccess(null)}
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* TOP 5 GLOBAL PLATFORM KPI CARDS */}
      <div className="row g-2 g-md-3 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-5 mt-3 mb-4">
        {/* 1. Total Registered Users */}
        <div className="col">
          <div className="stat-card h-100 w-100">
            <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <UsersIcon size={22} />
            </div>
            <div>
              <div className="stat-value">{stats ? stats.totalUsers : '...'}</div>
              <div className="stat-label">Total Users</div>
              <div className="stat-subtext">
                {stats ? `${stats.usersWithTasksCount} active • ${stats.idleUsersCount} idle` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Platform Tasks Volume */}
        <div className="col">
          <div className="stat-card h-100 w-100">
            <div className="stat-icon primary">
              <DashboardIcon size={22} color="var(--primary)" />
            </div>
            <div>
              <div className="stat-value">{stats ? stats.totalTasks : '...'}</div>
              <div className="stat-label">Platform Tasks</div>
              <div className="stat-subtext">
                {stats ? `${stats.avgTasksPerUser} tasks / user avg` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Platform Completion Rate */}
        <div className="col">
          <div className="stat-card h-100 w-100">
            <div className="stat-icon success">
              <CheckCircleIcon size={22} color="var(--accent-emerald)" />
            </div>
            <div>
              <div className="stat-value">{stats ? `${stats.completionRate}%` : '...'}</div>
              <div className="stat-label">Completion Velocity</div>
              <div className="stat-subtext">
                {stats ? `${stats.completedTasks} accomplished` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Overdue Tasks System-Wide */}
        <div className="col">
          <div className={`stat-card h-100 w-100 ${stats && stats.overdueTasks > 0 ? 'stat-card-alert' : ''}`}>
            <div className="stat-icon warning" style={{ background: stats && stats.overdueTasks > 0 ? 'rgba(244, 63, 94, 0.15)' : undefined }}>
              <AlertTriangleIcon
                size={22}
                color={stats && stats.overdueTasks > 0 ? 'var(--accent-rose)' : 'var(--accent-amber)'}
              />
            </div>
            <div>
              <div className="stat-value" style={{ color: stats && stats.overdueTasks > 0 ? 'var(--accent-rose)' : undefined }}>
                {stats ? stats.overdueTasks : '...'}
              </div>
              <div className="stat-label">Global Overdue</div>
              <div className="stat-subtext">
                {stats && stats.overdueTasks > 0 ? 'Requires attention' : 'All deadlines met'}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Storage Footprint */}
        <div className="col">
          <div className="stat-card h-100 w-100">
            <div className="stat-icon info">
              <DatabaseIcon size={22} color="var(--accent-cyan)" />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: '1.35rem' }}>
                {stats ? `${(stats.totalAttachmentBytes / 1024).toFixed(0)} KB` : '...'}
              </div>
              <div className="stat-label">Storage Footprint</div>
              <div className="stat-subtext">
                {stats ? `${stats.totalAttachments} media files` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Sub-Tabs Navigation */}
      <div className="admin-tabs-nav" style={{ marginTop: '2rem' }}>
        <button
          type="button"
          className={`admin-tab-btn ${activeSubTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('overview')}
        >
          <TrendingUpIcon size={16} />
          <span>Executive Analytics & Trends</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeSubTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('users')}
        >
          <UsersIcon size={16} />
          <span>User Intelligence ({usersList.length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeSubTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('tasks')}
        >
          <DashboardIcon size={16} />
          <span>Global Task Moderation ({tasksList.length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeSubTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('health')}
        >
          <ActivityIcon size={16} />
          <span>System Health & Audit Feed</span>
        </button>
      </div>

      {/* SUB-TAB 1: EXECUTIVE ANALYTICS & VELOCITY TRENDS */}
      {activeSubTab === 'overview' && (
        <div className="admin-overview-section animate-fade-in" style={{ marginTop: '1.25rem' }}>
          {/* 7-Day Velocity & Activity Chart */}
          <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
            <div className="panel-title-row" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h3 className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <TrendingUpIcon size={18} color="var(--primary)" />
                  <span>7-Day Platform Velocity Trend</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Daily comparison of task creations, task completions, and user registrations over the past 7 days.
                </p>
              </div>

              {/* Chart Legend */}
              <div className="chart-legend-row">
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: '#818cf8' }}></span>
                  <span>Tasks Created</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: '#34d399' }}></span>
                  <span>Accomplished</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: '#c084fc' }}></span>
                  <span>Signups</span>
                </div>
              </div>
            </div>

            {/* 7-Day Velocity Metric Badges */}
            <div className="trend-summary-pills-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="trend-summary-card">
                <span className="trend-pill-label">Created (7d)</span>
                <span className="trend-pill-val" style={{ color: '#818cf8' }}>{trendTotals.created} tasks</span>
              </div>
              <div className="trend-summary-card">
                <span className="trend-pill-label">Completed (7d)</span>
                <span className="trend-pill-val" style={{ color: '#34d399' }}>{trendTotals.completed} tasks</span>
              </div>
              <div className="trend-summary-card">
                <span className="trend-pill-label">Velocity Ratio</span>
                <span className="trend-pill-val" style={{ color: '#38bdf8' }}>{trendTotals.ratio}x</span>
              </div>
              <div className="trend-summary-card">
                <span className="trend-pill-label">New Signups (7d)</span>
                <span className="trend-pill-val" style={{ color: '#c084fc' }}>{trendTotals.signups} users</span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="admin-trend-chart">
              {stats?.last7DaysTrend?.map((day, idx) => {
                const createdHeight = Math.max(8, (day.created / maxTrendVal) * 120);
                const completedHeight = Math.max(8, (day.completed / maxTrendVal) * 120);
                const signupsHeight = Math.max(8, (day.signups / maxTrendVal) * 120);

                return (
                  <div key={idx} className="chart-column">
                    <div className="chart-bars-wrap">
                      {/* Bar 1: Created */}
                      <div
                        className="trend-bar bar-created"
                        style={{ height: `${createdHeight}px` }}
                        title={`${day.label}: ${day.created} created`}
                      >
                        <span className="bar-hover-val">{day.created}</span>
                      </div>

                      {/* Bar 2: Completed */}
                      <div
                        className="trend-bar bar-completed"
                        style={{ height: `${completedHeight}px` }}
                        title={`${day.label}: ${day.completed} completed`}
                      >
                        <span className="bar-hover-val">{day.completed}</span>
                      </div>

                      {/* Bar 3: Signups */}
                      <div
                        className="trend-bar bar-signups"
                        style={{ height: `${signupsHeight}px` }}
                        title={`${day.label}: ${day.signups} signups`}
                      >
                        <span className="bar-hover-val">{day.signups}</span>
                      </div>
                    </div>
                    <span className="chart-day-label">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Work Breakdown Analytics: Status Distribution & Priority Distribution */}
          <div className="row g-3 g-lg-4 mb-4">
            {/* 1. Status Density & Lifecycle */}
            <div className="col-12 col-lg-6">
              <div className="glass-panel h-100">
                <div className="panel-title-row" style={{ marginBottom: '0.75rem' }}>
                  <h3 className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckCircleIcon size={18} color="var(--accent-emerald)" />
                    <span>Work Status Distribution</span>
                  </h3>
                  <span className="meta-badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe' }}>
                    {stats?.totalTasks || 0} Total Tasks
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Platform-wide breakdown across completion states
                </p>

                {/* Segmented Progress Bar */}
                <div className="segmented-bar-track">
                  <div
                    className="segmented-bar-segment"
                    style={{ width: `${statusPercentages.completed}%`, background: 'var(--accent-emerald)' }}
                    title={`Completed: ${statusPercentages.completed}%`}
                  />
                  <div
                    className="segmented-bar-segment"
                    style={{ width: `${statusPercentages.inProgress}%`, background: 'var(--primary)' }}
                    title={`In-Progress: ${statusPercentages.inProgress}%`}
                  />
                  <div
                    className="segmented-bar-segment"
                    style={{ width: `${statusPercentages.pending}%`, background: '#64748b' }}
                    title={`Pending: ${statusPercentages.pending}%`}
                  />
                </div>

                {/* Numerical breakdown items */}
                <div className="breakdown-pills-row" style={{ marginTop: '1rem' }}>
                  <div className="breakdown-stat-chip">
                    <span className="breakdown-dot" style={{ background: 'var(--accent-emerald)' }}></span>
                    <span className="breakdown-name">Completed</span>
                    <strong className="breakdown-count">{stats?.completedTasks || 0} ({statusPercentages.completed}%)</strong>
                  </div>
                  <div className="breakdown-stat-chip">
                    <span className="breakdown-dot" style={{ background: 'var(--primary)' }}></span>
                    <span className="breakdown-name">In Progress</span>
                    <strong className="breakdown-count">{stats?.inProgressTasks || 0} ({statusPercentages.inProgress}%)</strong>
                  </div>
                  <div className="breakdown-stat-chip">
                    <span className="breakdown-dot" style={{ background: '#64748b' }}></span>
                    <span className="breakdown-name">Pending</span>
                    <strong className="breakdown-count">{stats?.pendingTasks || 0} ({statusPercentages.pending}%)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Priority Urgency Breakdown */}
            <div className="col-12 col-lg-6">
              <div className="glass-panel h-100">
                <div className="panel-title-row" style={{ marginBottom: '0.75rem' }}>
                  <h3 className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FlameIcon size={18} color="var(--accent-rose)" />
                    <span>Work Priority & Urgency Density</span>
                  </h3>
                  <span className="meta-badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fda4af' }}>
                    {stats?.highPriorityTasks || 0} High Urgency
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Risk & urgency distribution of current scheduled workloads
                </p>

                {/* Segmented Priority Bar */}
                <div className="segmented-bar-track">
                  <div
                    className="segmented-bar-segment"
                    style={{ width: `${priorityPercentages.high}%`, background: 'var(--accent-rose)' }}
                    title={`High: ${priorityPercentages.high}%`}
                  />
                  <div
                    className="segmented-bar-segment"
                    style={{ width: `${priorityPercentages.medium}%`, background: 'var(--accent-amber)' }}
                    title={`Medium: ${priorityPercentages.medium}%`}
                  />
                  <div
                    className="segmented-bar-segment"
                    style={{ width: `${priorityPercentages.low}%`, background: 'var(--accent-emerald)' }}
                    title={`Low: ${priorityPercentages.low}%`}
                  />
                </div>

                {/* Numerical breakdown items */}
                <div className="breakdown-pills-row" style={{ marginTop: '1rem' }}>
                  <div className="breakdown-stat-chip">
                    <span className="breakdown-dot" style={{ background: 'var(--accent-rose)' }}></span>
                    <span className="breakdown-name">High Priority</span>
                    <strong className="breakdown-count">{stats?.highPriorityTasks || 0} ({priorityPercentages.high}%)</strong>
                  </div>
                  <div className="breakdown-stat-chip">
                    <span className="breakdown-dot" style={{ background: 'var(--accent-amber)' }}></span>
                    <span className="breakdown-name">Medium Priority</span>
                    <strong className="breakdown-count">{stats?.mediumPriorityTasks || 0} ({priorityPercentages.medium}%)</strong>
                  </div>
                  <div className="breakdown-stat-chip">
                    <span className="breakdown-dot" style={{ background: 'var(--accent-emerald)' }}></span>
                    <span className="breakdown-name">Low Priority</span>
                    <strong className="breakdown-count">{stats?.lowPriorityTasks || 0} ({priorityPercentages.low}%)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Analytics Grid: Power Users Leaderboard + Deadline Outlook */}
          <div className="row g-3 g-lg-4 mb-4">
            {/* Top Power Users Leaderboard */}
            <div className="col-12 col-lg-6">
              <div className="glass-panel h-100">
                <div className="panel-title-row">
                  <h3 className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <UsersIcon size={18} color="var(--accent-amber)" />
                    <span>Productivity Leaderboard (Top Users)</span>
                  </h3>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Most active platform contributors ranked by completed achievements
                </p>

                <div className="power-users-list">
                  {stats?.powerUsers?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No user task history recorded yet.
                    </div>
                  ) : (
                    stats?.powerUsers?.map((u, i) => (
                      <div key={u._id} className="leaderboard-item">
                        <div className="leaderboard-rank">#{i + 1}</div>
                        <div className="leaderboard-avatar">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="leaderboard-info">
                          <div className="leaderboard-name-row">
                            <span className="leaderboard-name">{u.name}</span>
                            {u.role === 'admin' && (
                              <span className="admin-tag-pill" style={{ fontSize: '0.6rem' }}>ADMIN</span>
                            )}
                          </div>
                          <span className="leaderboard-email">{u.email}</span>
                        </div>

                        <div className="leaderboard-metric">
                          <div className="leaderboard-count">
                            <strong>{u.completedTasks}</strong> / {u.totalTasks} done
                          </div>
                          <div className="leaderboard-rate">
                            {u.completionRate}% completion
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Deadline Density & Platform Pressure */}
            <div className="col-12 col-lg-6">
              <div className="glass-panel h-100">
                <div className="panel-title-row">
                  <h3 className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <ClockIcon size={18} color="var(--accent-cyan)" />
                    <span>Platform Deadline Distribution</span>
                  </h3>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Upcoming workload distribution and SLA turnaround efficiency
                </p>

                <div className="density-breakdown-list">
                  <div className="lifecycle-item">
                    <span className="lifecycle-label">
                      <span className="lifecycle-dot" style={{ background: 'var(--accent-rose)' }}></span>
                      <span>Overdue Tasks (SLA Debt)</span>
                    </span>
                    <span className="lifecycle-value" style={{ color: stats?.overdueTasks > 0 ? 'var(--accent-rose)' : undefined }}>
                      {stats ? stats.overdueTasks : 0}
                    </span>
                  </div>

                  <div className="lifecycle-item">
                    <span className="lifecycle-label">
                      <span className="lifecycle-dot" style={{ background: 'var(--accent-amber)' }}></span>
                      <span>Due Today (Immediate Attention)</span>
                    </span>
                    <span className="lifecycle-value">{stats ? stats.dueTodayTasks : 0}</span>
                  </div>

                  <div className="lifecycle-item">
                    <span className="lifecycle-label">
                      <span className="lifecycle-dot" style={{ background: '#06b6d4' }}></span>
                      <span>Due Tomorrow</span>
                    </span>
                    <span className="lifecycle-value">{stats ? stats.dueTomorrowTasks : 0}</span>
                  </div>

                  <div className="lifecycle-item">
                    <span className="lifecycle-label">
                      <span className="lifecycle-dot" style={{ background: '#818cf8' }}></span>
                      <span>Due This Week</span>
                    </span>
                    <span className="lifecycle-value">{stats ? stats.dueThisWeekTasks : 0}</span>
                  </div>

                  {/* Average Turnaround Metric Box */}
                  <div className="analytics-insight-box" style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <ActivityIcon size={18} color="var(--primary)" />
                      <div>
                        <strong style={{ color: '#ffffff', fontSize: '0.85rem' }}>Average Completion Turnaround: </strong>
                        <span style={{ color: '#a5b4fc', fontWeight: 700 }}>
                          {stats?.avgTurnaroundHours ? `${stats.avgTurnaroundHours} hours` : 'N/A'}
                        </span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                          Average duration from initial scheduling to completion mark.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: USER INTELLIGENCE & DIRECTORY */}
      {activeSubTab === 'users' && (
        <div className="glass-panel animate-fade-in" style={{ marginTop: '1.25rem' }}>
          <div className="panel-title-row" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <UsersIcon size={18} color="var(--primary)" />
                <span>User Intelligence Directory</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Audit platform accounts, promote administrators, monitor user activity, or export records.
              </p>
            </div>

            {/* Right: Search & Export CSV */}
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleExportUsersCSV}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                title="Download user list as CSV spreadsheet"
              >
                <DownloadIcon size={14} />
                <span>Export CSV</span>
              </button>

              <div style={{ maxWidth: '260px', width: '100%', position: 'relative' }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {userSearch && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setUserSearch('')}
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* User Filter Pills */}
          <div className="filter-chips-row" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`chip-btn ${userRoleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setUserRoleFilter('all')}
            >
              All Users ({usersList.length})
            </button>
            <button
              type="button"
              className={`chip-btn ${userRoleFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setUserRoleFilter('admin')}
            >
              Administrators ({stats?.adminCount || 0})
            </button>
            <button
              type="button"
              className={`chip-btn ${userRoleFilter === 'active' ? 'active' : ''}`}
              onClick={() => setUserRoleFilter('active')}
            >
              Active Creators ({stats?.usersWithTasksCount || 0})
            </button>
            <button
              type="button"
              className={`chip-btn ${userRoleFilter === 'idle' ? 'active' : ''}`}
              onClick={() => setUserRoleFilter('idle')}
            >
              Idle Accounts ({stats?.idleUsersCount || 0})
            </button>
          </div>

          <div className="admin-table-wrapper table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                  <th>Tasks Breakdown</th>
                  <th>Completion Rate</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No users match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = user?._id === u._id;
                    const completionRate =
                      u.tasksCount > 0 ? Math.round((u.completedTasksCount / u.tasksCount) * 100) : 0;

                    return (
                      <tr key={u._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="user-avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="badge-you">You</span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={`meta-badge ${u.role === 'admin' ? 'admin-badge-purple' : 'status-badge-pending'}`}>
                            {u.role === 'admin' ? (
                              <>
                                <ShieldCheckIcon size={12} />
                                <span>ADMIN</span>
                              </>
                            ) : (
                              <span>USER</span>
                            )}
                          </span>
                        </td>

                        <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          {formatDateTime(u.createdAt)}
                        </td>

                        <td>
                          <div style={{ fontSize: '0.825rem' }}>
                            <strong>{u.tasksCount || 0}</strong> total
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-faint)' }}>
                              {u.completedTasksCount || 0} done • {u.inProgressTasksCount || 0} in progress
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="progress-bar-track" style={{ width: '60px', height: '6px' }}>
                              <div
                                className="progress-bar-fill"
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                              {completionRate}%
                            </span>
                          </div>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center' }}>
                            <button
                              type="button"
                              className={`btn btn-sm ${u.role === 'admin' ? 'btn-secondary' : 'btn-primary'}`}
                              onClick={() => handleToggleRole(u)}
                              disabled={isSelf && u.role === 'admin' && stats?.adminCount <= 1}
                              title={u.role === 'admin' ? 'Demote to regular user' : 'Promote to administrator'}
                            >
                              {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                            </button>

                            {!isSelf && (
                              <button
                                type="button"
                                className="icon-action-btn delete-btn"
                                onClick={() => handleDeleteUser(u)}
                                title="Delete user and all their tasks"
                              >
                                <TrashIcon size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GLOBAL TASKS AUDIT & MODERATION */}
      {activeSubTab === 'tasks' && (
        <div className="glass-panel animate-fade-in" style={{ marginTop: '1.25rem' }}>
          <div className="panel-title-row" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <DashboardIcon size={18} color="var(--primary)" />
                <span>Global Tasks Audit & Moderation</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Audit all task entries, verify content, check attachments, or export audit logs.
              </p>
            </div>

            {/* Quick Actions & Search */}
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleExportTasksCSV}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                title="Download platform tasks log as CSV"
              >
                <DownloadIcon size={14} />
                <span>Export Tasks (CSV)</span>
              </button>

              <select
                className="filter-select"
                value={taskPriorityFilter}
                onChange={(e) => setTaskPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <select
                className="filter-select"
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <div style={{ maxWidth: '240px', width: '100%', position: 'relative' }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search tasks..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                />
                {taskSearch && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setTaskSearch('')}
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="task-grid">
            {tasksList.length === 0 ? (
              <div className="empty-state" style={{ padding: '2.5rem' }}>
                <div style={{ color: 'var(--text-faint)', marginBottom: '0.75rem' }}>
                  <SearchIcon size={36} />
                </div>
                <h4>No tasks match filters</h4>
                <p>Try resetting the priority, status, or search query above.</p>
              </div>
            ) : (
              tasksList.map((task) => (
                <div key={task._id} className={`elegant-task-card prio-border-${task.priority}`}>
                  <div className="task-content">
                    <div className="task-header-row">
                      <h4 className="task-heading">{task.title}</h4>
                      <span className={`meta-badge status-badge-${task.status}`}>
                        {task.status}
                      </span>
                    </div>

                    {task.description && (
                      <p className="task-description-text">{task.description}</p>
                    )}

                    <div className="task-meta-row">
                      {/* Owner pill */}
                      <span className="meta-badge schedule-badge" title="Task Owner">
                        <UserIcon size={12} />
                        <span>Owner: <strong>{task.user?.name || 'Unknown'}</strong> ({task.user?.email || 'N/A'})</span>
                      </span>

                      {/* Due date */}
                      {task.dueDate && (
                        <span className="meta-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#c7d2fe' }}>
                          <ClockIcon size={12} />
                          <span>{formatDateFull(task.dueDate)}</span>
                        </span>
                      )}

                      {/* Priority */}
                      <span className={`meta-badge prio-badge-${task.priority}`}>
                        {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                      </span>

                      {/* Attachments preview */}
                      {task.attachments && task.attachments.length > 0 && (
                        <button
                          type="button"
                          className="meta-badge"
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#c7d2fe',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                          onClick={() => onViewAttachment(task.attachments[0])}
                          title="Click to preview attachment"
                        >
                          <PaperclipIcon size={12} />
                          <span>{task.attachments.length} attachment{task.attachments.length === 1 ? '' : 's'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="task-action-btns">
                    <button
                      type="button"
                      className="icon-action-btn delete-btn"
                      onClick={() => handleDeleteTask(task._id, task.title)}
                      title="Moderate and delete this task"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SYSTEM HEALTH, STORAGE FOOTPRINT & AUDIT FEED */}
      {activeSubTab === 'health' && (
        <div className="admin-health-section animate-fade-in" style={{ marginTop: '1.25rem' }}>
          <div className="row g-3 g-lg-4">
            {/* Storage & Attachment Metrics Deep Dive */}
            <div className="col-12 col-lg-6">
              <div className="glass-panel h-100">
                <div className="panel-title-row">
                  <h3 className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <DatabaseIcon size={18} color="var(--accent-cyan)" />
                    <span>Media Storage & Assets Breakdown</span>
                  </h3>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Storage utilization across photos, videos, sticky memos, and documents
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Images */}
                  <div className="lifecycle-item">
                    <span className="lifecycle-label">
                      <ImageIcon size={16} color="var(--accent-cyan)" />
                      <span>Images & Photos</span>
                    </span>
                    <span className="lifecycle-value">
                      {stats?.mediaByType?.image?.count || 0} files ({((stats?.mediaByType?.image?.bytes || 0) / 1024).toFixed(0)} KB)
                    </span>
                  </div>

                  {/* Videos */}
                  <div className="lifecycle-item">
                    <span className="lifecycle-label">
                      <VideoIcon size={16} color="#818cf8" />
                      <span>Videos & Screen Records</span>
                    </span>
                    <span className="lifecycle-value">
                      {stats?.mediaByType?.video?.count || 0} files ({((stats?.mediaByType?.video?.bytes || 0) / 1024).toFixed(0)} KB)
                    </span>
                  </div>

                  {/* Documents */}
                  <div className="lifecycle-item">
                    <span className="lifecycle-label">
                      <FileTextIcon size={16} color="#6ee7b7" />
                      <span>Documents & PDFs</span>
                    </span>
                    <span className="lifecycle-value">
                      {stats?.mediaByType?.document?.count || 0} files ({((stats?.mediaByType?.document?.bytes || 0) / 1024).toFixed(0)} KB)
                    </span>
                  </div>

                  {/* Sticky Memos */}
                  <div className="lifecycle-item">
                    <span className="lifecycle-label">
                      <FileTextIcon size={16} color="#fbbf24" />
                      <span>Sticky Memos & Quick Notes</span>
                    </span>
                    <span className="lifecycle-value">
                      {stats?.mediaByType?.note?.count || 0} notes
                    </span>
                  </div>

                  {/* Database Connectivity */}
                  <div className="lifecycle-item" style={{ marginTop: '0.5rem' }}>
                    <span className="lifecycle-label">
                      <ShieldCheckIcon size={16} color="var(--accent-emerald)" />
                      <span>MongoDB Database Cluster</span>
                    </span>
                    <span className="meta-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                      ONLINE (HEALTHY)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live System Activity Feed */}
            <div className="col-12 col-lg-6">
              <div className="glass-panel h-100">
                <div className="panel-title-row">
                  <h3 className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <ActivityIcon size={18} color="var(--accent-emerald)" />
                    <span>Recent Platform Activity Stream</span>
                  </h3>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Live chronological audit trail of recent events and updates
                </p>

                <div className="recent-activity-stream">
                  {stats?.recentActivity?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No recent events logged.
                    </div>
                  ) : (
                    stats?.recentActivity?.map((act) => (
                      <div key={act._id} className="activity-stream-item">
                        <div className="activity-stream-dot"></div>
                        <div className="activity-stream-content">
                          <div className="activity-stream-header">
                            <strong className="activity-stream-title">{act.title}</strong>
                            <span className={`meta-badge status-badge-${act.status}`} style={{ fontSize: '0.65rem' }}>
                              {act.status}
                            </span>
                          </div>
                          <div className="activity-stream-sub">
                            <span>By <strong>{act.user?.name || 'User'}</strong></span>
                            <span>• {formatDateTime(act.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
