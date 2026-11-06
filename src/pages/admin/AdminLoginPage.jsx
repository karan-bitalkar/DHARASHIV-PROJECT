import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import toast from 'react-hot-toast';
import './AdminPanel.css';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
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
