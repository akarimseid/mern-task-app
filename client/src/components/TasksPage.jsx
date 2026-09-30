import React, { useState, useMemo } from 'react';
import TaskItem from './TaskItem.jsx';
import {
  TasksIcon,
  PlusIcon,
  SearchIcon,
  CalendarIcon,
  ClockIcon,
  FlameIcon,
  FilterIcon,
  AlertTriangleIcon,
  XIcon,
  CheckCircleIcon,
} from './Icons.jsx';

export default function TasksPage({
  tasks,
  user,
  onNavigate,
  onEditTask,
  onDeleteTask,
  onToggleTask,
  onUpdateStatus,
  onViewAttachment,
  loading,
}) {
  // Multi-Filter State
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'this_week' | 'upcoming' | 'overdue'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'in-progress'
  const [sortBy, setSortBy] = useState('due_soonest'); // 'due_soonest' | 'newest' | 'oldest' | 'prio_highest'
  const [search, setSearch] = useState('');

  // Stats (Ensure 0 for guest visitors without tasks)
  const stats = useMemo(() => {
    if (!user) {
      return {
        activeCount: 0,
        todayCount: 0,
        overdueCount: 0,
        highCount: 0,
        inProgressCount: 0,
      };
    }
    const now = new Date();
    const active = tasks.filter((t) => t.status !== 'completed');
    const today = active.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });
    const overdue = active.filter((t) => t.dueDate && new Date(t.dueDate) < now);
    const high = active.filter((t) => t.priority === 'high');
    const inProgress = active.filter((t) => t.status === 'in-progress');

    return {
      activeCount: active.length,
      todayCount: today.length,
      overdueCount: overdue.length,
      highCount: high.length,
      inProgressCount: inProgress.length,
    };
  }, [tasks, user]);

  const hasActiveFilters =
    priorityFilter !== 'all' ||
    dateFilter !== 'all' ||
    statusFilter !== 'all' ||
    search.trim() !== '';

  const clearAllFilters = () => {
    setPriorityFilter('all');
    setDateFilter('all');
    setStatusFilter('all');
    setSearch('');
    setSortBy('due_soonest');
  };

  // Filtered & Sorted Tasks (Empty for guests without tasks)
  const processedTasks = useMemo(() => {
    if (!user && tasks.length === 0) return [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

    let list = tasks.filter((t) => t.status !== 'completed');

    // 1. Text Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // 2. Priority Filter
    if (priorityFilter !== 'all') {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    // 3. Status Filter (Pending / In Progress)
    if (statusFilter !== 'all') {
      list = list.filter((t) => t.status === statusFilter);
    }

    // 4. Date Filter
    if (dateFilter === 'today') {
      list = list.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d >= startOfToday && d <= endOfToday;
      });
    } else if (dateFilter === 'this_week') {
      list = list.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d >= startOfToday && d <= endOfWeek;
      });
    } else if (dateFilter === 'upcoming') {
      list = list.filter((t) => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) > now;
      });
    } else if (dateFilter === 'overdue') {
      list = list.filter((t) => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < now;
      });
    }

    // 5. Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === 'prio_highest') {
        const score = { high: 3, medium: 2, low: 1 };
        return score[b.priority] - score[a.priority];
      }
      if (sortBy === 'due_soonest') {
        if (!a.dueDate && !b.dueDate) return new Date(b.createdAt) - new Date(a.createdAt);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return 0;
    });

    return list;
  }, [tasks, user, priorityFilter, dateFilter, statusFilter, sortBy, search]);

  return (
    <div className="tasks-page-view animate-fade-in">
      {/* Page Header */}
      <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center gap-2 mb-1">
            <TasksIcon size={26} color="var(--primary)" />
            <span>Active Tasks & Workflows</span>
          </h1>
          <p className="page-subtitle mb-0">
            Manage your schedule, update progress between Pending and In Progress, and filter by priority or deadline.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary w-100 w-md-auto d-inline-flex align-items-center justify-content-center gap-2 flex-shrink-0"
          onClick={() => onNavigate('schedule')}
        >
          <PlusIcon size={16} />
          <span>Schedule a New Task</span>
        </button>
      </div>

      {/* Advanced Filter Bar with Bootstrap Grid */}
      <div className="filter-controls-container mb-4">
        <div className="row g-2 mb-2">
          {/* Keyword Search */}
          <div className="col-12 col-md-8 search-wrap">
            <input
              type="text"
              className="search-input w-100"
              placeholder="Search active tasks by keywords or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <XIcon size={14} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="col-12 col-md-4 d-flex align-items-center gap-2">
            <label className="filter-select-label text-nowrap">Sort:</label>
            <select
              className="filter-select flex-grow-1"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="due_soonest">Due Date (Soonest)</option>
              <option value="newest">Created (Newest)</option>
              <option value="oldest">Created (Oldest)</option>
              <option value="prio_highest">Priority (Highest)</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns: Priority, Date, Status */}
        <div className="row g-2 align-items-center">
          {/* Priority Filter */}
          <div className="col-6 col-sm-4 col-md-3">
            <div className="d-flex flex-column gap-1">
              <label className="filter-select-label">Priority:</label>
              <select
                className="filter-select w-100"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Date Filter */}
          <div className="col-6 col-sm-4 col-md-3">
            <div className="d-flex flex-column gap-1">
              <label className="filter-select-label">Due Date:</label>
              <select
                className="filter-select w-100"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="today">Due Today ({stats.todayCount})</option>
                <option value="this_week">Due This Week</option>
                <option value="upcoming">Upcoming (Future)</option>
                <option value="overdue">Overdue Only ({stats.overdueCount})</option>
              </select>
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-12 col-sm-4 col-md-3">
            <div className="d-flex flex-column gap-1">
              <label className="filter-select-label">Workflow State:</label>
              <select
                className="filter-select w-100"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All States</option>
                <option value="pending">To Do (Pending)</option>
                <option value="in-progress">In Progress</option>
              </select>
            </div>
          </div>

          {/* Reset Filters button */}
          <div className="col-12 col-md-3 d-flex align-items-end">
            {hasActiveFilters && (
              <button
                type="button"
                className="reset-filters-btn w-100 d-inline-flex align-items-center justify-content-center gap-1"
                onClick={clearAllFilters}
              >
                <XIcon size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary */}
        <div className="filter-summary-row">
          <span>
            Showing <strong>{processedTasks.length}</strong> of <strong>{stats.activeCount}</strong> open tasks
          </span>
          {hasActiveFilters && (
            <span className="active-filters-tag">Filters Applied</span>
          )}
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="empty-state">
          <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>
            <ClockIcon size={40} />
          </div>
          <h3>Syncing your tasks...</h3>
          <p>Connecting with your task storage...</p>
        </div>
      ) : processedTasks.length === 0 ? (
        <div className="empty-state">
          <div style={{ color: 'var(--text-faint)', marginBottom: '0.75rem' }}>
            {hasActiveFilters ? <SearchIcon size={40} /> : <CheckCircleIcon size={40} />}
          </div>
          <h3>
            {hasActiveFilters
              ? 'No tasks match current filters'
              : !user
              ? 'No active tasks yet'
              : 'All caught up!'}
          </h3>
          <p>
            {hasActiveFilters
              ? 'Try resetting your priority, date, or state filters above.'
              : !user
              ? 'You are in guest preview mode. Click "Schedule a New Task" to start planning!'
              : 'Add your next item with due dates and attachments.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {hasActiveFilters ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={clearAllFilters}
              >
                Clear All Filters
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onNavigate('schedule')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <PlusIcon size={16} />
                <span>Schedule Your First Task</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="task-grid">
          {processedTasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onToggle={onToggleTask}
              onUpdateStatus={onUpdateStatus}
              onViewAttachment={onViewAttachment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
