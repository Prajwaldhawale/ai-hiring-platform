import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { LayoutDashboard, Award, Users, FileCheck, Sparkles, MessageCircle, AlertTriangle } from 'lucide-react';

const HRDashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Real-time notification toast
  const [toasts, setToasts] = useState([]);

  const addToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  const fetchData = async () => {
    try {
      // Fetch applications
      const appRes = await fetch(`${API_BASE}/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const apps = await appRes.json();
      if (appRes.ok) {
        setApplications(apps);
      }

      // Fetch analytics summary
      const statsRes = await fetch(`${API_BASE}/analytics/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const analyticsData = await statsRes.json();
      if (statsRes.ok) {
        setStats(analyticsData);
      }
    } catch (err) {
      console.error(err);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Establish WebSocket Connection for Real-Time updates
    const wsUrl = API_BASE.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected to HR Dashboard.");
      ws.send("HR Recruiter connected");
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("WebSocket received event:", payload);
        
        if (payload.event === 'candidate_evaluated') {
          // Trigger notification
          addToast(`Sparkles: Candidate evaluated! Score: ${payload.data.score}%`);
          // Reload dashboard content
          fetchData();
        } else if (payload.event === 'application_status_updated') {
          addToast(`Status: Application of ${payload.data.candidate_name} progressed to ${payload.data.status}`);
          fetchData();
        }
      } catch (err) {
        console.error("Error parsing websocket content", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket encountered error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected.");
    };

    return () => {
      ws.close();
    };
  }, [token]);

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
      {/* Toast Notifications */}
      <div style={styles.toastContainer}>
        {toasts.map(toast => (
          <div key={toast.id} style={styles.toast} className="fade-in">
            <Sparkles size={18} color="#06b6d4" style={{ marginRight: '10px' }} />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div style={styles.header}>
        <LayoutDashboard size={32} color="#8b5cf6" />
        <div style={{ marginLeft: '12px' }}>
          <h1 style={styles.title}>Recruiter Dashboard</h1>
          <p style={styles.subtitle}>Review applicant queues, monitor match alignment, and inspect AI evaluations</p>
        </div>
      </div>

      {loading && <div style={styles.centerText}>Loading dashboard analytics...</div>}
      {error && <div style={styles.errorAlert}>{error}</div>}

      {!loading && !error && (
        <>
          {/* Stats summary rows */}
          {stats && (
            <div className="grid-cols-3" style={{ marginBottom: '40px' }}>
              <div className="glass-panel" style={styles.statCard}>
                <div style={{ ...styles.statIconCircle, background: 'rgba(139, 92, 246, 0.1)' }}>
                  <Users size={20} color="#8b5cf6" />
                </div>
                <div>
                  <h4 style={styles.statNum}>{stats.total_applications}</h4>
                  <p style={styles.statLabel}>Total Applicants</p>
                </div>
              </div>

              <div className="glass-panel" style={styles.statCard}>
                <div style={{ ...styles.statIconCircle, background: 'rgba(6, 182, 212, 0.1)' }}>
                  <Award size={20} color="#06b6d4" />
                </div>
                <div>
                  <h4 style={styles.statNum}>{stats.average_score}%</h4>
                  <p style={styles.statLabel}>Avg Match Score</p>
                </div>
              </div>

              <div className="glass-panel" style={styles.statCard}>
                <div style={{ ...styles.statIconCircle, background: 'rgba(236, 72, 153, 0.1)' }}>
                  <FileCheck size={20} color="#ec4899" />
                </div>
                <div>
                  <h4 style={styles.statNum}>{stats.conversion_rate}%</h4>
                  <p style={styles.statLabel}>Selection Rate</p>
                </div>
              </div>
            </div>
          )}

          {/* Applications list table */}
          <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
            <div style={styles.tableHeader}>
              <h3 style={styles.tableTitle}>Recent Applicant Activities</h3>
            </div>
            
            {applications.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeadRow}>
                      <th style={styles.th}>Candidate</th>
                      <th style={styles.th}>Job Applied For</th>
                      <th style={styles.th}>Match Score</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app.id} style={styles.tableBodyRow}>
                        <td style={styles.td}>
                          <div style={styles.candProfile}>
                            <div style={styles.candAvatar}>
                              {app.candidate.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={styles.candName}>{app.candidate.user.name}</div>
                              <div style={styles.candEmail}>{app.candidate.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.jobTitleCell}>{app.job.title}</div>
                        </td>
                        <td style={styles.td}>
                          {app.score !== null ? (
                            <span style={{
                              ...styles.scoreBadge,
                              color: app.score >= 80 ? '#22d3ee' : app.score >= 50 ? '#facc15' : '#f87171',
                              background: app.score >= 80 ? 'rgba(6, 182, 212, 0.08)' : app.score >= 50 ? 'rgba(234, 179, 8, 0.08)' : 'rgba(239, 68, 68, 0.08)'
                            }}>
                              {app.score}% Match
                            </span>
                          ) : (
                            <span style={styles.scorePending}>Parsing...</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span className={`badge ${getStatusBadge(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionBtnGroup}>
                            <button 
                              onClick={() => navigate(`/hr/jobs/${app.job_id}/rankings`)}
                              className="btn-secondary"
                              style={styles.actionBtn}
                            >
                              Rankings
                            </button>
                            {app.evaluation ? (
                              <button 
                                onClick={() => navigate(`/hr/applications/${app.id}/evaluation`)}
                                className="btn-primary"
                                style={styles.evalBtn}
                              >
                                View AI
                              </button>
                            ) : (
                              <button 
                                disabled
                                className="btn-primary"
                                style={{ ...styles.evalBtn, opacity: 0.3, cursor: 'not-allowed' }}
                              >
                                Pending
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={styles.emptyState}>
                <AlertTriangle size={36} color="#9ca3af" style={{ marginBottom: '12px' }} />
                <h4>No applications received yet.</h4>
                <p style={{ color: '#9ca3af', marginTop: '6px', fontSize: '13px' }}>
                  When candidates apply to your job postings, their parsed records will show here.
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
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
    position: 'relative',
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
  statCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px 24px',
    gap: '20px',
  },
  statIconCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  statNum: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    textTransform: 'uppercase',
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
  tableHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  tableTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeadRow: {
    background: 'rgba(255, 255, 255, 0.01)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  th: {
    padding: '16px 24px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  tableBodyRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'background 0.2s',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.02)',
    }
  },
  td: {
    padding: '18px 24px',
    fontSize: '14px',
    verticalAlign: 'middle',
  },
  candProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  candAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  candName: {
    fontWeight: 600,
    color: '#fff',
  },
  candEmail: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  jobTitleCell: {
    color: '#d1d5db',
    fontWeight: 500,
  },
  scoreBadge: {
    fontSize: '12px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid transparent',
  },
  scorePending: {
    color: '#a78bfa',
    fontSize: '12px',
    fontWeight: 500,
  },
  actionBtnGroup: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    padding: '6px 12px',
    fontSize: '12px',
  },
  evalBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
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
  toastContainer: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 1000,
    maxWidth: '360px',
  },
  toast: {
    background: 'rgba(16, 18, 27, 0.85)',
    backdropFilter: 'blur(16px)',
    border: '1px solid #06b6d4',
    borderRadius: '12px',
    padding: '16px 20px',
    color: '#fff',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(6, 182, 212, 0.25)',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: 500,
  },
};

export default HRDashboard;
