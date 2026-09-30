import React, { useState } from 'react';
import { api } from '../services/api.js';
import {
  CalendarIcon,
  PaperclipIcon,
  XIcon,
  LockIcon,
  CheckCircleIcon,
} from './Icons.jsx';

export default function AuthPage({
  onAuthSuccess,
  onCancel,
  pendingTask,
  initialMode = 'login',
}) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name');
        res = await api.signup({ name: name.trim(), email: email.trim(), password });
      } else {
        res = await api.login({ email: email.trim(), password });
      }
      onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-view animate-fade-in">
      <div className="auth-card" style={{ margin: '0 auto' }}>
        {onCancel && (
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            title="Return to previous page"
            aria-label="Back"
          >
            <XIcon size={16} />
          </button>
        )}

        <div className="auth-header">
          <div className="auth-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="auth-title">
            {pendingTask
              ? mode === 'signup'
                ? 'Create Account to Save Task'
                : 'Sign In to Save Task'
              : mode === 'login'
              ? 'Welcome to MyTasks'
              : 'Create Your Workspace'}
          </h1>
          <p className="auth-subtitle">
            {pendingTask
              ? 'Please sign in or create an account to record your scheduled task and keep it synchronized.'
              : mode === 'login'
              ? 'Access your personalized dashboard, active tasks, and accomplishment history.'
              : 'Sign up for free to start scheduling tasks, setting priority alerts, and tracking progress.'}
          </p>
        </div>

        {/* Pending Task Preview Callout */}
        {pendingTask && (
          <div className="pending-task-preview animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 700 }}>
              <LockIcon size={13} />
              <span className="pending-label">Pending Task to be Saved:</span>
            </div>
            <span className="pending-title">"{pendingTask.title}"</span>
            {pendingTask.dueDate && (
              <span style={{ fontSize: '0.75rem', color: '#c7d2fe', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CalendarIcon size={12} />
                <span>Scheduled: {new Date(pendingTask.dueDate).toLocaleString()}</span>
              </span>
            )}
            {pendingTask.attachments && pendingTask.attachments.length > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <PaperclipIcon size={12} />
                <span>{pendingTask.attachments.length} attached {pendingTask.attachments.length === 1 ? 'file' : 'files'}</span>
              </span>
            )}
          </div>
        )}

        {/* Tab Toggle */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="alert-banner error animate-fade-in">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="input-group">
              <label className="input-label" htmlFor="auth-name">
                Your Full Name
              </label>
              <input
                id="auth-name"
                className="form-input"
                type="text"
                placeholder="e.g. Sarah Connor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="auth-email">
              Email Address
            </label>
            <input
              id="auth-email"
              className="form-input"
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              className="form-input"
              type="password"
              placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : pendingTask ? (
              <>
                <CheckCircleIcon size={16} />
                <span>{mode === 'signup' ? 'Create Account & Save Task' : 'Sign In & Save Task'}</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create My Account'}</span>
            )}
          </button>
        </form>

        <p className="auth-toggle-text">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button
            type="button"
            className="auth-toggle-link"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
            }}
          >
            {mode === 'login' ? 'Sign up free' : 'Sign in here'}
          </button>
        </p>
      </div>
    </div>
  );
}
