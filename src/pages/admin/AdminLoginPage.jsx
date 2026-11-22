import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import toast from 'react-hot-toast';
import './AdminPanel.css';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      const result = await adminLogin(email, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid Admin Credentials.');
        return;
      }
      toast.success('Admin access granted.');
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      console.error('Admin login failed', error);
      setErrorMessage('Unable to complete admin login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <style>{`
        .admin-login-password-field {
          position: relative;
        }
        .admin-login-password-field input {
          padding-right: 44px;
        }
        .admin-login-password-toggle {
          position: absolute;
          top: 50%;
          right: 4px;
          display: grid;
          width: 36px;
          height: 36px;
          place-items: center;
          transform: translateY(-50%);
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #776d67;
          cursor: pointer;
          transition: color 160ms ease, background-color 160ms ease;
        }
        .admin-login-password-toggle:hover {
          background: #f8f3e8;
          color: #3e2723;
        }
        .admin-login-password-toggle:focus-visible {
          outline: 2px solid #f58220;
          outline-offset: 1px;
        }
      `}</style>
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="admin-login-brand">
          <span className="admin-login-logo"><img src="/protinut-logo.png" alt="PROTINUT" /></span>
          <span><small>Restricted admin access</small></span>
        </div>
        <h1 id="admin-login-title">Admin sign in</h1>
        <p>Sign in with your administrator credentials to manage the store.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Admin email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <div className="admin-login-password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="admin-login-password-toggle"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A10.12 10.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14 12a2 2 0 0 1-2.83-2.83" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>
          {errorMessage && <div className="admin-login-error" role="alert">{errorMessage}</div>}
          <button className="admin-login-submit" type="submit" disabled={isLoading}>
            {isLoading ? 'Verifying…' : 'Sign in securely'}
          </button>
        </form>
        <Link className="admin-login-back" to="/">← Back to PROTINUT store</Link>
      </section>
    </main>
  );
};

export default AdminLoginPage;
