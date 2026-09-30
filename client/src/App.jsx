import React, { useState, useEffect } from 'react';
import { api } from './services/api.js';
import Navbar from './components/Navbar.jsx';
import DashboardPage from './components/DashboardPage.jsx';
import ScheduleTaskPage from './components/ScheduleTaskPage.jsx';
import TasksPage from './components/TasksPage.jsx';
import AuthPage from './components/AuthPage.jsx';
import AdminPage from './components/AdminPage.jsx';
import MediaModal from './components/MediaModal.jsx';
import { ClockIcon, AlertCircleIcon, XIcon } from './components/Icons.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'schedule' | 'tasks' | 'auth'
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Guest flow pending task
  const [pendingTaskToSave, setPendingTaskToSave] = useState(null);

  // Lightbox Media Preview
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  // Check persistent session on initial mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await api.getMe();
        if (currentUser) {
          setUser(currentUser);
          await loadUserTasks();
        } else {
          // Zero fake tasks for guests - keeps counts at 0
          setTasks([]);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setAuthChecking(false);
      }
    };

    checkSession();
  }, []);

  const loadUserTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.fetchTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch tasks from server');
    } finally {
      setLoading(false);
    }
  };

  // Guest clicks "Add Task to Schedule" -> Route directly to Auth page
  const handleRequireAuth = (taskData) => {
    setPendingTaskToSave(taskData);
    setActiveTab('auth');
    showToast('Please sign in or create an account to save this task!');
  };

  // Auth Success (Login or Signup)
  const handleAuthSuccess = async (authenticatedUser) => {
    setUser(authenticatedUser);

    if (pendingTaskToSave) {
      try {
        const created = await api.createTask(pendingTaskToSave);
        setPendingTaskToSave(null);
        showToast(`Welcome ${authenticatedUser.name}! Your task "${created.title}" has been saved.`);
        await loadUserTasks();
        setActiveTab('tasks');
        return;
      } catch (err) {
        console.error('Error saving pending task:', err);
      }
    } else {
      showToast(`Welcome back, ${authenticatedUser.name}!`);
    }

    await loadUserTasks();
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    api.removeToken();
    setUser(null);
    setEditingTask(null);
    setTasks([]);
    setActiveTab('dashboard');
    showToast('Signed out of MyTasks.');
  };

  // Submit Task (from ScheduleTaskPage)
  const handleScheduleSubmit = async (formData) => {
    try {
      setError(null);
      if (editingTask) {
        const updated = await api.updateTask(editingTask._id, formData);
        setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        setEditingTask(null);
        showToast('Task updated successfully.');
      } else {
        const created = await api.createTask(formData);
        setTasks((prev) => [created, ...prev]);
        showToast('Task scheduled successfully.');
      }
      setActiveTab('tasks');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save task');
    }
  };

  // Update Task State (Pending ↔ In Progress ↔ Completed)
  const handleUpdateStatus = async (task, newStatus) => {
    if (!user) {
      setActiveTab('auth');
      return;
    }

    try {
      setError(null);
      const updated = await api.updateTask(task._id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));

      if (newStatus === 'completed') {
        showToast('Task marked as completed and archived in history.');
      } else if (newStatus === 'in-progress') {
        showToast('Task workflow state updated to In Progress.');
      } else {
        showToast('Task workflow state set to Pending.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update task state');
    }
  };

  // Quick toggle (from check circle)
  const handleToggleTask = async (task) => {
    if (!user) {
      setActiveTab('auth');
      return;
    }

    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    await handleUpdateStatus(task, nextStatus);
  };

  // Quick Reschedule (+1 Day or custom)
  const handleRescheduleTask = async (task, daysToAdd = 1) => {
    if (!user) {
      setActiveTab('auth');
      return;
    }

    try {
      setError(null);
      const cur = task.dueDate ? new Date(task.dueDate) : new Date();
      cur.setDate(cur.getDate() + daysToAdd);
      const updated = await api.updateTask(task._id, { dueDate: cur.toISOString() });
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      showToast(`Rescheduled "${task.title}" by +${daysToAdd} day.`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to reschedule task');
    }
  };

  // Delete Task
  const handleDeleteTask = async (id) => {
    if (!user) {
      setActiveTab('auth');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      setError(null);
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      if (editingTask?._id === id) setEditingTask(null);
      showToast('Task removed.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete task');
    }
  };

  // Trigger editing a task
  const handleEditTask = (task) => {
    if (!user) {
      setActiveTab('auth');
      return;
    }
    setEditingTask(task);
    setActiveTab('schedule');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeTasks = tasks.filter((t) => t.status !== 'completed');

  if (authChecking) {
    return (
      <div className="auth-wrapper">
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            <ClockIcon size={44} />
          </div>
          <p>Loading your personal workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab === 'history' ? 'dashboard' : activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'schedule') setEditingTask(null);
        }}
        activeCount={activeTasks.length}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content container-xl px-2 px-sm-3 px-md-4 py-3 py-md-4">
        {/* Floating Toast Notification */}
        {toast && (
          <div className="toast-notification animate-fade-in">
            <span>{toast}</span>
            <button
              type="button"
              className="toast-dismiss-btn"
              onClick={() => setToast(null)}
              aria-label="Dismiss toast"
            >
              <XIcon size={14} />
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="alert-banner error animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircleIcon size={18} color="var(--accent-rose)" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. SEPARATE DASHBOARD PAGE (Includes Merged Accomplishment History) */}
        {activeTab === 'dashboard' && (
          <DashboardPage
            tasks={tasks}
            user={user}
            onNavigate={(tab) => setActiveTab(tab)}
            onToggleTask={handleToggleTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onViewAttachment={(att) => setSelectedAttachment(att)}
            onRescheduleTask={handleRescheduleTask}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* 2. SEPARATE SCHEDULE TASK PAGE (With Tactile Time Picker & Interactive Calendar) */}
        {activeTab === 'schedule' && (
          <ScheduleTaskPage
            user={user}
            editingTask={editingTask}
            onSubmitTask={handleScheduleSubmit}
            onRequireAuth={handleRequireAuth}
            onCancelEditing={() => {
              setEditingTask(null);
              setActiveTab('tasks');
            }}
          />
        )}

        {/* 3. SEPARATE TASKS PAGE (With card state changer & filters) */}
        {activeTab === 'tasks' && (
          <TasksPage
            tasks={tasks}
            user={user}
            onNavigate={(tab) => setActiveTab(tab)}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onToggleTask={handleToggleTask}
            onUpdateStatus={handleUpdateStatus}
            onViewAttachment={(att) => setSelectedAttachment(att)}
            loading={loading}
          />
        )}

        {/* 4. DEDICATED AUTH PAGE */}
        {activeTab === 'auth' && (
          <AuthPage
            onAuthSuccess={handleAuthSuccess}
            onCancel={() => {
              setActiveTab('dashboard');
              setPendingTaskToSave(null);
            }}
            pendingTask={pendingTaskToSave}
            initialMode={pendingTaskToSave ? 'signup' : 'login'}
          />
        )}

        {/* 5. DEDICATED ROOT ADMIN CONTROL CENTER */}
        {activeTab === 'admin' && (
          <AdminPage
            user={user}
            onNavigate={(tab) => setActiveTab(tab)}
            onViewAttachment={(att) => setSelectedAttachment(att)}
            onUserRoleChange={(updatedUser) => setUser(updatedUser)}
          />
        )}
      </main>

      {/* Lightbox Modal for Attached Images, Videos, Notes & Documents */}
      {selectedAttachment && (
        <MediaModal
          attachment={selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
        />
      )}
    </div>
  );
}