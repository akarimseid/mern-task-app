export const toInputDateTime = (dateVal) => {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export const formatDateTime = (dateVal) => {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateFull = (dateVal) => {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const getScheduleStatus = (dueDateVal, isCompleted = false) => {
  if (!dueDateVal || isCompleted) return null;
  const due = new Date(dueDateVal);
  const now = new Date();
  if (isNaN(due.getTime())) return null;

  const diffMs = due.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const isSameDay =
    due.getDate() === now.getDate() &&
    due.getMonth() === now.getMonth() &&
    due.getFullYear() === now.getFullYear();

  if (isOverdue) {
    const diffHours = Math.abs(Math.round(diffMs / (1000 * 60 * 60)));
    const label =
      diffHours < 1
        ? 'Overdue just now'
        : diffHours < 24
        ? `Overdue by ${diffHours}h`
        : `Overdue by ${Math.round(diffHours / 24)}d`;
    return { type: 'overdue', label };
  }

  if (isSameDay) {
    const timeStr = due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return { type: 'today', label: `Due today at ${timeStr}` };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    due.getDate() === tomorrow.getDate() &&
    due.getMonth() === tomorrow.getMonth() &&
    due.getFullYear() === tomorrow.getFullYear();

  if (isTomorrow) {
    const timeStr = due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return { type: 'upcoming', label: `Tomorrow at ${timeStr}` };
  }

  return { type: 'upcoming', label: formatDateTime(due) };
};

export const getPresetDateTime = (type) => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');

  if (type === 'today_evening') {
    now.setHours(17, 0, 0, 0);
  } else if (type === 'tomorrow_morning') {
    now.setDate(now.getDate() + 1);
    now.setHours(9, 0, 0, 0);
  } else if (type === 'next_week') {
    now.setDate(now.getDate() + 7);
    now.setHours(10, 0, 0, 0);
  }

  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};
