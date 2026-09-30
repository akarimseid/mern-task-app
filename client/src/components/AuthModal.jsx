import React, { useState } from 'react';
import { api } from '../services/api.js';

export default function AuthModal({ onAuthSuccess, onClose, pendingTask, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
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
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay animate-fade-in" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        )}

        <div className="auth-header">
          <div className="auth-logo">✓</div>
          <h1 className="auth-title">
            {pendingTask
              ? mode === 'signup'
                ? 'Create Account to Save Task'
                : 'Sign In to Save Task'
              : mode === 'login'
              ? 'Welcome to MyTasks'
              : 'Join MyTasks Today'}
          </h1>
          <p className="auth-subtitle">
            {pendingTask
              ? 'Create a free account or sign in with your email to record this task and sync it.'
              : mode === 'login'
              ? 'Sign in to access your scheduled tasks, priorities, and accomplishment history.'
              : 'Start organizing your schedule with intelligent timestamps and task archiving.'}
          </p>
        </div>

        {pendingTask && (
          <div className="pending-task-preview animate-fade-in">
            <span className="pending-label">📌 Pending Task to Save:</span>
            <span className="pending-title">"{pendingTask.title}"</span>
          </div>
        )}

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
                Full Name
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
              placeholder="you@example.com"
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
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.85rem' }}
            disabled={loading}
          >
            {loading
              ? 'Processing...'
              : pendingTask
              ? mode === 'signup'
                ? 'Create Account & Save Task'
                : 'Sign In & Save Task'
              : mode === 'login'
              ? 'Sign In to Dashboard'
              : 'Create My Account'}
          </button>
        </form>

        <p className="auth-toggle-text">
          {mode === 'login' ? "Don't have an account?" : 'Already registered?'}
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
