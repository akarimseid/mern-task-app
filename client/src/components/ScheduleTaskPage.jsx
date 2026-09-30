import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatDateFull, getPresetDateTime } from '../utils/dateUtils.js';
import {
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FlameIcon,
  ZapIcon,
  LeafIcon,
  PaperclipIcon,
  ImageIcon,
  VideoIcon,
  FileTextIcon,
  XIcon,
  PlusIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from './Icons.jsx';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Helper to extract exact current time components
const getCurrentTimeComponents = () => {
  const now = new Date();
  const rawH = now.getHours();
  const rawM = now.getMinutes();
  const period = rawH >= 12 ? 'PM' : 'AM';
  let h12 = rawH % 12;
  if (h12 === 0) h12 = 12;
  return {
    rawH,
    rawM,
    h12,
    period,
    iso: now.toISOString(),
  };
};

export default function ScheduleTaskPage({
  user,
  editingTask,
  onSubmitTask,
  onRequireAuth,
  onCancelEditing,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [validationError, setValidationError] = useState('');

  // Initial time defaults to exact user current time
  const initialTime = useMemo(() => getCurrentTimeComponents(), []);

  // Due Date (Mandatory)
  const [dueDate, setDueDate] = useState(() => {
    if (editingTask?.dueDate) {
      return new Date(editingTask.dueDate).toISOString();
    }
    return initialTime.iso;
  });

  // Calendar Year & Month
  const initialDateObj = dueDate ? new Date(dueDate) : new Date();
  const [calMonth, setCalMonth] = useState(initialDateObj.getMonth());
  const [calYear, setCalYear] = useState(initialDateObj.getFullYear());

  // Time Stepper state (Hour 1-12, Minute 0-59, Period AM/PM)
  const [hour12, setHour12] = useState(() => {
    if (editingTask?.dueDate) {
      const d = new Date(editingTask.dueDate);
      let h = d.getHours() % 12;
      return h === 0 ? 12 : h;
    }
    return initialTime.h12;
  });

  const [minute, setMinute] = useState(() => {
    if (editingTask?.dueDate) {
      return new Date(editingTask.dueDate).getMinutes();
    }
    return initialTime.rawM;
  });

  const [period, setPeriod] = useState(() => {
    if (editingTask?.dueDate) {
      return new Date(editingTask.dueDate).getHours() >= 12 ? 'PM' : 'AM';
    }
    return initialTime.period;
  });

  // Attachments State: media (images, videos), documents, sticky memo
  const [attachments, setAttachments] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);
  const [fileError, setFileError] = useState(null);

  const fileInputRef = useRef(null);

  // Sync state if editingTask changes
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      setPriority(editingTask.priority || 'medium');
      const d = editingTask.dueDate ? new Date(editingTask.dueDate) : new Date();
      setDueDate(d.toISOString());
      setCalMonth(d.getMonth());
      setCalYear(d.getFullYear());

      let h = d.getHours() % 12;
      setHour12(h === 0 ? 12 : h);
      setMinute(d.getMinutes());
      setPeriod(d.getHours() >= 12 ? 'PM' : 'AM');
      setAttachments(editingTask.attachments || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      const nowComp = getCurrentTimeComponents();
      setDueDate(nowComp.iso);
      setHour12(nowComp.h12);
      setMinute(nowComp.rawM);
      setPeriod(nowComp.period);
      setAttachments([]);
    }
    setValidationError('');
  }, [editingTask]);

  // Recompute date object when hour12, minute, period, or calendar date changes
  const updateDateTime = (newH12, newMin, newPeriod, baseDateIso = dueDate) => {
    let h24 = newH12 % 12;
    if (newPeriod === 'PM') h24 += 12;

    const base = baseDateIso ? new Date(baseDateIso) : new Date();
    const updated = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      h24,
      newMin,
      0
    );
    setDueDate(updated.toISOString());
  };

  // Calendar Days Computation
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay(); // 0 is Sunday

    const blanks = Array.from({ length: firstDayIndex }, (_, i) => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return [...blanks, ...days];
  }, [calYear, calMonth]);

  // Month Navigation
  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((prev) => prev - 1);
    } else {
      setCalMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((prev) => prev + 1);
    } else {
      setCalMonth((prev) => prev + 1);
    }
  };

  // Jump to Today
  const handleJumpToToday = () => {
    const now = new Date();
    setCalMonth(now.getMonth());
    setCalYear(now.getFullYear());
    selectDay(now.getDate(), now.getMonth(), now.getFullYear());
  };

  // Day Selection in Calendar
  const selectDay = (day, m = calMonth, y = calYear) => {
    setValidationError('');
    let h24 = hour12 % 12;
    if (period === 'PM') h24 += 12;
    const dateObj = new Date(y, m, day, h24, minute, 0);
    setDueDate(dateObj.toISOString());
  };

  // Steppers for Hour
  const handleHourIncrement = () => {
    const next = hour12 === 12 ? 1 : hour12 + 1;
    setHour12(next);
    updateDateTime(next, minute, period);
  };

  const handleHourDecrement = () => {
    const prev = hour12 === 1 ? 12 : hour12 - 1;
    setHour12(prev);
    updateDateTime(prev, minute, period);
  };

  // Steppers for Minute
  const handleMinuteIncrement = (step = 1) => {
    const next = (minute + step) % 60;
    setMinute(next);
    updateDateTime(hour12, next, period);
  };

  const handleMinuteDecrement = (step = 1) => {
    const prev = (minute - step + 60) % 60;
    setMinute(prev);
    updateDateTime(hour12, prev, period);
  };

  // Toggle AM / PM
  const handlePeriodToggle = (p) => {
    setPeriod(p);
    updateDateTime(hour12, minute, p);
  };

  // Quick Action: Reset time to exact current time (Now)
  const handleResetToCurrentTime = () => {
    const nowComp = getCurrentTimeComponents();
    setHour12(nowComp.h12);
    setMinute(nowComp.rawM);
    setPeriod(nowComp.period);
    updateDateTime(nowComp.h12, nowComp.rawM, nowComp.period);
  };

  // Presets
  const applyPreset = (presetKey) => {
    const presetIso = getPresetDateTime(presetKey);
    const d = new Date(presetIso);
    setCalMonth(d.getMonth());
    setCalYear(d.getFullYear());

    let h = d.getHours() % 12;
    const newH12 = h === 0 ? 12 : h;
    const newMin = d.getMinutes();
    const newP = d.getHours() >= 12 ? 'PM' : 'AM';

    setHour12(newH12);
    setMinute(newMin);
    setPeriod(newP);
    setDueDate(d.toISOString());
    setValidationError('');
  };

  // Check if a day is currently selected
  const isDaySelected = (day) => {
    if (!dueDate || !day) return false;
    const d = new Date(dueDate);
    return (
      d.getDate() === day &&
      d.getMonth() === calMonth &&
      d.getFullYear() === calYear
    );
  };

  // Check if day is today
  const isDayToday = (day) => {
    if (!day) return false;
    const now = new Date();
    return (
      now.getDate() === day &&
      now.getMonth() === calMonth &&
      now.getFullYear() === calYear
    );
  };

  // Handle Device File Upload
  const handleFileUpload = (e) => {
    setFileError(null);
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        setFileError(`File "${file.name}" exceeds the 20MB limit.`);
        return;
      }

      let detectedType = 'document';
      if (file.type.startsWith('image/')) detectedType = 'image';
      else if (file.type.startsWith('video/')) detectedType = 'video';

      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment = {
          name: file.name,
          fileType: detectedType,
          size: file.size,
          dataUrl: reader.result,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const newNoteAttachment = {
      name: 'Attached Memo',
      fileType: 'note',
      note: noteInput.trim(),
      dataUrl: noteInput.trim(),
    };
    setAttachments((prev) => [...prev, newNoteAttachment]);
    setNoteInput('');
    setShowNoteField(false);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submit with STRICT Mandatory Validation
  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!title.trim()) {
      setValidationError('Please enter a task title.');
      return;
    }

    if (!dueDate) {
      setValidationError('Scheduled Date and Time is mandatory. Please select a date on the calendar.');
      return;
    }

    const taskPayload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status: editingTask?.status || 'pending',
      dueDate,
      attachments,
    };

    if (!user) {
      onRequireAuth(taskPayload);
    } else {
      onSubmitTask(taskPayload);
    }
  };

  return (
    <div className="schedule-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>{editingTask ? 'Edit Task Schedule' : 'Schedule a New Task'}</span>
          </h1>
          <p className="page-subtitle">
            Set exact due date and time, adjust priority, and attach multimedia or notes to your task.
          </p>
        </div>

        {editingTask && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancelEditing}
          >
            Cancel Editing
          </button>
        )}
      </div>

      <div className="elegant-card p-3 p-sm-4 p-md-5" style={{ maxWidth: '860px', margin: '0 auto' }}>
        {validationError && (
          <div className="alert-banner error animate-fade-in" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircleIcon size={18} color="var(--accent-rose)" />
              <strong>{validationError}</strong>
            </div>
            <button
              type="button"
              className="toast-dismiss-btn"
              onClick={() => setValidationError('')}
            >
              <XIcon size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="task-input-form">
          {/* Task Title (Mandatory) */}
          <div className="input-group">
            <label className="input-label" htmlFor="task-title">
              Task Title <span className="required-star">*</span>
            </label>
            <input
              id="task-title"
              className="form-input form-input-lg"
              type="text"
              placeholder="e.g. Finalize quarterly architecture presentation"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError('');
              }}
              required
            />
          </div>

          {/* Description & Context */}
          <div className="input-group">
            <label className="input-label" htmlFor="task-desc">
              Description & Notes <span className="optional-tag">(Optional)</span>
            </label>
            <textarea
              id="task-desc"
              className="form-textarea"
              rows={2}
              placeholder="Add key milestones, guidelines, links, or expectations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* INTERACTIVE VISUAL CALENDAR & TIME SECTION (MANDATORY) */}
          <div className="input-group" style={{ marginTop: '1.5rem' }}>
            <label className="input-label">
              <CalendarIcon size={16} color="var(--primary)" />
              <span>Schedule Date & Time <span className="required-star">*</span></span>
            </label>

            <div className={`calendar-scheduler-container ${!dueDate ? 'has-error' : ''}`}>
              {/* Left Column: Visual Calendar Widget */}
              <div className="calendar-widget">
                <div className="calendar-header">
                  <button
                    type="button"
                    className="calendar-nav-btn"
                    onClick={handlePrevMonth}
                    title="Previous Month"
                    aria-label="Previous Month"
                  >
                    <ChevronLeftIcon size={16} />
                  </button>

                  <div className="calendar-title">
                    <span>{MONTH_NAMES[calMonth]} {calYear}</span>
                    <button
                      type="button"
                      className="cal-today-badge"
                      onClick={handleJumpToToday}
                    >
                      Today
                    </button>
                  </div>

                  <button
                    type="button"
                    className="calendar-nav-btn"
                    onClick={handleNextMonth}
                    title="Next Month"
                    aria-label="Next Month"
                  >
                    <ChevronRightIcon size={16} />
                  </button>
                </div>

                <div className="calendar-weekdays">
                  {WEEKDAY_NAMES.map((d, i) => (
                    <span key={i} className="weekday-col">{d}</span>
                  ))}
                </div>

                <div className="calendar-days-grid">
                  {calendarDays.map((day, idx) => {
                    if (day === null) {
                      return <span key={`blank-${idx}`} className="calendar-day-empty"></span>;
                    }
                    const selected = isDaySelected(day);
                    const today = isDayToday(day);
                    return (
                      <button
                        key={`day-${day}`}
                        type="button"
                        className={`calendar-day-btn ${selected ? 'selected' : ''} ${today ? 'today' : ''}`}
                        onClick={() => selectDay(day)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Tactile Time Stepper Picker */}
              <div className="scheduler-time-panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                    <ClockIcon size={15} color="var(--primary)" />
                    <span>Exact Reminder Time</span>
                  </h4>
                  <button
                    type="button"
                    className="time-now-btn"
                    onClick={handleResetToCurrentTime}
                    title="Sync with current system time"
                  >
                    Set to Now
                  </button>
                </div>

                {/* Tactile Time Stepper Display with Up & Down Arrows */}
                <div className="tactile-time-stepper">
                  {/* Hours Stepper */}
                  <div className="stepper-col">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={handleHourIncrement}
                      aria-label="Increment Hour"
                    >
                      <ChevronUpIcon size={16} />
                    </button>
                    <div className="stepper-display">
                      {String(hour12).padStart(2, '0')}
                    </div>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={handleHourDecrement}
                      aria-label="Decrement Hour"
                    >
                      <ChevronDownIcon size={16} />
                    </button>
                    <span className="stepper-label">HOUR</span>
                  </div>

                  <div className="stepper-colon">:</div>

                  {/* Minutes Stepper */}
                  <div className="stepper-col">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => handleMinuteIncrement(1)}
                      aria-label="Increment Minute"
                    >
                      <ChevronUpIcon size={16} />
                    </button>
                    <div className="stepper-display">
                      {String(minute).padStart(2, '0')}
                    </div>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => handleMinuteDecrement(1)}
                      aria-label="Decrement Minute"
                    >
                      <ChevronDownIcon size={16} />
                    </button>
                    <span className="stepper-label">MIN</span>
                  </div>

                  {/* Period AM / PM Selector */}
                  <div className="period-toggle-col">
                    <button
                      type="button"
                      className={`period-btn ${period === 'AM' ? 'active' : ''}`}
                      onClick={() => handlePeriodToggle('AM')}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      className={`period-btn ${period === 'PM' ? 'active' : ''}`}
                      onClick={() => handlePeriodToggle('PM')}
                    >
                      PM
                    </button>
                    <span className="stepper-label">PERIOD</span>
                  </div>
                </div>

                {/* Quick Minute Offset Chips */}
                <div className="quick-time-chips" style={{ marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="time-chip-btn"
                    onClick={() => handleMinuteIncrement(15)}
                    title="Add 15 minutes"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    className="time-chip-btn"
                    onClick={() => handleMinuteIncrement(30)}
                    title="Add 30 minutes"
                  >
                    +30m
                  </button>
                  <button
                    type="button"
                    className="time-chip-btn"
                    onClick={handleHourIncrement}
                    title="Add 1 hour"
                  >
                    +1h
                  </button>
                  <button
                    type="button"
                    className="time-chip-btn"
                    onClick={() => {
                      setHour12(5);
                      setMinute(0);
                      setPeriod('PM');
                      updateDateTime(5, 0, 'PM');
                    }}
                  >
                    5:00 PM
                  </button>
                  <button
                    type="button"
                    className="time-chip-btn"
                    onClick={() => {
                      setHour12(9);
                      setMinute(0);
                      setPeriod('AM');
                      updateDateTime(9, 0, 'AM');
                    }}
                  >
                    9:00 AM
                  </button>
                </div>

                {/* Date Presets */}
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '1rem 0 0.5rem' }}>
                  Quick Shortcuts
                </h4>
                <div className="preset-chips">
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => applyPreset('today_evening')}
                  >
                    Today 5 PM
                  </button>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => applyPreset('tomorrow_morning')}
                  >
                    Tomorrow 9 AM
                  </button>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => applyPreset('next_week')}
                  >
                    Next Week
                  </button>
                </div>

                {/* Selected Reminder Banner Preview */}
                <div className="selected-date-preview">
                  {dueDate ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <CheckCircleIcon size={16} color="var(--accent-emerald)" />
                      <span>
                        <strong>Target Deadline:</strong> {formatDateFull(dueDate)}
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <AlertCircleIcon size={16} color="var(--accent-rose)" />
                      <span>Please select a date on the calendar</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* REFINED PRIORITY LEVEL CARDS WITH SVG ICONS */}
          <div className="input-group" style={{ marginTop: '1.75rem' }}>
            <label className="input-label">
              Priority Urgency Level
            </label>
            <div className="row g-2 g-sm-3 mb-2">
              {/* Low Priority Card */}
              <div className="col-12 col-md-4">
                <div
                  className={`priority-select-card h-100 w-100 prio-low ${priority === 'low' ? 'selected' : ''}`}
                  onClick={() => setPriority('low')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="prio-card-icon" style={{ color: 'var(--accent-emerald)' }}>
                    <LeafIcon size={22} />
                  </div>
                  <div className="prio-card-info">
                    <div className="prio-card-title">Low Priority</div>
                    <div className="prio-card-desc">Flexible timeline, routine work</div>
                  </div>
                  <div className="prio-radio-indicator"></div>
                </div>
              </div>

              {/* Medium Priority Card */}
              <div className="col-12 col-md-4">
                <div
                  className={`priority-select-card h-100 w-100 prio-med ${priority === 'medium' ? 'selected' : ''}`}
                  onClick={() => setPriority('medium')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="prio-card-icon" style={{ color: 'var(--accent-amber)' }}>
                    <ZapIcon size={22} />
                  </div>
                  <div className="prio-card-info">
                    <div className="prio-card-title">Medium Priority</div>
                    <div className="prio-card-desc">Standard workflow, important tasks</div>
                  </div>
                  <div className="prio-radio-indicator"></div>
                </div>
              </div>

              {/* High Priority Card */}
              <div className="col-12 col-md-4">
                <div
                  className={`priority-select-card h-100 w-100 prio-high ${priority === 'high' ? 'selected' : ''}`}
                  onClick={() => setPriority('high')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="prio-card-icon" style={{ color: 'var(--accent-rose)' }}>
                    <FlameIcon size={22} />
                  </div>
                  <div className="prio-card-info">
                    <div className="prio-card-title">High Priority</div>
                    <div className="prio-card-desc">Urgent, time-critical item</div>
                  </div>
                  <div className="prio-radio-indicator"></div>
                </div>
              </div>
            </div>
          </div>

          {/* ATTACHMENTS & MEDIA SECTION WITH SVG ICONS */}
          <div className="attachments-section" style={{ marginTop: '1.75rem' }}>
            <div className="attachments-header">
              <label className="input-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <PaperclipIcon size={16} color="var(--primary)" />
                <span>Media & File Attachments (Images, Videos, Notes)</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <PaperclipIcon size={14} />
                  <span>Upload Device Media</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowNoteField(!showNoteField)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <FileTextIcon size={14} />
                  <span>Attach Sticky Memo</span>
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              multiple
              accept="image/*,video/*,application/pdf,text/*"
            />

            {fileError && (
              <div className="alert-banner error" style={{ margin: '0.75rem 0' }}>
                <span>{fileError}</span>
              </div>
            )}

            {/* Quick Sticky Memo Input */}
            {showNoteField && (
              <div className="memo-input-box animate-fade-in">
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Write quick notes, checklist items, or research snippets to attach..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleAddNote}
                  >
                    Attach Note
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setShowNoteField(false);
                      setNoteInput('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Attachments List / Previews */}
            {attachments.length > 0 && (
              <div className="attachments-preview-grid animate-fade-in">
                {attachments.map((item, idx) => (
                  <div key={idx} className="attachment-chip">
                    {item.fileType === 'image' && (
                      <img src={item.dataUrl} alt={item.name} className="attachment-thumb" />
                    )}
                    {item.fileType === 'video' && (
                      <span className="attachment-icon" style={{ color: '#818cf8' }}>
                        <VideoIcon size={20} />
                      </span>
                    )}
                    {item.fileType === 'note' && (
                      <span className="attachment-icon" style={{ color: '#fbbf24' }}>
                        <FileTextIcon size={20} />
                      </span>
                    )}
                    {item.fileType === 'document' && (
                      <span className="attachment-icon" style={{ color: '#6ee7b7' }}>
                        <FileTextIcon size={20} />
                      </span>
                    )}

                    <div className="attachment-details">
                      <span className="attachment-name" title={item.name || item.note}>
                        {item.name || item.note}
                      </span>
                      <span className="attachment-size">
                        {item.fileType.toUpperCase()}
                        {item.size ? ` • ${(item.size / 1024).toFixed(0)} KB` : ''}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="attachment-delete-btn"
                      onClick={() => handleRemoveAttachment(idx)}
                      title="Remove attachment"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Submit Row */}
          <div className="form-submit-row" style={{ marginTop: '2rem' }}>
            <button
              type="submit"
              className="btn btn-primary submit-task-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {editingTask ? (
                <>
                  <CheckCircleIcon size={18} />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <PlusIcon size={18} />
                  <span>Add Task to Schedule</span>
                </>
              )}
            </button>

            {!user && (
              <span className="submit-hint" style={{ color: '#a5b4fc' }}>
                When you click "Add Task to Schedule", we will route you to sign in to save it!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
