import React, { useState, useMemo } from 'react';
import { formatDateTime, formatDateFull, getScheduleStatus } from '../utils/dateUtils.js';
import {
  DashboardIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  FlameIcon,
  ZapIcon,
  LeafIcon,
  TrendingUpIcon,
  EditIcon,
  TrashIcon,
  RotateCcwIcon,
  ArrowRightIcon,
  PlusIcon,
  SearchIcon,
  PaperclipIcon,
  VideoIcon,
  ImageIcon,
  FileTextIcon,
  UserIcon,
  PlayCircleIcon,
  HourglassIcon,
} from './Icons.jsx';

export default function DashboardPage({
  tasks,
  user,
  onNavigate,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onViewAttachment,
  onRescheduleTask,
  onUpdateStatus,
}) {
  const [historySearch, setHistorySearch] = useState('');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Compute rich analytics ONLY for the current tasks (0 if guest has no tasks)
  const analytics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const total = tasks.length;
    const active = tasks.filter((t) => t.status !== 'completed'); // All incomplete tasks
    const completed = tasks.filter((t) => t.status === 'completed');
    const pending = tasks.filter((t) => t.status === 'pending');
    const inProgress = tasks.filter((t) => t.status === 'in-progress');

    // Due Today tasks (incomplete)
    const dueToday = active.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d >= startOfToday && d <= endOfToday;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Overdue tasks (incomplete with due date in the past)
    const overdue = active.filter((t) => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < now;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Priority Breakdown (among active tasks)
    const highPrio = active.filter((t) => t.priority === 'high');
    const mediumPrio = active.filter((t) => t.priority === 'medium');
    const lowPrio = active.filter((t) => t.priority === 'low');

    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    return {
      total,
      activeCount: active.length,
      completedCount: completed.length,
      pendingCount: pending.length,
      inProgressCount: inProgress.length,
      dueTodayCount: dueToday.length,
      overdueCount: overdue.length,
      highCount: highPrio.length,
      mediumCount: mediumPrio.length,
      lowCount: lowPrio.length,
      completionRate,
      dueTodayList: dueToday,
      overdueList: overdue,
      completedList: completed,
    };
  }, [tasks]);

  // Filter completed tasks by search
  const filteredHistory = useMemo(() => {
    return analytics.completedList.filter((t) => {
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    });
  }, [analytics.completedList, historySearch]);

  return (
    <div className="dashboard-view animate-fade-in">
      {/* Personalized Header Banner */}
      <div className="user-dashboard-banner">
        <div className="banner-left">
          <div className="banner-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={24} />}
          </div>
          <div>
            <span className="banner-badge">
              {user ? 'Personal Workspace' : 'Guest Preview Mode'}
            </span>
            <h1 className="banner-greeting">
              {greeting}, {user ? user.name : 'Visitor'}!
            </h1>
            <p className="banner-desc">
              {user
                ? `Signed in as ${user.email} • Real-time performance analytics, schedule agenda, and task history.`
                : 'Welcome to MyTasks! Plan your schedule, track deadlines, and sign in to keep your records safe.'}
            </p>
          </div>
        </div>

        <div className="banner-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('schedule')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <PlusIcon size={16} />
            <span>Schedule a Task</span>
          </button>
          {!user && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('auth')}
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>

      {/* Guest Notice */}
      {!user && (
        <div className="guest-info-banner animate-fade-in">
          <div className="guest-banner-icon" style={{ color: 'var(--primary)' }}>
            <AlertCircleIcon size={20} />
          </div>
          <div className="guest-banner-text">
            <strong>Guest Mode Active:</strong> You currently have no tasks in your session. Click <strong>"Schedule a Task"</strong> above to set deadlines with our visual calendar and time picker. When you add a task, we'll prompt you to sign in to save it!
          </div>
        </div>
      )}

      {/* TOP 4 INFORMATIVE KPI METRIC CARDS */}
      <div className="row g-2 g-md-3 row-cols-1 row-cols-sm-2 row-cols-xl-4 mb-4">
        {/* 1. Open Tasks (Total Incomplete: Pending + In Progress) */}
        <div className="col">
          <div className="stat-card h-100 w-100">
            <div className="stat-icon primary">
              <DashboardIcon size={22} color="var(--primary)" />
            </div>
            <div>
              <div className="stat-value">{user ? analytics.activeCount : 0}</div>
              <div className="stat-label">Open Tasks</div>
              <div className="stat-subtext">
                {user ? `${analytics.pendingCount} to-do • ${analytics.inProgressCount} in progress` : '0 to-do'}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Overdue Tasks (Critical Alert Metric) */}
        <div className="col">
          <div className={`stat-card h-100 w-100 ${user && analytics.overdueCount > 0 ? 'stat-card-alert' : ''}`}>
            <div className="stat-icon warning" style={{ background: user && analytics.overdueCount > 0 ? 'rgba(244, 63, 94, 0.15)' : undefined }}>
              <AlertTriangleIcon
                size={22}
                color={user && analytics.overdueCount > 0 ? 'var(--accent-rose)' : 'var(--accent-amber)'}
              />
            </div>
            <div>
              <div className="stat-value" style={{ color: user && analytics.overdueCount > 0 ? 'var(--accent-rose)' : undefined }}>
                {user ? analytics.overdueCount : 0}
              </div>
              <div className="stat-label">Overdue Tasks</div>
              <div className="stat-subtext">
                {user && analytics.overdueCount > 0 ? 'Requires immediate action' : 'All deadlines met'}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Due Today */}
        <div className="col">
          <div className="stat-card h-100 w-100">
            <div className="stat-icon info">
              <CalendarIcon size={22} color="var(--accent-cyan)" />
            </div>
            <div>
              <div className="stat-value">{user ? analytics.dueTodayCount : 0}</div>
              <div className="stat-label">Due Today</div>
              <div className="stat-subtext">Scheduled before midnight</div>
            </div>
          </div>
        </div>

        {/* 4. Accomplished */}
        <div className="col">
          <div className="stat-card h-100 w-100">
            <div className="stat-icon success">
              <CheckCircleIcon size={22} color="var(--accent-emerald)" />
            </div>
            <div>
              <div className="stat-value">{user ? analytics.completedCount : 0}</div>
              <div className="stat-label">Accomplished</div>
              <div className="stat-subtext">
                {user ? `${analytics.completionRate}% completion rate` : '0%'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED OVERDUE ACTION CENTER (Prominently displayed when overdue tasks exist) */}
      {user && analytics.overdueCount > 0 && (
        <div className="glass-panel overdue-action-panel animate-fade-in" style={{ marginTop: '1.75rem', borderColor: 'rgba(244, 63, 94, 0.4)' }}>
          <div className="panel-title-row" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="alert-pulse-dot"></div>
              <div>
                <h3 className="panel-heading" style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <AlertTriangleIcon size={18} color="var(--accent-rose)" />
                  <span>Immediate Attention: {analytics.overdueCount} {analytics.overdueCount === 1 ? 'Task Overdue' : 'Tasks Overdue'}</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  These tasks have passed their scheduled deadline. Update state or reschedule to get back on track.
                </p>
              </div>
            </div>
          </div>

          <div className="task-grid">
            {analytics.overdueList.map((task) => {
              const schedule = getScheduleStatus(task.dueDate, false);
              return (
                <div key={task._id} className="elegant-task-card prio-border-high overdue-highlight-card">
                  <button
                    type="button"
                    className="task-check-circle"
                    onClick={() => onToggleTask(task)}
                    title="Mark task completed"
                  >
                    <span className="check-icon">✓</span>
                  </button>

                  <div className="task-content">
                    <div className="task-header-row">
                      <h4 className="task-heading">{task.title}</h4>
                      <span className="meta-badge schedule-badge overdue">
                        {schedule?.label || 'Overdue'}
                      </span>
                    </div>

                    {task.description && (
                      <p className="task-description-text">{task.description}</p>
                    )}

                    <div className="task-meta-row">
                      <span className={`meta-badge prio-badge-${task.priority}`}>
                        {task.priority === 'high' ? 'High Priority' : task.priority === 'medium' ? 'Medium' : 'Low'}
                      </span>

                      <span className="meta-time-text">
                        Due: {formatDateFull(task.dueDate)}
                      </span>
                    </div>
                  </div>

                  <div className="task-action-btns">
                    {onRescheduleTask && (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => onRescheduleTask(task, 1)}
                        title="Postpone deadline by +1 Day"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <RotateCcwIcon size={13} />
                        <span>+1 Day</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => onToggleTask(task)}
                      title="Mark as completed now"
                    >
                      Complete
                    </button>

                    <button
                      type="button"
                      className="icon-action-btn edit-btn"
                      onClick={() => onEditTask(task)}
                      title="Edit task parameters"
                    >
                      <EditIcon size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ANALYTICS DEEP DIVE: 2-COLUMN GRID (Productivity Lifecycle + Urgency Matrix) */}
      <div className="row g-3 g-lg-4 mt-2">
        {/* Panel 1: Task Lifecycle & Completion Engine */}
        <div className="col-12 col-lg-6">
          <div className="glass-panel h-100">
            <div className="panel-title-row">
              <h3 className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <TrendingUpIcon size={18} color="var(--primary)" />
                <span>Productivity Lifecycle</span>
              </h3>
              <span className="rate-percentage">{user ? analytics.completionRate : 0}%</span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {user ? `${analytics.completedCount} of ${analytics.total} total tasks completed` : 'No tasks recorded yet'}
            </p>

            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${user ? analytics.completionRate : 0}%` }}
              />
            </div>

            {/* Clarification of "In Progress" vs "Active / Pending" */}
            <div className="lifecycle-breakdown-list" style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>
                Current Workflow Breakdown
              </h4>

              {/* To Do / Pending */}
              <div className="lifecycle-item">
                <div className="lifecycle-label">
                  <span className="lifecycle-dot" style={{ background: '#94a3b8' }}></span>
                  <span>To Do (Pending)</span>
                </div>
                <span className="lifecycle-value">{user ? analytics.pendingCount : 0}</span>
              </div>

              {/* In Progress */}
              <div className="lifecycle-item">
                <div className="lifecycle-label">
                  <span className="lifecycle-dot" style={{ background: '#818cf8' }}></span>
                  <span>In Progress (Actively Working)</span>
                </div>
                <span className="lifecycle-value">{user ? analytics.inProgressCount : 0}</span>
              </div>

              {/* Completed */}
              <div className="lifecycle-item">
                <div className="lifecycle-label">
                  <span className="lifecycle-dot" style={{ background: '#34d399' }}></span>
                  <span>Accomplished (Finished)</span>
                </div>
                <span className="lifecycle-value">{user ? analytics.completedCount : 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Priority & Urgency Risk Distribution */}
        <div className="col-12 col-lg-6">
          <div className="glass-panel h-100">
            <div className="panel-title-row">
              <h3 className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <FlameIcon size={18} color="var(--accent-rose)" />
                <span>Priority & Urgency Matrix</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>Active Items</span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Urgency distribution among remaining open items
            </p>

            <div className="priority-bars-container">
              {/* High Priority Bar */}
              <div className="priority-bar-row">
                <div className="priority-bar-label">
                  <FlameIcon size={15} color="var(--accent-rose)" />
                  <span>High Priority</span>
                </div>
                <div className="priority-bar-track">
                  <div
                    className="priority-bar-fill high"
                    style={{
                      width: `${analytics.activeCount > 0 ? (analytics.highCount / analytics.activeCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="priority-bar-count">{user ? analytics.highCount : 0}</span>
              </div>

              {/* Medium Priority Bar */}
              <div className="priority-bar-row">
                <div className="priority-bar-label">
                  <ZapIcon size={15} color="var(--accent-amber)" />
                  <span>Medium Priority</span>
                </div>
                <div className="priority-bar-track">
                  <div
                    className="priority-bar-fill medium"
                    style={{
                      width: `${analytics.activeCount > 0 ? (analytics.mediumCount / analytics.activeCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="priority-bar-count">{user ? analytics.mediumCount : 0}</span>
              </div>

              {/* Low Priority Bar */}
              <div className="priority-bar-row">
                <div className="priority-bar-label">
                  <LeafIcon size={15} color="var(--accent-emerald)" />
                  <span>Low Priority</span>
                </div>
                <div className="priority-bar-track">
                  <div
                    className="priority-bar-fill low"
                    style={{
                      width: `${analytics.activeCount > 0 ? (analytics.lowCount / analytics.activeCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="priority-bar-count">{user ? analytics.lowCount : 0}</span>
              </div>
            </div>

            {/* Quick Insights Text */}
            <div className="analytics-insight-box" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--primary)', marginTop: '2px' }}>
                  <ClockIcon size={16} />
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                  {analytics.overdueCount > 0
                    ? `Focus on resolving the ${analytics.overdueCount} overdue item(s) to eliminate scheduling debt.`
                    : analytics.dueTodayCount > 0
                    ? `You have ${analytics.dueTodayCount} task(s) scheduled for today. Complete them before midnight.`
                    : analytics.activeCount > 0
                    ? `All deadlines are in order. You have ${analytics.activeCount} open task(s) ready to advance.`
                    : 'Your workspace is clear! Use the scheduler above to plan your upcoming milestones.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S SCHEDULE AGENDA (Chronological order of today's tasks) */}
      <div className="glass-panel" style={{ marginTop: '2rem' }}>
        <div className="panel-title-row" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h3 className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CalendarIcon size={18} color="var(--accent-cyan)" />
              <span>Today's Schedule Agenda</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Chronological schedule of tasks to accomplish before the end of the day
            </p>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => onNavigate('tasks')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <span>Manage All Tasks</span>
            <ArrowRightIcon size={14} />
          </button>
        </div>

        {!user || analytics.dueTodayList.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div style={{ color: 'var(--text-faint)', marginBottom: '0.75rem' }}>
              <CalendarIcon size={40} />
            </div>
            <h4>{!user ? 'No tasks scheduled' : 'Nothing scheduled for today!'}</h4>
            <p style={{ marginBottom: '1rem' }}>
              {!user
                ? 'Sign in and schedule tasks to view your daily agenda here.'
                : 'You have no pending deadlines due today. Plan ahead by adding new items.'}
            </p>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => onNavigate('schedule')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <PlusIcon size={14} />
              <span>Schedule a Task</span>
            </button>
          </div>
        ) : (
          <div className="task-grid">
            {analytics.dueTodayList.map((task) => {
              const schedule = getScheduleStatus(task.dueDate, false);
              return (
                <div key={task._id} className={`elegant-task-card prio-border-${task.priority}`}>
                  <button
                    type="button"
                    className="task-check-circle"
                    onClick={() => onToggleTask(task)}
                    title="Mark task completed"
                  >
                    <span className="check-icon">✓</span>
                  </button>

                  <div className="task-content">
                    <div className="task-header-row">
                      <h4 className="task-heading">{task.title}</h4>
                      {schedule && (
                        <span className={`meta-badge schedule-badge ${schedule.type}`}>
                          <ClockIcon size={12} />
                          <span>{schedule.label}</span>
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="task-description-text">{task.description}</p>
                    )}

                    <div className="task-meta-row">
                      <span className={`meta-badge prio-badge-${task.priority}`}>
                        {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                      </span>

                      <span className={`meta-badge status-badge-${task.status}`}>
                        {task.status === 'in-progress' ? 'In Progress' : 'Pending'}
                      </span>

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
                          title="View attached media/note"
                        >
                          <PaperclipIcon size={12} />
                          <span>{task.attachments.length} attached</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="task-action-btns">
                    <button
                      type="button"
                      className="icon-action-btn edit-btn"
                      onClick={() => onEditTask(task)}
                      title="Edit this task"
                    >
                      <EditIcon size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MERGED ACCOMPLISHMENT HISTORY (Directly under Dashboard) */}
      <div className="glass-panel" style={{ marginTop: '2rem' }}>
        <div className="panel-title-row" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="panel-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ClockIcon size={18} color="var(--accent-emerald)" />
              <span>Accomplishment History</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Your permanent log of completed achievements with exact completion dates and times
            </p>
          </div>

          {user && analytics.completedCount > 0 && (
            <div style={{ maxWidth: '280px', width: '100%', position: 'relative' }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search history..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {!user ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div style={{ color: 'var(--text-faint)', marginBottom: '0.75rem' }}>
              <UserIcon size={36} />
            </div>
            <h4>Sign in to view your history</h4>
            <p style={{ marginBottom: '1rem' }}>
              Your finished tasks and completion milestones are saved permanently to your personal account.
            </p>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => onNavigate('auth')}
            >
              Sign In or Register
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div style={{ color: 'var(--text-faint)', marginBottom: '0.75rem' }}>
              <CheckCircleIcon size={36} />
            </div>
            <h4>{historySearch ? 'No history matching search' : 'No completed tasks yet'}</h4>
            <p>
              {historySearch
                ? `No finished tasks found for "${historySearch}".`
                : 'When you check off tasks on your Dashboard or Tasks page, they will appear here with exact completion timestamps.'}
            </p>
          </div>
        ) : (
          <div className="task-grid">
            {filteredHistory.map((task) => (
              <div key={task._id} className="elegant-task-card timeline-card animate-fade-in">
                <div className="task-content">
                  <div className="task-header-row">
                    <h4 className="task-heading" style={{ textDecoration: 'none' }}>
                      {task.title}
                    </h4>
                    <span className="meta-badge status-badge-completed">
                      <CheckCircleIcon size={12} color="var(--accent-emerald)" />
                      <span>Completed</span>
                    </span>
                  </div>

                  {task.description && (
                    <p className="task-description-text">{task.description}</p>
                  )}

                  {/* Attachments row */}
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="task-attachments-row">
                      {task.attachments.map((att, i) => (
                        <div
                          key={i}
                          className="task-attachment-pill"
                          onClick={() => onViewAttachment(att)}
                          role="button"
                          tabIndex={0}
                          title={`Click to view ${att.name || att.fileType}`}
                        >
                          {att.fileType === 'image' && (
                            <>
                              <img src={att.dataUrl} alt={att.name} className="pill-thumb" />
                              <span>Photo</span>
                            </>
                          )}
                          {att.fileType === 'video' && (
                            <>
                              <VideoIcon size={12} />
                              <span>Video</span>
                            </>
                          )}
                          {att.fileType === 'note' && (
                            <>
                              <FileTextIcon size={12} />
                              <span>Memo</span>
                            </>
                          )}
                          {att.fileType === 'document' && (
                            <>
                              <FileTextIcon size={12} />
                              <span>{att.name || 'Document'}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="task-meta-row" style={{ marginTop: '0.6rem' }}>
                    {/* Exact Completion Timestamp */}
                    <span className="meta-badge schedule-badge" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                      <CheckCircleIcon size={12} color="var(--accent-emerald)" />
                      <strong style={{ color: '#34d399', marginLeft: '0.2rem' }}>Finished:</strong>{' '}
                      {task.completedAt ? formatDateFull(task.completedAt) : formatDateFull(task.updatedAt)}
                    </span>

                    {/* Original Scheduled Date */}
                    {task.dueDate && (
                      <span className="meta-badge prio-badge-low" title="Originally scheduled for">
                        <CalendarIcon size={12} />
                        <span>Scheduled: {formatDateTime(task.dueDate)}</span>
                      </span>
                    )}

                    {/* Created Date */}
                    <span className="meta-time-text">
                      Added {formatDateTime(task.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="task-action-btns">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => onToggleTask(task)}
                    title="Restore task back to active schedule"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RotateCcwIcon size={13} />
                    <span>Restore</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => onDeleteTask(task._id)}
                    title="Delete permanently"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <TrashIcon size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
