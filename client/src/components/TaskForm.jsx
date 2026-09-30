import React, { useState, useEffect } from 'react';
import { toInputDateTime, getPresetDateTime } from '../utils/dateUtils.js';

export default function TaskForm({ onSubmit, editingTask, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      setStatus(editingTask.status || 'pending');
      setPriority(editingTask.priority || 'medium');
      setDueDate(toInputDateTime(editingTask.dueDate));
    } else {
      setTitle('');
      setDescription('');
      setStatus('pending');
      setPriority('medium');
      setDueDate('');
    }
  }, [editingTask]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    });

    if (!editingTask) {
      setTitle('');
      setDescription('');
      setStatus('pending');
      setPriority('medium');
      setDueDate('');
    }
  };

  const applyPreset = (presetKey) => {
    setDueDate(getPresetDateTime(presetKey));
  };

  return (
    <div className="elegant-card form-container animate-fade-in">
      <div className="form-header-bar">
        <div className="form-header-left">
          <div className="form-header-icon">
            {editingTask ? '✏️' : '✨'}
          </div>
          <div>
            <h2 className="form-title">
              {editingTask ? 'Edit Task Details' : 'Create New Task'}
            </h2>
            <p className="form-subtitle">
              {editingTask
                ? 'Update your task parameters, scheduled time, or priority level.'
                : 'Schedule a task with date, time, and priority to stay in flow.'}
            </p>
          </div>
        </div>
        {editingTask && (
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={onCancel}
          >
            Cancel Editing
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="task-input-form">
        {/* Task Title */}
        <div className="input-group">
          <label className="input-label" htmlFor="task-title">
            Task Title <span className="required-star">*</span>
          </label>
          <input
            id="task-title"
            className="form-input form-input-lg"
            type="text"
            placeholder="e.g. Prepare financial forecast report & review metrics"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Task Description */}
        <div className="input-group">
          <label className="input-label" htmlFor="task-desc">
            Description & Context <span className="optional-tag">(Optional)</span>
          </label>
          <textarea
            id="task-desc"
            className="form-textarea"
            rows={2}
            placeholder="Add relevant notes, checklist items, links, or expectations..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Parameters Grid: Schedule Date & Time, Priority, Status */}
        <div className="form-controls-row">
          {/* Schedule Date & Time */}
          <div className="input-group flex-1">
            <label className="input-label" htmlFor="task-datetime">
              📅 Date & Time Schedule
            </label>
            <input
              id="task-datetime"
              className="form-input"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <div className="preset-chips">
              <button
                type="button"
                className="chip-btn"
                onClick={() => applyPreset('today_evening')}
                title="Schedule for 5:00 PM today"
              >
                Today 5 PM
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => applyPreset('tomorrow_morning')}
                title="Schedule for 9:00 AM tomorrow"
              >
                Tomorrow 9 AM
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => applyPreset('next_week')}
                title="Schedule for next week Monday"
              >
                Next Week
              </button>
              {dueDate && (
                <button
                  type="button"
                  className="chip-btn chip-btn-clear"
                  onClick={() => setDueDate('')}
                  title="Remove scheduled date"
                >
                  ✕ Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Priority Pill Selector */}
          <div className="input-group flex-1">
            <label className="input-label">🔥 Priority Level</label>
            <div className="segmented-selector">
              <button
                type="button"
                className={`segmented-btn prio-low ${priority === 'low' ? 'active' : ''}`}
                onClick={() => setPriority('low')}
              >
                Low
              </button>
              <button
                type="button"
                className={`segmented-btn prio-med ${priority === 'medium' ? 'active' : ''}`}
                onClick={() => setPriority('medium')}
              >
                Medium
              </button>
              <button
                type="button"
                className={`segmented-btn prio-high ${priority === 'high' ? 'active' : ''}`}
                onClick={() => setPriority('high')}
              >
                High
              </button>
            </div>
          </div>

          {/* Status Pill Selector */}
          <div className="input-group flex-1">
            <label className="input-label">📌 Current State</label>
            <div className="segmented-selector">
              <button
                type="button"
                className={`segmented-btn status-btn ${status === 'pending' ? 'active' : ''}`}
                onClick={() => setStatus('pending')}
              >
                Pending
              </button>
              <button
                type="button"
                className={`segmented-btn status-btn ${status === 'in-progress' ? 'active' : ''}`}
                onClick={() => setStatus('in-progress')}
              >
                In Progress
              </button>
              <button
                type="button"
                className={`segmented-btn status-btn ${status === 'completed' ? 'active' : ''}`}
                onClick={() => setStatus('completed')}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="form-submit-row">
          <button type="submit" className="btn btn-primary submit-task-btn">
            <span>{editingTask ? '💾 Save Changes' : '✨ Add Task to Schedule'}</span>
          </button>

          {editingTask && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}

          {!editingTask && (
            <span className="submit-hint">
              {dueDate ? 'Scheduled with reminder time' : 'No due date set • Will appear in Active Tasks'}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}