import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, Users, Zap, Award, CheckCircle, Briefcase } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  return (
    <div style={styles.container} className="fade-in">
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.glow} />
        <h1 style={styles.title}>
          Elevate Your Hiring with <span style={styles.gradientText}>AI-Powered Events</span>
        </h1>
        <p style={styles.subtitle}>
          Decoupled resume parsing, candidate scoring, and detailed AI evaluations. 
          Built with React, FastAPI, Apache Kafka, and PostgreSQL.
        </p>
        
        <div style={styles.ctaGroup}>
          {user ? (
            user.role === 'ROLE_HR' ? (
              <Link to="/hr/dashboard" className="btn-primary" style={styles.ctaBtn}>
                Go to Recruiter Dashboard
              </Link>
            ) : (
              <Link to="/jobs" className="btn-primary" style={styles.ctaBtn}>
                Browse Open Jobs
              </Link>
            )
          ) : (
            <>
              <Link to="/register" className="btn-primary" style={styles.ctaBtn}>
                Get Started
              </Link>
              <Link to="/login" className="btn-secondary" style={styles.ctaBtnSec}>
                Login to Account
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section style={styles.statsSection} className="glass-panel">
        <div style={styles.statItem}>
          <h3 style={styles.statNum}>10s</h3>
          <p style={styles.statLabel}>Resume Analysis</p>
        </div>
        <div style={styles.divider} />
        <div style={styles.statItem}>
          <h3 style={styles.statNum}>98%</h3>
          <p style={styles.statLabel}>Matching Accuracy</p>
        </div>
        <div style={styles.divider} />
        <div style={styles.statItem}>
          <h3 style={styles.statNum}>100%</h3>
          <p style={styles.statLabel}>Event Driven</p>
        </div>
      </section>

      {/* Features Grid */}
      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Decoupled Architecture Flow</h2>
        <div className="grid-cols-3">
          <div className="glass-card" style={styles.featureCard}>
            <div style={styles.iconWrapper}>
              <Zap size={24} color="#06b6d4" />
            </div>
            <h3 style={styles.cardTitle}>1. Kafka Submission</h3>
            <p style={styles.cardDesc}>
              Candidate uploads resume. FastAPI emits an <code>application-submitted</code> event to Kafka instantly, freeing the API to serve other requests.
            </p>
          </div>

          <div className="glass-card" style={styles.featureCard}>
            <div style={styles.iconWrapper}>
              <Cpu size={24} color="#8b5cf6" />
            </div>
            <h3 style={styles.cardTitle}>2. Deep Extraction</h3>
            <p style={styles.cardDesc}>
              Resume parsing consumer parses PDF details, extracts key tech stack tokens, and emits a <code>resume-parsed</code> event for instant matching.
            </p>
          </div>

          <div className="glass-card" style={styles.featureCard}>
            <div style={styles.iconWrapper}>
              <Award size={24} color="#ec4899" />
            </div>
            <h3 style={styles.cardTitle}>3. AI Evaluation</h3>
            <p style={styles.cardDesc}>
              Gemini AI rates candidate alignment, compiles strengths, weaknesses, skill gaps, and custom technical interview questions.
            </p>
          </div>
        </div>
      </section>

      {/* Roles Split */}
      <section style={styles.rolesSection} className="glass-panel">
        <div style={styles.roleColumn}>
          <div style={styles.roleIconHeader}>
            <Users size={32} color="#ec4899" />
            <h3 style={styles.roleTitle}>For HR Recruiters</h3>
          </div>
          <ul style={styles.list}>
            <li style={styles.listItem}><CheckCircle size={16} color="#ec4899" /> Create and edit job requirements</li>
            <li style={styles.listItem}><CheckCircle size={16} color="#ec4899" /> View candidate match percentages</li>
            <li style={styles.listItem}><CheckCircle size={16} color="#ec4899" /> Deep-dive into AI evaluations</li>
            <li style={styles.listItem}><CheckCircle size={16} color="#ec4899" /> Live status pipelines & analytics</li>
          </ul>
        </div>
        <div style={styles.verticalDivider} />
        <div style={styles.roleColumn}>
          <div style={styles.roleIconHeader}>
            <Briefcase size={32} color="#06b6d4" />
            <h3 style={styles.roleTitle}>For Candidates</h3>
          </div>
          <ul style={styles.list}>
            <li style={styles.listItem}><CheckCircle size={16} color="#06b6d4" /> Browse matching job vacancies</li>
            <li style={styles.listItem}><CheckCircle size={16} color="#06b6d4" /> Fast drag-and-drop resume upload</li>
            <li style={styles.listItem}><CheckCircle size={16} color="#06b6d4" /> Monitor real-time status transitions</li>
            <li style={styles.listItem}><CheckCircle size={16} color="#06b6d4" /> Profile management and skills check</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
  },
  hero: {
    position: 'relative',
    textAlign: 'center',
    padding: '80px 0 60px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
    filter: 'blur(40px)',
    pointerEvents: 'none',
    zIndex: -1,
  },
  title: {
    fontSize: '52px',
    fontWeight: 800,
    lineHeight: 1.15,
    marginBottom: '20px',
    maxWidth: '800px',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '20px',
    color: '#9ca3af',
    maxWidth: '650px',
    marginBottom: '40px',
  },
  ctaGroup: {
    display: 'flex',
    gap: '16px',
  },
  ctaBtn: {
    fontSize: '16px',
    padding: '12px 28px',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  ctaBtnSec: {
    fontSize: '16px',
    padding: '12px 28px',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  statsSection: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    margin: '40px 0 80px 0',
    padding: '30px',
    textAlign: 'center',
  },
  statItem: {
    flex: 1,
  },
  statNum: {
    fontSize: '36px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: '14px',
    marginTop: '4px',
  },
  divider: {
    width: '1px',
    height: '50px',
    background: 'rgba(255, 255, 255, 0.08)',
  },
  featuresSection: {
    marginBottom: '80px',
  },
  sectionTitle: {
    fontSize: '32px',
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: '40px',
  },
  featureCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '24px',
    height: '100%',
  },
  iconWrapper: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '10px',
  },
  cardDesc: {
    color: '#9ca3af',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  rolesSection: {
    display: 'flex',
    gap: '40px',
    padding: '40px',
  },
  roleColumn: {
    flex: 1,
  },
  roleIconHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  roleTitle: {
    fontSize: '22px',
    fontWeight: 600,
  },
  list: {
    listStyleType: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '15px',
    color: '#d1d5db',
  },
  verticalDivider: {
    width: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
  },
};

export default Home;
