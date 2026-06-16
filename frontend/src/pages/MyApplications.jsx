import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { FolderGit2, CheckCircle2, Circle, AlertCircle, Sparkles, ChevronDown, ChevronUp, Star, Trash } from 'lucide-react';

const MyApplications = () => {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [withdrawConfirmId, setWithdrawConfirmId] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch(`${API_BASE}/applications/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setApplications(data);
        } else {
          setError('Failed to load applications');
        }
      } catch (err) {
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [token]);

  const handleWithdrawApplication = async (appId) => {
    setWithdrawConfirmId(null);
    try {
      const res = await fetch(`${API_BASE}/applications/${appId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setApplications(prev => prev.filter(app => app.id !== appId));
      } else {
        alert('Failed to withdraw application');
      }
    } catch (err) {
      alert('Error connecting to the server');
    }
  };

  const toggleExpand = (appId) => {
    setExpandedAppId(expandedAppId === appId ? null : appId);
  };

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

  const stages = [
    { label: 'Applied', status: 'APPLIED' },
    { label: 'Screened', status: 'SCREENED' },
    { label: 'Scheduled', status: 'INTERVIEW_SCHEDULED' },
    { label: 'Interviewed', status: 'INTERVIEWED' },
    { label: 'Decision', status: 'SELECTED' } // Selected or Rejected
  ];

  const getStageIndex = (currentStatus) => {
    if (currentStatus === 'REJECTED') return 4;
    return stages.findIndex(s => s.status === currentStatus);
  };

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <FolderGit2 size={32} color="#8b5cf6" />
        <div style={{ marginLeft: '12px' }}>
          <h1 style={styles.title}>My Job Applications</h1>
          <p style={styles.subtitle}>Track your application status and review parsed AI alignment reports</p>
        </div>
      </div>

      {loading && <div style={styles.centerText}>Loading your applications...</div>}
      {error && <div style={styles.errorAlert}>{error}</div>}

      {!loading && !error && (
        <div style={styles.list}>
          {applications.length > 0 ? (
            applications.map(app => {
              const stageIdx = getStageIndex(app.status);
              const isRejected = app.status === 'REJECTED';
              const isExpanded = expandedAppId === app.id;
              
              return (
                <div key={app.id} className="glass-panel" style={styles.appPanel}>
                  {/* Top section: Info, Match Score, Badge */}
                  <div style={styles.panelHeader}>
                    <div style={styles.jobInfo}>
                      <h3 style={styles.jobTitle}>{app.job.title}</h3>
                      <p style={styles.companyName}>Antigravity Tech Ltd</p>
                    </div>

                    <div style={styles.headerRight}>
                      {/* Matching score */}
                      {app.score !== null ? (
                        <div style={styles.scoreWrapper}>
                          <span style={styles.scoreLabel}>Score</span>
                          <span style={{
                            ...styles.scoreValue,
                            color: app.score >= 80 ? '#22d3ee' : app.score >= 50 ? '#facc15' : '#f87171'
                          }}>
                            {app.score}%
                          </span>
                        </div>
                      ) : (
                        <div style={styles.scorePending}>
                          <Sparkles size={14} style={{ marginRight: '4px', animation: 'spin 2s linear infinite' }} />
                          Evaluating
                        </div>
                      )}

                      <span className={`badge ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                      {withdrawConfirmId === app.id ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: '10px' }}>
                          <button 
                            onClick={() => handleWithdrawApplication(app.id)}
                            style={{ ...styles.deleteAppBtn, padding: '4px 8px', fontSize: '11px', background: '#ef4444', color: '#fff', borderColor: '#ef4444' }}
                            title="Confirm Withdraw"
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={() => setWithdrawConfirmId(null)}
                            style={{ ...styles.deleteAppBtn, padding: '4px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.08)', color: '#d1d5db', borderColor: 'rgba(255,255,255,0.15)' }}
                            title="Cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setWithdrawConfirmId(app.id)}
                          style={styles.deleteAppBtn}
                          title="Withdraw Application"
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visual tracking timeline pipeline */}
                  <div style={styles.pipeline}>
                    {stages.map((stage, idx) => {
                      const isCompleted = idx < stageIdx;
                      const isActive = idx === stageIdx;
                      
                      let displayLabel = stage.label;
                      if (idx === 4 && isRejected) {
                        displayLabel = 'Rejected';
                      } else if (idx === 4 && app.status === 'SELECTED') {
                        displayLabel = 'Selected';
                      }

                      return (
                        <React.Fragment key={idx}>
                          {/* Node */}
                          <div style={styles.stageNode}>
                            <div style={{
                              ...styles.nodeCircle,
                              ...(isCompleted ? styles.nodeCompleted : {}),
                              ...(isActive ? (isRejected ? styles.nodeActiveRejected : styles.nodeActive) : {})
                            }}>
                              {isCompleted ? (
                                <CheckCircle2 size={16} />
                              ) : isActive ? (
                                <Star size={12} fill="currentColor" />
                              ) : (
                                <Circle size={12} />
                              )}
                            </div>
                            <span style={{
                              ...styles.nodeLabel,
                              ...(isActive ? styles.nodeLabelActive : {})
                            }}>
                              {displayLabel}
                            </span>
                          </div>

                          {/* Line connectors */}
                          {idx < 4 && (
                            <div style={{
                              ...styles.connector,
                              ...(idx < stageIdx ? styles.connectorCompleted : {})
                            }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Accordion Toggle: AI evaluation details if present */}
                  {app.evaluation && (
                    <div style={styles.accordion}>
                      <button 
                        onClick={() => toggleExpand(app.id)} 
                        style={styles.accordionBtn}
                      >
                        {isExpanded ? (
                          <>
                            Hide AI Evaluation Insights
                            <ChevronUp size={16} style={{ marginLeft: '4px' }} />
                          </>
                        ) : (
                          <>
                            View AI Evaluation Insights
                            <ChevronDown size={16} style={{ marginLeft: '4px' }} />
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div style={styles.accordionContent} className="fade-in">
                          <h4 style={styles.evalHeading}>AI Assessment Summary</h4>
                          <div className="grid-cols-2" style={{ marginTop: '12px' }}>
                            {/* Strengths */}
                            <div style={styles.evalBox}>
                              <h5 style={styles.boxTitleGreen}>Top Strengths</h5>
                              <ul style={styles.boxList}>
                                {app.evaluation.strengths.map((str, i) => (
                                  <li key={i} style={styles.boxItem}>{str}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Missing skills */}
                            <div style={styles.evalBox}>
                              <h5 style={styles.boxTitleOrange}>Development Gaps</h5>
                              <ul style={styles.boxList}>
                                {app.evaluation.missing_skills.length > 0 ? (
                                  app.evaluation.missing_skills.map((sk, i) => (
                                    <li key={i} style={styles.boxItem}>Missing keyword: {sk}</li>
                                  ))
                                ) : (
                                  <li style={styles.boxItem}>Aligned with all requested skills!</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={styles.emptyState} className="glass-panel">
              <AlertCircle size={40} color="#9ca3af" style={{ marginBottom: '12px' }} />
              <h3>No applications found.</h3>
              <p style={{ color: '#9ca3af', marginTop: '6px' }}>
                You haven't applied to any jobs yet. Browse available jobs to start your journey.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '36px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#fff',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: '15px',
    marginTop: '2px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  appPanel: {
    padding: '28px',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
  },
  jobInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  jobTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#fff',
  },
  companyName: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '2px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  scoreWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '4px 10px',
  },
  scoreLabel: {
    fontSize: '10px',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: '16px',
    fontWeight: 700,
  },
  scorePending: {
    fontSize: '13px',
    color: '#a78bfa',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.15)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  },
  pipeline: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px',
    marginBottom: '20px',
  },
  stageNode: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '80px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 2,
  },
  nodeCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--bg-main)',
    border: '2px solid rgba(255, 255, 255, 0.12)',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  nodeCompleted: {
    borderColor: '#8b5cf6',
    background: '#8b5cf6',
    color: '#fff',
  },
  nodeActive: {
    borderColor: '#06b6d4',
    color: '#22d3ee',
    boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
  },
  nodeActiveRejected: {
    borderColor: '#ef4444',
    color: '#f87171',
    boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
  },
  nodeLabel: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '8px',
    fontWeight: 500,
  },
  nodeLabelActive: {
    color: '#fff',
    fontWeight: 600,
  },
  connector: {
    flex: 1,
    height: '2px',
    background: 'rgba(255, 255, 255, 0.08)',
    marginTop: '-20px',
    position: 'relative',
    zIndex: 1,
  },
  connectorCompleted: {
    background: '#8b5cf6',
  },
  accordion: {
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '16px',
    marginTop: '20px',
  },
  accordionBtn: {
    background: 'transparent',
    border: 'none',
    color: '#a78bfa',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  },
  accordionContent: {
    marginTop: '16px',
  },
  evalHeading: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  evalBox: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '16px',
  },
  boxTitleGreen: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#34d399',
    marginBottom: '8px',
  },
  boxTitleOrange: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#facc15',
    marginBottom: '8px',
  },
  boxList: {
    listStyleType: 'disc',
    paddingLeft: '16px',
    fontSize: '13px',
    color: '#d1d5db',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  boxItem: {
    lineHeight: 1.4,
  },
  deleteAppBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '10px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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

export default MyApplications;
