import React, { useState, useMemo } from 'react';
import { formatDateFull, formatDateTime } from '../utils/dateUtils.js';
import { CheckCircleIcon, ClockIcon } from './Icons.jsx';

export default function HistoryPage({
  completedTasks,
  onToggleTask,
  onDeleteTask,
  onViewAttachment,
  loading,
  user,
  onNavigate,
}) {
  const [search, setSearch] = useState('');

  // Filter history tasks
  const filteredHistory = useMemo(() => {
    return completedTasks.filter((t) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    });
  }, [completedTasks, search]);

  return (
    <div className="history-page-view animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>⏳ Accomplishment History</span>
          </h1>
          <p className="page-subtitle">
            Review completed work with exact date & time completion records, attachments, or restore items back to your schedule.
          </p>
        </div>

        {!user && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('auth')}
          >
            Sign In to Sync History
          </button>
        )}
      </div>

      {!user ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h3>Sign in to view your history</h3>
          <p>
            When you create an account, every task you finish is permanently archived here with exact timestamps and completion details.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate('auth')}
            >
              Sign In or Register
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="row g-2 g-md-3 row-cols-1 row-cols-sm-2 mb-4">
            <div className="col">
              <div className="stat-card h-100 w-100">
                <div className="stat-icon success">
                  <CheckCircleIcon size={22} color="var(--accent-emerald)" />
                </div>
                <div>
                  <div className="stat-value">{completedTasks.length}</div>
                  <div className="stat-label">Tasks Finished</div>
                </div>
              </div>
            </div>

            <div className="col">
              <div className="stat-card h-100 w-100">
                <div className="stat-icon info">
                  <ClockIcon size={22} color="var(--accent-cyan)" />
                </div>
                <div>
                  <div className="stat-value">100%</div>
                  <div className="stat-label">Timeline Accuracy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="filter-bar">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
              Showing <strong>{filteredHistory.length}</strong> recorded {filteredHistory.length === 1 ? 'task' : 'tasks'}
            </div>

            <input
              type="text"
              className="search-input"
              placeholder="Search past completed tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* History list */}
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <h3>Loading history logs...</h3>
              <p>Gathering your past achievements...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌱</div>
              <h3>{search ? 'No history matching search' : 'No completed tasks yet'}</h3>
              <p>
                {search
                  ? `No archived tasks found for "${search}".`
                  : 'When you complete tasks from your Dashboard or Tasks page, they will be archived here with exact timestamps and completion records.'}
              </p>
            </div>
          ) : (
            <div className="task-grid">
              {filteredHistory.map((task) => (
                <div key={task._id} className="elegant-task-card timeline-card animate-fade-in">
                  <div className="task-content">
                    <div className="task-header-row">
                      <h3 className="task-heading" style={{ textDecoration: 'none' }}>
                        {task.title}
                      </h3>
                      <span className="meta-badge status-badge-completed">Completed</span>
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
                                <span className="pill-icon">🎬</span>
                                <span>Video</span>
                              </>
                            )}
                            {att.fileType === 'note' && (
                              <>
                                <span className="pill-icon">📝</span>
                                <span>Memo</span>
                              </>
                            )}
                            {att.fileType === 'document' && (
                              <>
                                <span className="pill-icon">📄</span>
                                <span>{att.name || 'Document'}</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="task-meta-row" style={{ marginTop: '0.65rem' }}>
                      {/* Exact Completion Timestamp */}
                      <span className="meta-badge schedule-badge" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                        ✅ <strong style={{ color: '#34d399', marginLeft: '0.2rem' }}>Finished:</strong>{' '}
                        {task.completedAt ? formatDateFull(task.completedAt) : formatDateFull(task.updatedAt)}
                      </span>

                      {/* Scheduled Date if had one */}
                      {task.dueDate && (
                        <span className="meta-badge prio-badge-low" title="Originally scheduled for">
                          📅 Scheduled for: {formatDateTime(task.dueDate)}
                        </span>
                      )}

                      {/* Creation Date */}
                      <span className="meta-time-text">
                        🕒 Added {formatDateTime(task.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="task-action-btns">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => onToggleTask(task)}
                      title="Move this task back to your active Tasks schedule"
                    >
                      ↺ Restore
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => onDeleteTask(task._id)}
                      title="Permanently erase this record from history"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
