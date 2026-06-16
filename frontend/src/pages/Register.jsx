import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, ShieldCheck, Briefcase } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ROLE_CANDIDATE'); // Default role
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password, role);
      if (role === 'ROLE_HR') {
        navigate('/hr/dashboard');
      } else {
        navigate('/jobs');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <UserPlus size={24} color="#8b5cf6" />
          </div>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Get started with your smart hiring portal</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                id="name"
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                style={styles.inputPadding}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                required
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={styles.inputPadding}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                required
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={styles.inputPadding}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Register As</label>
            <div style={styles.roleSelector}>
              <button
                type="button"
                onClick={() => setRole('ROLE_CANDIDATE')}
                style={{
                  ...styles.roleBtn,
                  ...(role === 'ROLE_CANDIDATE' ? styles.roleBtnActiveCand : {})
                }}
              >
                <Briefcase size={16} style={{ marginRight: '6px' }} />
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole('ROLE_HR')}
                style={{
                  ...styles.roleBtn,
                  ...(role === 'ROLE_HR' ? styles.roleBtnActiveHr : {})
                }}
              >
                <ShieldCheck size={16} style={{ marginRight: '6px' }} />
                Recruiter (HR)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={styles.submitBtn}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Already have an account? </span>
          <Link to="/login" style={styles.link}>Login here</Link>
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
    padding: '60px 24px',
  },
  card: {
    maxWidth: '450px',
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
  roleSelector: {
    display: 'flex',
    gap: '12px',
  },
  roleBtn: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#9ca3af',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 500,
  },
  roleBtnActiveCand: {
    background: 'rgba(6, 182, 212, 0.1)',
    borderColor: '#06b6d4',
    color: '#22d3ee',
  },
  roleBtnActiveHr: {
    background: 'rgba(236, 72, 153, 0.1)',
    borderColor: '#ec4899',
    color: '#f472b6',
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

export default Register;
