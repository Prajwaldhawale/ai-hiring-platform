import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';

const JobDetails = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Application checking
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApp, setCheckingApp] = useState(true);
  const [existingAppId, setExistingAppId] = useState(null);
  
  // File Upload
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const list = await res.json();
          const found = list.find(j => j.id === id);
          if (found) {
            setJob(found);
          } else {
            setError('Job posting not found');
          }
        } else {
          setError('Failed to fetch job description');
        }
      } catch (err) {
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    };

    const checkExistingApplication = async () => {
      try {
        const res = await fetch(`${API_BASE}/applications/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const list = await res.json();
          const app = list.find(app => app.job_id === id);
          if (app) {
            setHasApplied(true);
            setExistingAppId(app.id);
          } else {
            setHasApplied(false);
            setExistingAppId(null);
          }
        }
      } catch (err) {
        console.error("Error checking application list", err);
      } finally {
        setCheckingApp(false);
      }
    };

    fetchJobDetails();
    checkExistingApplication();
  }, [id, token]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateFile(e.target.files[0]);
    }
  };

  const validateFile = (selectedFile) => {
    setUploadError('');
    // Allow PDF and Text files
    const allowedTypes = ['application/pdf', 'text/plain'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.txt')) {
      setUploadError('Invalid format. Please upload a PDF or TXT resume.');
      setFile(null);
      return;
    }
    
    if (selectedFile.size > maxSizeBytes) {
      setUploadError('File is too large. Max size allowed is 5MB.');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a resume file to apply.');
      return;
    }
    
    setSubmitting(true);
    setUploadError('');
    
    const formData = new FormData();
    formData.append('job_id', id);
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        navigate('/applications');
      } else {
        setUploadError(data.detail || 'Failed to submit application.');
      }
    } catch (err) {
      setUploadError('Network error submitting application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawApplication = async () => {
    if (!window.confirm("Are you sure you want to withdraw your application? This will permanently delete your previous submission and assessment, allowing you to re-apply with a new resume.")) {
      return;
    }
    setSubmitting(true);
    setUploadError('');
    try {
      const res = await fetch(`${API_BASE}/applications/${existingAppId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setHasApplied(false);
        setExistingAppId(null);
        setFile(null);
      } else {
        setUploadError('Failed to withdraw application.');
      }
    } catch (err) {
      setUploadError('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      <Link to="/jobs" style={styles.backLink}>
        <ArrowLeft size={16} style={{ marginRight: '6px' }} />
        Back to Jobs Feed
      </Link>

      {loading && <div style={styles.centerText}>Loading description details...</div>}
      {error && <div style={styles.errorAlert}>{error}</div>}

      {!loading && job && (
        <div style={styles.layout}>
          {/* Details Column */}
          <div style={styles.detailsCol} className="glass-panel">
            <h1 style={styles.title}>{job.title}</h1>
            <div style={styles.badgeRow}>
              <span style={styles.metaBadge}>Remote</span>
              <span style={styles.metaBadge}>Full-time</span>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionHeading}>Job Description</h3>
              <p style={styles.descriptionText}>{job.description}</p>
            </div>

            {/* Required skills */}
            {job.required_skills && job.required_skills.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionHeading}>Required Skills</h3>
                <div style={styles.skillsList}>
                  {job.required_skills.map((skill, idx) => (
                    <span key={idx} style={styles.skillTagRequired}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred skills */}
            {job.preferred_skills && job.preferred_skills.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionHeading}>Preferred Skills</h3>
                <div style={styles.skillsList}>
                  {job.preferred_skills.map((skill, idx) => (
                    <span key={idx} style={styles.skillTagPreferred}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Column */}
          <div style={styles.actionCol}>
            {checkingApp ? (
              <div className="glass-panel" style={styles.centerText}>Checking application history...</div>
            ) : hasApplied ? (
              <div className="glass-panel" style={styles.appliedStatus}>
                <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: '12px' }} />
                <h3 style={{ marginBottom: '8px' }}>Already Applied</h3>
                <p style={styles.appliedText}>
                  You have already submitted an application for this position. 
                  You can track its status in the applications pipeline.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  <Link to="/applications" className="btn-primary" style={{ ...styles.appliedBtn, textDecoration: 'none', textAlign: 'center' }}>
                    View Applications
                  </Link>
                  <button 
                    onClick={handleWithdrawApplication} 
                    className="btn-secondary" 
                    style={{ width: '100%', padding: '12px' }} 
                    disabled={submitting}
                  >
                    {submitting ? 'Withdrawing...' : 'Withdraw & Re-apply'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel">
                <div style={styles.actionHeader}>
                  <Cpu size={20} color="#8b5cf6" />
                  <h3 style={styles.actionTitle}>Apply with AI Scoring</h3>
                </div>
                <p style={styles.actionDesc}>
                  Upload your resume in PDF or TXT format. Our system will automatically parse your skills, match your alignment percentage, and generate custom AI evaluations.
                </p>

                {uploadError && <div style={styles.errorText}><AlertTriangle size={14} style={{ marginRight: '6px' }} />{uploadError}</div>}

                <form onSubmit={handleApplySubmit}>
                  <div 
                    style={{
                      ...styles.dragArea,
                      ...(isDragActive ? styles.dragAreaActive : {}),
                      ...(file ? styles.dragAreaWithFile : {})
                    }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                      accept=".pdf,.txt"
                    />

                    {file ? (
                      <div style={styles.fileDetails}>
                        <FileText size={36} color="#8b5cf6" style={{ marginBottom: '8px' }} />
                        <span style={styles.fileName}>{file.name}</span>
                        <span style={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
                        <button type="button" onClick={onButtonClick} style={styles.changeFileBtn}>
                          Change File
                        </button>
                      </div>
                    ) : (
                      <div style={styles.dragPrompt}>
                        <Upload size={32} color="#9ca3af" style={{ marginBottom: '8px' }} />
                        <span>Drag & drop resume here</span>
                        <span style={styles.dragOr}>or</span>
                        <button type="button" onClick={onButtonClick} className="btn-secondary" style={styles.browseBtn}>
                          Browse Files
                        </button>
                        <span style={styles.fileHint}>PDF, TXT up to 5MB</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !file}
                    className="btn-primary"
                    style={{
                      ...styles.applySubmitBtn,
                      ...((submitting || !file) ? styles.btnDisabled : {})
                    }}
                  >
                    {submitting ? 'Processing Resume...' : 'Submit Application'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
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
  layout: {
    display: 'flex',
    gap: '30px',
  },
  detailsCol: {
    flex: 2,
    padding: '30px',
  },
  actionCol: {
    flex: 1,
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#fff',
  },
  badgeRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '12px',
    marginBottom: '24px',
  },
  metaBadge: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#d1d5db',
    fontSize: '12px',
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: '6px',
  },
  section: {
    marginBottom: '28px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '20px',
  },
  sectionHeading: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#fff',
  },
  descriptionText: {
    color: '#d1d5db',
    fontSize: '15px',
    lineHeight: 1.7,
    whiteSpace: 'pre-line',
  },
  skillsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  skillTagRequired: {
    fontSize: '12px',
    fontWeight: 600,
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    color: '#a78bfa',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  skillTagPreferred: {
    fontSize: '12px',
    fontWeight: 600,
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    color: '#22d3ee',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  actionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '14px',
  },
  actionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
  },
  actionDesc: {
    fontSize: '13px',
    color: '#9ca3af',
    lineHeight: 1.5,
    marginBottom: '20px',
  },
  dragArea: {
    border: '2px dashed rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    padding: '30px 20px',
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.01)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '20px',
  },
  dragAreaActive: {
    borderColor: '#8b5cf6',
    background: 'rgba(139, 92, 246, 0.04)',
  },
  dragAreaWithFile: {
    borderStyle: 'solid',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    background: 'rgba(139, 92, 246, 0.02)',
  },
  dragPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '14px',
    color: '#9ca3af',
  },
  dragOr: {
    margin: '6px 0',
    fontSize: '12px',
    color: '#6b7280',
  },
  browseBtn: {
    padding: '6px 16px',
    fontSize: '13px',
    marginBottom: '8px',
  },
  fileHint: {
    fontSize: '11px',
    color: '#6b7280',
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  fileName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    maxWidth: '220px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fileSize: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '2px',
  },
  changeFileBtn: {
    marginTop: '12px',
    background: 'transparent',
    border: 'none',
    color: '#8b5cf6',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'underline',
  },
  applySubmitBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#9ca3af',
  },
  errorText: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
  },
  appliedStatus: {
    textAlign: 'center',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  appliedText: {
    color: '#9ca3af',
    fontSize: '13px',
    lineHeight: 1.5,
    marginBottom: '20px',
  },
  appliedBtn: {
    textDecoration: 'none',
    width: '100%',
    textAlign: 'center',
    display: 'block',
  },
  centerText: {
    textAlign: 'center',
    padding: '20px',
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

export default JobDetails;
