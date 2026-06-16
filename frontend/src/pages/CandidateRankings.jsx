import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { ArrowLeft, Award, Sparkles, AlertCircle, FileText, CheckCircle } from 'lucide-react';

const CandidateRankings = () => {
  const { id } = useParams(); // Job ID
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        // Fetch job description
        const jobRes = await fetch(`${API_BASE}/jobs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (jobRes.ok) {
          const list = await jobRes.json();
          const found = list.find(j => j.id === id);
          if (found) {
            setJob(found);
          }
        }

        // Fetch all applications
        const appsRes = await fetch(`${API_BASE}/applications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (appsRes.ok) {
          const allApps = await appsRes.json();
          // Filter by job ID and order by score DESC
          const filtered = allApps
            .filter(app => app.job_id === id)
            .sort((a, b) => (b.score || 0) - (a.score || 0));
          setApplicants(filtered);
        } else {
          setError('Failed to fetch applicant data');
        }
      } catch (err) {
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [id, token]);

  const getStatusBadge = (status) => {
    const classMap = {
      'APPLIED': 'badge-applied',
      'SCREENED': 'badge-screened',
      'INTERVIEW_SCHEDULED': 'badge-interview_scheduled',
      'INTERVIEWED': 'badge-interviewed',
      'SELECTED': 'badge-selected',
      'REJECTED': 'badge-rejected'
    };
    return classMap[status] || 'badge-applied';
  };

  return (
    <div style={styles.container} className="fade-in">
      <Link to="/hr/jobs" style={styles.backLink}>
        <ArrowLeft size={16} style={{ marginRight: '6px' }} />
        Back to Job Postings
      </Link>

      {loading && <div style={styles.centerText}>Loading rankings data...</div>}
      {error && <div style={styles.errorAlert}>{error}</div>}

      {!loading && job && (
        <>
          <div style={styles.header}>
            <div style={styles.headerIcon}>
              <Award size={28} color="#06b6d4" />
            </div>
            <div>
              <h1 style={styles.title}>Candidate Rankings: {job.title}</h1>
              <p style={styles.subtitle}>Applicants ordered by overlap matching score against required/preferred skills</p>
            </div>
          </div>

          <div style={styles.content}>
            {applicants.length > 0 ? (
              <div style={styles.rankList}>
                {applicants.map((app, index) => {
                  const scoreColor = app.score >= 80 ? '#22d3ee' : app.score >= 50 ? '#facc15' : '#f87171';
                  
                  // Compute matched skills
                  const jobSkills = (job.required_skills || []).map(s => s.toLowerCase());
                  const candSkills = app.candidate.skills || [];
                  const matched = candSkills.filter(s => jobSkills.includes(s.toLowerCase()));

                  return (
                    <div key={app.id} className="glass-panel" style={styles.rankCard}>
                      <div style={styles.rankBadge}>#{index + 1}</div>
                      
                      <div style={styles.cardMain}>
                        <div style={styles.profileCol}>
                          <div style={styles.avatar}>
                            {app.candidate.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 style={styles.candName}>{app.candidate.user.name}</h3>
                            <p style={styles.candEmail}>{app.candidate.user.email}</p>
                          </div>
                        </div>

                        {/* Match score bar */}
                        <div style={styles.scoreCol}>
                          <div style={styles.scoreHeader}>
                            <span style={styles.scoreLabel}>Match Score</span>
                            <span style={{ ...styles.scoreValue, color: scoreColor }}>{app.score !== null ? `${app.score}%` : 'Pending'}</span>
                          </div>
                          <div style={styles.progressBg}>
                            <div style={{
                              ...styles.progressFill,
                              width: `${app.score || 0}%`,
                              background: scoreColor
                            }} />
                          </div>
                        </div>

                        <div style={styles.statusCol}>
                          <span className={`badge ${getStatusBadge(app.status)}`} style={{ alignSelf: 'center' }}>
                            {app.status}
                          </span>
                        </div>

                        <div style={styles.actionsCol}>
                          {app.evaluation ? (
                            <button 
                              onClick={() => navigate(`/hr/applications/${app.id}/evaluation`)}
                              className="btn-primary"
                              style={styles.actionBtn}
                            >
                              <Sparkles size={14} style={{ marginRight: '6px' }} />
                              View AI Evaluation
                            </button>
                          ) : (
                            <button 
                              disabled
                              className="btn-primary"
                              style={{ ...styles.actionBtn, opacity: 0.3, cursor: 'not-allowed' }}
                            >
                              Evaluation Processing
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Matching Skills Overlap summary */}
                      <div style={styles.skillsSummary}>
                        <span style={styles.summaryLabel}>Matched Skills ({matched.length}):</span>
                        <div style={styles.skillsRow}>
                          {matched.map((s, idx) => (
                            <span key={idx} style={styles.skillTagMatched}>
                              <CheckCircle size={10} color="#06b6d4" style={{ marginRight: '4px' }} />
                              {s}
                            </span>
                          ))}
                          {candSkills.filter(s => !jobSkills.includes(s.toLowerCase())).slice(0, 3).map((s, idx) => (
                            <span key={idx} style={styles.skillTagOther}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={styles.emptyState} className="glass-panel">
                <AlertCircle size={40} color="#9ca3af" style={{ marginBottom: '12px' }} />
                <h3>No Applications Yet</h3>
                <p style={{ color: '#9ca3af', marginTop: '6px' }}>
                  No candidates have applied to this job posting yet. Live application lists will appear here.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: '14px',
    marginBottom: '24px',
    fontWeight: 500,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '36px',
  },
  headerIcon: {
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#fff',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: '14px',
    marginTop: '2px',
  },
  rankList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rankCard: {
    position: 'relative',
    padding: '24px 28px',
  },
  rankBadge: {
    position: 'absolute',
    top: '-10px',
    left: '-10px',
    background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '14px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
  },
  cardMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  },
  profileCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '220px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
  },
  candName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
  },
  candEmail: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  scoreCol: {
    flex: 1,
    minWidth: '160px',
  },
  scoreHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    marginBottom: '6px',
  },
  scoreLabel: {
    color: '#9ca3af',
    fontWeight: 500,
  },
  scoreValue: {
    fontWeight: 700,
  },
  progressBg: {
    height: '6px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
  },
  statusCol: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '100px',
  },
  actionsCol: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: '180px',
  },
  actionBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  skillsSummary: {
    marginTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    fontWeight: 600,
  },
  skillsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  skillTagMatched: {
    fontSize: '10px',
    fontWeight: 600,
    background: 'rgba(6, 182, 212, 0.08)',
    border: '1px solid rgba(6, 182, 212, 0.15)',
    color: '#22d3ee',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    display: 'inline-flex',
    alignItems: 'center',
  },
  skillTagOther: {
    fontSize: '10px',
    fontWeight: 500,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#9ca3af',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  centerText: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
  },
};

export default CandidateRankings;
