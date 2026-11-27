import { useEffect, useState } from 'react';
import { loginUser, registerUser } from '../services/api';

const REMEMBERED_EMAIL_KEY = 'login_app_remembered_email';

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.94" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-3.17 4.57" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LoginForm() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'info', message: string }
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Ignore storage access failures in restricted environments
    }
  }, []);

  function switchMode(nextMode) {
    setMode(nextMode);
    setPassword('');
    setShowPassword(false);
    setFeedback(null);
  }

  function handleForgotPassword(event) {
    event.preventDefault();
    setFeedback({
      type: 'info',
      message: 'Forgot password is a UI-only preview in this practice app. Please register a new account or contact your administrator.',
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFeedback({
        type: 'error',
        message: 'Please enter both your email address and password.',
      });
      return;
    }

    if (mode === 'register' && name.trim().length < 2) {
      setFeedback({
        type: 'error',
        message: 'Please enter your full name (at least 2 characters).',
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await loginUser({ email: trimmedEmail, password });
        try {
          if (rememberMe) {
            localStorage.setItem(REMEMBERED_EMAIL_KEY, trimmedEmail);
          } else {
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          }
        } catch {
          // Ignore storage errors
        }
        setAuthenticatedUser(result.user);
        setFeedback({
          type: 'success',
          message: result.message || 'Login successful.',
        });
        setPassword('');
      } else {
        const result = await registerUser({
          name: name.trim(),
          email: trimmedEmail,
          password,
        });
        setMode('login');
        setName('');
        setPassword('');
        setFeedback({
          type: 'success',
          message: `${result.message || 'Account registered successfully.'} You can now sign in.`,
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.message || 'Authentication failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setAuthenticatedUser(null);
    setPassword('');
    setFeedback({
      type: 'info',
      message: 'You have been signed out.',
    });
  }

  if (authenticatedUser) {
    return (
      <div className="auth-card" role="region" aria-label="Authenticated session">
        <div className="auth-header">
          <div className="brand-badge brand-badge-success" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1>Welcome back, {authenticatedUser.name}</h1>
          <p className="subtitle">Authenticated via Express API &amp; MySQL 8.0</p>
        </div>

        {feedback && (
          <div className={`alert alert-${feedback.type}`} role="status">
            {feedback.message}
          </div>
        )}

        <div className="profile-summary">
          <div className="profile-row">
            <span className="profile-label">User ID</span>
            <span className="profile-value">#{authenticatedUser.id}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Name</span>
            <span className="profile-value">{authenticatedUser.name}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Email</span>
            <span className="profile-value">{authenticatedUser.email}</span>
          </div>
        </div>

        <button type="button" className="btn-primary" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    );
  }

  const isLogin = mode === 'login';

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="brand-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1>{isLogin ? 'Sign in to your account' : 'Create your account'}</h1>
        <p className="subtitle">
          {isLogin
            ? 'Enter your credentials to access the application'
            : 'Register a new user in the MySQL database'}
        </p>
      </div>

      {feedback && (
        <div
          className={`alert alert-${feedback.type}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {!isLogin && (
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder={isLogin ? 'Enter your password' : 'Minimum 6 characters'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              disabled={loading}
            >
              <EyeIcon visible={showPassword} />
              <span>{showPassword ? 'Hide' : 'Show'}</span>
            </button>
          </div>
        </div>

        {isLogin && (
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Remember me</span>
            </label>

            <a
              href="#forgot-password"
              className="text-link"
              onClick={handleForgotPassword}
            >
              Forgot password?
            </a>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <span className="btn-loading">
              <span className="spinner" aria-hidden="true" />
              {isLogin ? 'Signing in...' : 'Creating account...'}
            </span>
          ) : isLogin ? (
            'Login'
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="auth-footer">
        {isLogin ? (
          <p>
            Don&apos;t have an account?{' '}
            <a
              href="#register"
              className="text-link strong-link"
              onClick={(e) => {
                e.preventDefault();
                switchMode('register');
              }}
            >
              Register here
            </a>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <a
              href="#login"
              className="text-link strong-link"
              onClick={(e) => {
                e.preventDefault();
                switchMode('login');
              }}
            >
              Sign in
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
