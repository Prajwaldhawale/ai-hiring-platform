import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  LayoutDashboard, 
  BarChart3, 
  FolderGit2, 
  UserCircle, 
  LogOut, 
  LogIn, 
  UserPlus,
  Cpu
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContainer}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <Cpu size={24} style={styles.logoIcon} />
          <span style={styles.logoText}>Antigravity Hiring</span>
        </Link>

        {/* Links */}
        <div style={styles.navLinks}>
          {user ? (
            user.role === 'ROLE_HR' ? (
              <>
                <Link to="/hr/dashboard" style={isActive('/hr/dashboard') ? styles.activeLink : styles.link}>
                  <LayoutDashboard size={18} style={styles.icon} />
                  Dashboard
                </Link>
                <Link to="/hr/jobs" style={isActive('/hr/jobs') ? styles.activeLink : styles.link}>
                  <Briefcase size={18} style={styles.icon} />
                  Job Postings
                </Link>
                <Link to="/hr/analytics" style={isActive('/hr/analytics') ? styles.activeLink : styles.link}>
                  <BarChart3 size={18} style={styles.icon} />
                  Analytics
                </Link>
              </>
            ) : (
              <>
                <Link to="/jobs" style={isActive('/jobs') ? styles.activeLink : styles.link}>
                  <Briefcase size={18} style={styles.icon} />
                  Browse Jobs
                </Link>
                <Link to="/applications" style={isActive('/applications') ? styles.activeLink : styles.link}>
                  <FolderGit2 size={18} style={styles.icon} />
                  Applications
                </Link>
                <Link to="/profile" style={isActive('/profile') ? styles.activeLink : styles.link}>
                  <UserCircle size={18} style={styles.icon} />
                  Profile
                </Link>
              </>
            )
          ) : (
            <Link to="/" style={isActive('/') ? styles.activeLink : styles.link}>Home</Link>
          )}
        </div>

        {/* User profile controls */}
        <div style={styles.navActions}>
          {user ? (
            <div style={styles.userSection}>
              <div style={styles.userInfo}>
                <span style={styles.userName}>{user.name}</span>
                <span style={user.role === 'ROLE_HR' ? styles.badgeHr : styles.badgeCand}>
                  {user.role === 'ROLE_HR' ? 'Recruiter' : 'Candidate'}
                </span>
              </div>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={styles.authButtons}>
              <Link to="/login" style={styles.loginBtn}>
                <LogIn size={16} style={{ marginRight: '6px' }} />
                Login
              </Link>
              <Link to="/register" style={styles.registerBtn}>
                <UserPlus size={16} style={{ marginRight: '6px' }} />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(10, 11, 16, 0.7)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '0 24px',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
  },
  navContainer: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: '#fff',
    fontWeight: 700,
    fontSize: '20px',
    letterSpacing: '-0.02em',
  },
  logoIcon: {
    color: '#8b5cf6',
    marginRight: '8px',
  },
  logoText: {
    background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  navLinks: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: '#9ca3af',
    fontSize: '15px',
    fontWeight: 500,
    transition: 'color 0.2s',
  },
  activeLink: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: '#8b5cf6',
    fontSize: '15px',
    fontWeight: 600,
  },
  icon: {
    marginRight: '6px',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
  },
  badgeHr: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#ec4899',
    background: 'rgba(236, 72, 153, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    marginTop: '2px',
    textTransform: 'uppercase',
  },
  badgeCand: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#06b6d4',
    background: 'rgba(6, 182, 212, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    marginTop: '2px',
    textTransform: 'uppercase',
  },
  logoutBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    borderRadius: '8px',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtons: {
    display: 'flex',
    gap: '12px',
  },
  loginBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.02)',
    transition: 'background 0.2s',
  },
  registerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
  },
};

export default Navbar;
