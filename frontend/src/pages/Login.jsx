import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Retrieve the role from the state (fetchProfile updates user context)
      // Since fetchProfile is async, we can do a short delay or fetch current user's role.
      // But wait! AuthContext has user state.
      // To navigate immediately, we read the JWT token role using a basic decode or wait for the user to be updated.
      // A clean way is to wait for AuthContext user to populate.
      // But since we want immediate navigation, we can check the profile route or token data.
      // To be safe, let's fetch /auth/me to verify and route accordingly.
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const u = await res.json();
        if (u.role === 'ROLE_HR') {
          navigate('/hr/dashboard');
        } else {
          navigate('/jobs');
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <LogIn size={24} color="#8b5cf6" />
          </div>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Sign in to your hiring platform account</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={styles.inputPadding}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={styles.inputPadding}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={styles.submitBtn}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Don't have an account? </span>
          <Link to="/register" style={styles.link}>Register here</Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
  },
  card: {
    maxWidth: '420px',
    width: '100%',
    padding: '40px 30px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  iconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
    border: '1px solid rgba(139, 92, 246, 0.2)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#9ca3af',
    pointerEvents: 'none',
  },
  inputPadding: {
    paddingLeft: '40px',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '12px',
    color: '#f87171',
    fontSize: '14px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '14px',
    color: '#9ca3af',
  },
  link: {
    color: '#8b5cf6',
    textDecoration: 'none',
    fontWeight: 500,
  },
};

export default Login;
