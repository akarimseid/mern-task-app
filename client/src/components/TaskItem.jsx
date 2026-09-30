import React from 'react';
import { formatDateTime, getScheduleStatus } from '../utils/dateUtils.js';
import {
  CalendarIcon,
  ClockIcon,
  FlameIcon,
  ZapIcon,
  LeafIcon,
  EditIcon,
  TrashIcon,
  ImageIcon,
  VideoIcon,
  FileTextIcon,
  AlertTriangleIcon,
} from './Icons.jsx';

export default function TaskItem({
  task,
  onEdit,
  onDelete,
  onToggle,
  onUpdateStatus,
  onViewAttachment,
}) {
  const isCompleted = task.status === 'completed';
  const schedule = getScheduleStatus(task.dueDate, isCompleted);

  return (
    <div className={`elegant-task-card prio-border-${task.priority} ${isCompleted ? 'is-completed' : ''} animate-fade-in`}>
      {/* Quick completion toggle check circle */}
      <button
        type="button"
        className={`task-check-circle ${isCompleted ? 'checked' : ''}`}
        onClick={() => onToggle(task)}
        title={isCompleted ? 'Mark as active' : 'Mark task complete'}
        aria-label={isCompleted ? 'Mark task as active' : 'Mark task as complete'}
      >
        <span className="check-icon">✓</span>
      </button>

      {/* Main Task Body */}
      <div className="task-content">
        <div className="task-header-row">
          <h3 className="task-heading">
            {task.title}
          </h3>
        </div>

        {task.description && (
          <p className="task-description-text">{task.description}</p>
        )}

        {/* Attachments Row */}
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
                    <VideoIcon size={13} color="#818cf8" />
                    <span>Video</span>
                  </>
                )}
                {att.fileType === 'note' && (
                  <>
                    <FileTextIcon size={13} color="#fbbf24" />
                    <span>Memo</span>
                  </>
                )}
                {att.fileType === 'document' && (
                  <>
                    <FileTextIcon size={13} color="#6ee7b7" />
                    <span>{att.name || 'Document'}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Metadata Badges */}
        <div className="task-meta-row">
          {/* Schedule Date & Time Badge */}
          {schedule && (
            <span className={`meta-badge schedule-badge ${schedule.type}`}>
              {schedule.type === 'overdue' ? (
                <AlertTriangleIcon size={12} color="var(--accent-rose)" />
              ) : (
                <ClockIcon size={12} />
              )}
              <span>{schedule.label}</span>
            </span>
          )}

          {/* Priority Badge */}
          <span className={`meta-badge prio-badge-${task.priority}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            {task.priority === 'high' && <FlameIcon size={12} color="var(--accent-rose)" />}
            {task.priority === 'medium' && <ZapIcon size={12} color="var(--accent-amber)" />}
            {task.priority === 'low' && <LeafIcon size={12} color="var(--accent-emerald)" />}
            <span>{task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}</span>
          </span>

          {/* Interactive State Selector */}
          <div className="task-state-dropdown-wrap">
            <select
              className={`meta-badge state-select-badge status-badge-${task.status}`}
              value={task.status}
              onChange={(e) => onUpdateStatus(task, e.target.value)}
              title="Change current task state"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Created Timestamp */}
          <span className="meta-time-text" title={`Created at ${formatDateTime(task.createdAt)}`}>
            Added {formatDateTime(task.createdAt)}
          </span>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="task-action-btns">
        <button
          type="button"
          className="icon-action-btn edit-btn"
          onClick={() => onEdit(task)}
          title="Edit task parameters"
          aria-label="Edit task"
        >
          <EditIcon size={14} />
        </button>

        <button
          type="button"
          className="icon-action-btn delete-btn"
          onClick={() => onDelete(task._id)}
          title="Delete this task"
          aria-label="Delete task"
        >
          <TrashIcon size={14} />
        </button>
      </div>
    </div>
  );
}