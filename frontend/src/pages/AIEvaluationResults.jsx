import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { ArrowLeft, Sparkles, Award, CheckCircle, HelpCircle, XCircle, AlertTriangle, FileText, Send, User } from 'lucide-react';

const AIEvaluationResults = () => {
  const { id } = useParams(); // Application ID
  const { token } = useAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      // Fetch application details to get candidate info
      const appsRes = await fetch(`${API_BASE}/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!appsRes.ok) throw new Error("Failed to load application profile");
      
      const apps = await appsRes.json();
      const foundApp = apps.find(a => a.id === id);
      if (!foundApp) throw new Error("Application not found");
      setApplication(foundApp);

      // Fetch AI evaluation details
      const evalRes = await fetch(`${API_BASE}/applications/${id}/evaluation`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (evalRes.ok) {
        const evalData = await evalRes.json();
        setEvaluation(evalData);
      } else {
        setError('AI Evaluation has not finished processing yet.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, token]);

  const updateStatus = async (newStatus) => {
    setStatusUpdating(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const res = await fetch(`${API_BASE}/applications/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await res.json();
      if (res.ok) {
        setApplication(prev => ({ ...prev, status: newStatus }));
        setSuccessMsg(`Status updated successfully to ${newStatus}`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.detail || 'Failed to update candidate status');
      }
    } catch (err) {
      setError('Network error updating status');
    } finally {
      setStatusUpdating(false);
    }
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

  return (
    <div style={styles.container} className="fade-in">
      <button onClick={() => navigate(-1)} style={styles.backLinkBtn}>
        <ArrowLeft size={16} style={{ marginRight: '6px' }} />
        Back to Candidate List
      </button>

      {loading && <div style={styles.centerText}>Loading detailed AI evaluation...</div>}
      {error && <div style={styles.errorAlert}>{error}</div>}

      {!loading && application && evaluation && (
        <div style={styles.layout}>
          {/* Main Assessment Info */}
          <div style={styles.mainCol}>
            {/* Header info card */}
            <div className="glass-panel" style={styles.profileHeaderCard}>
              <div style={styles.profileMeta}>
                <div style={styles.avatar}>
                  {application.candidate.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 style={styles.candidateName}>{application.candidate.user.name}</h1>
                  <p style={styles.candidateEmail}>{application.candidate.user.email}</p>
                </div>
              </div>
              
              <div style={styles.metaRow}>
                <div style={styles.metaLabelVal}>
                  <span style={styles.metaLabel}>Applying For:</span>
                  <span style={styles.metaVal}>{application.job.title}</span>
                </div>
                <div style={styles.metaDivider} />
                <div style={styles.metaLabelVal}>
                  <span style={styles.metaLabel}>Match Score:</span>
                  <span style={{
                    ...styles.metaValScore,
                    color: application.score >= 80 ? '#22d3ee' : application.score >= 50 ? '#facc15' : '#f87171'
                  }}>
                    {application.score}% Match
                  </span>
                </div>
              </div>

              {application.candidate.resume_url && (
                <div style={{ marginTop: '20px' }}>
                  <a 
                    href={`${API_BASE}${application.candidate.resume_url}`}
                    target="_blank" 
                    rel="noreferrer" 
                    style={styles.resumeLink}
                  >
                    <FileText size={14} style={{ marginRight: '6px' }} />
                    View Original Resume Document
                  </a>
                </div>
              )}
            </div>

            {/* AI evaluation components */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
              {/* Strengths */}
              <div className="glass-panel" style={styles.strengthsPanel}>
                <h3 style={styles.panelTitle}>
                  <CheckCircle size={18} color="#34d399" style={{ marginRight: '8px' }} />
                  Key Strengths
                </h3>
                <ul style={styles.list}>
                  {evaluation.strengths?.map((str, i) => (
                    <li key={i} style={styles.listItem}>
                      <span style={styles.bulletGreen}>•</span>
                      {str}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="glass-panel" style={styles.weaknessesPanel}>
                <h3 style={styles.panelTitle}>
                  <XCircle size={18} color="#f87171" style={{ marginRight: '8px' }} />
                  Identified Weaknesses & Gaps
                </h3>
                <ul style={styles.list}>
                  {evaluation.weaknesses?.map((weak, i) => (
                    <li key={i} style={styles.listItem}>
                      <span style={styles.bulletRed}>•</span>
                      {weak}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing Skills tag list */}
              <div className="glass-panel">
                <h3 style={styles.panelTitle}>
                  <AlertTriangle size={18} color="#facc15" style={{ marginRight: '8px' }} />
                  Missing Job Skills
                </h3>
                <div style={styles.tagsRow}>
                  {evaluation.missing_skills?.length > 0 ? (
                    evaluation.missing_skills.map((skill, idx) => (
                      <span key={idx} style={styles.missingTag}>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '14px' }}>Excellent stack alignment. No missing skills!</span>
                  )}
                </div>
              </div>

              {/* Custom interview questions */}
              <div className="glass-panel">
                <h3 style={styles.panelTitle}>
                  <HelpCircle size={18} color="#a78bfa" style={{ marginRight: '8px' }} />
                  Suggested Technical Interview Questions
                </h3>
                <div style={styles.questionList}>
                  {evaluation.interview_questions?.map((q, idx) => (
                    <div key={idx} style={styles.questionCard}>
                      <span style={styles.questionIndex}>Q{idx + 1}</span>
                      <p style={styles.questionText}>{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar pipeline controller */}
          <div style={styles.sidebar}>
            <div className="glass-panel" style={styles.pipelineCard}>
              <h3 style={styles.pipelineTitle}>Pipeline Progression</h3>
              
              <div style={styles.currentStatusWrapper}>
                <span style={styles.statusLabel}>Current Stage</span>
                <span className={`badge ${getStatusBadge(application.status)}`} style={{ marginTop: '4px' }}>
                  {application.status}
                </span>
              </div>

              {successMsg && <div style={styles.successToast}>{successMsg}</div>}

              <div style={styles.pipelineBtnList}>
                <button 
                  onClick={() => updateStatus('SCREENED')}
                  disabled={statusUpdating}
                  style={styles.pipelineBtn}
                >
                  Move to Screened
                </button>
                <button 
                  onClick={() => updateStatus('INTERVIEW_SCHEDULED')}
                  disabled={statusUpdating}
                  style={styles.pipelineBtn}
                >
                  Schedule Interview
                </button>
                <button 
                  onClick={() => updateStatus('INTERVIEWED')}
                  disabled={statusUpdating}
                  style={styles.pipelineBtn}
                >
                  Mark as Interviewed
                </button>
                
                <div style={styles.decisionRow}>
                  <button 
                    onClick={() => updateStatus('SELECTED')}
                    disabled={statusUpdating}
                    style={styles.selectBtn}
                  >
                    Select candidate
                  </button>
                  <button 
                    onClick={() => updateStatus('REJECTED')}
                    disabled={statusUpdating}
                    style={styles.rejectBtn}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
  },
  backLinkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '14px',
    marginBottom: '24px',
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
  },
  layout: {
    display: 'flex',
    gap: '30px',
  },
  mainCol: {
    flex: 2,
  },
  sidebar: {
    flex: 1,
  },
  profileHeaderCard: {
    padding: '30px',
  },
  profileMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
  },
  candidateName: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
  },
  candidateEmail: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  metaRow: {
    display: 'flex',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '20px',
    gap: '40px',
  },
  metaLabelVal: {
    display: 'flex',
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    marginTop: '2px',
  },
  metaValScore: {
    fontSize: '18px',
    fontWeight: 700,
    marginTop: '2px',
  },
  metaDivider: {
    width: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
  },
  resumeLink: {
    color: '#06b6d4',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
  },
  strengthsPanel: {
    borderColor: 'rgba(52, 211, 153, 0.15)',
    background: 'rgba(52, 211, 153, 0.01)',
  },
  weaknessesPanel: {
    borderColor: 'rgba(239, 68, 68, 0.15)',
    background: 'rgba(239, 68, 68, 0.01)',
  },
  list: {
    listStyleType: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  listItem: {
    fontSize: '14px',
    color: '#d1d5db',
    lineHeight: 1.5,
    display: 'flex',
    alignItems: 'flex-start',
  },
  bulletGreen: {
    color: '#34d399',
    fontWeight: 'bold',
    marginRight: '8px',
  },
  bulletRed: {
    color: '#f87171',
    fontWeight: 'bold',
    marginRight: '8px',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  missingTag: {
    fontSize: '11px',
    fontWeight: 600,
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    padding: '3px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  questionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  questionCard: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  questionIndex: {
    background: 'rgba(139, 92, 246, 0.15)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    color: '#c084fc',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
  },
  questionText: {
    fontSize: '14px',
    color: '#d1d5db',
    lineHeight: 1.5,
  },
  pipelineCard: {
    padding: '24px',
    position: 'sticky',
    top: '110px',
  },
  pipelineTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '20px',
  },
  currentStatusWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: '24px',
    background: 'rgba(255,255,255,0.02)',
    padding: '10px 14px',
    borderRadius: '8px',
  },
  statusLabel: {
    fontSize: '11px',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  successToast: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    fontSize: '12px',
    padding: '8px 12px',
    borderRadius: '8px',
    marginBottom: '16px',
    textAlign: 'center',
    fontWeight: 500,
  },
  pipelineBtnList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  pipelineBtn: {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#d1d5db',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '13px',
    fontWeight: 500,
    textAlign: 'left',
    cursor: 'pointer',
    '&:hover': {
      borderColor: '#8b5cf6',
      color: '#fff',
    }
  },
  decisionRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '20px',
  },
  selectBtn: {
    flex: 1.3,
    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    border: 'none',
    color: '#fff',
    borderRadius: '8px',
    padding: '10px 6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  rejectBtn: {
    flex: 0.7,
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    borderRadius: '8px',
    padding: '10px 6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
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
    marginBottom: '20px',
  },
};

export default AIEvaluationResults;
