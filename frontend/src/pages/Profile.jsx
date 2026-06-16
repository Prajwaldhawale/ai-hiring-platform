import React, { useEffect, useState, useRef } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { User, Mail, Shield, FileDown, CheckCircle, AlertCircle, Upload, Trash } from 'lucide-react';

const Profile = () => {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upload/Update resume states
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/applications/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setError('');
      } else {
        setProfile(null);
        setError('No resume uploaded yet.');
      }
    } catch (err) {
      setError('Error fetching profile information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Drag & drop handlers
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
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateFile(e.target.files[0]);
    }
  };

  const validateFile = (selectedFile) => {
    setUploadError('');
    const allowedTypes = ['application/pdf', 'text/plain'];
    const maxSizeBytes = 5 * 1024 * 1024;
    
    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.txt')) {
      setUploadError('Invalid format. Use PDF or TXT.');
      setFile(null);
      return;
    }
    if (selectedFile.size > maxSizeBytes) {
      setUploadError('File is too large (max 5MB).');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setSubmitting(true);
    setUploadError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_BASE}/applications/profile/resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setFile(null);
        // Wait a small moment for background parser to run
        setTimeout(fetchProfile, 1000);
      } else {
        const data = await res.json();
        setUploadError(data.detail || 'Upload failed');
      }
    } catch (err) {
      setUploadError('Network error uploading resume.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm("Are you sure you want to delete your resume? This will clear your parsed skills and experience.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/applications/profile/resume`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProfile();
      } else {
        setError('Failed to delete resume');
        setLoading(false);
      }
    } catch (err) {
      setError('Error connecting to the server');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      <h1 style={styles.title}>My Profile</h1>
      <p style={styles.subtitle}>Manage your details and inspect how the system parses your skills and work history</p>

      <div style={styles.layout}>
        {/* User Card */}
        <div style={styles.userCard} className="glass-panel">
          <div style={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <h2 style={styles.userName}>{user?.name}</h2>
          <span style={styles.userRole}>Candidate Account</span>

          <div style={styles.infoList}>
            <div style={styles.infoItem}>
              <Mail size={16} color="#9ca3af" />
              <span style={styles.infoVal}>{user?.email}</span>
            </div>
            <div style={styles.infoItem}>
              <Shield size={16} color="#9ca3af" />
              <span style={styles.infoVal}>JWT Role verified</span>
            </div>
          </div>
        </div>

        {/* Parsed Details */}
        <div style={styles.parsedCol}>
          {loading ? (
            <div className="glass-panel" style={styles.centerText}>Loading profile data...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Resume download and manage */}
              {profile?.resume_url ? (
                <div className="glass-panel" style={styles.downloadCard}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={styles.docIcon}>
                      <FileDown size={20} color="#06b6d4" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Active Resume Document</h4>
                      <p style={{ fontSize: '12px', color: '#9ca3af' }}>Successfully parsed and matched</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a 
                      href={`${API_BASE}${profile.resume_url}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={styles.downloadBtn}
                    >
                      Download
                    </a>
                    <button 
                      onClick={handleDeleteResume}
                      style={styles.deleteBtn}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-panel" style={styles.emptyState}>
                  <AlertCircle size={36} color="#eab308" style={{ marginBottom: '12px' }} />
                  <h3>No Resume Uploaded Yet</h3>
                  <p style={{ color: '#9ca3af', marginTop: '6px', fontSize: '13px' }}>
                    Upload a resume below to parse your skills and experience.
                  </p>
                </div>
              )}

              {/* Upload Zone to Update/Upload Resume */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {profile?.resume_url ? 'Upload New Resume (Override)' : 'Upload Resume'}
                </h4>
                {uploadError && <div style={styles.errorText}><AlertCircle size={14} style={{ marginRight: '6px' }} />{uploadError}</div>}
                
                <form onSubmit={handleUploadSubmit}>
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
                        <span style={styles.fileName}>{file.name}</span>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                          <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                            {submitting ? 'Parsing...' : 'Upload & Parse'}
                          </button>
                          <button type="button" onClick={onButtonClick} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                            Change File
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={styles.dragPrompt} onClick={onButtonClick}>
                        <Upload size={24} color="#9ca3af" style={{ marginBottom: '6px' }} />
                        <span style={{ fontSize: '13px' }}>Drag & drop or click to choose a new PDF/TXT resume</span>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* Parsed skills */}
              {profile && (
                <div className="glass-panel">
                  <h3 style={styles.sectionTitle}>Parsed Tech Stack Skills</h3>
                  <div style={styles.skillsGrid}>
                    {profile.skills && profile.skills.length > 0 ? (
                      profile.skills.map((skill, idx) => (
                        <span key={idx} style={styles.skillTag}>
                          <CheckCircle size={12} color="#06b6d4" style={{ marginRight: '6px' }} />
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af' }}>No skills parsed.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Parsed experience */}
              {profile && (
                <div className="glass-panel">
                  <h3 style={styles.sectionTitle}>Extracted Work Experience</h3>
                  <div style={styles.timeline}>
                    {profile.experience && profile.experience.length > 0 ? (
                      profile.experience.map((exp, idx) => (
                        <div key={idx} style={styles.timelineItem}>
                          <div style={styles.timelineBadge} />
                          <div style={styles.timelineContent}>
                            <div style={styles.timelineHeader}>
                              <h4 style={styles.timelineRole}>{exp.role}</h4>
                              <span style={styles.timelineDuration}>{exp.duration}</span>
                            </div>
                            <h5 style={styles.timelineCompany}>{exp.company}</h5>
                            <p style={styles.timelineDesc}>{exp.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af' }}>No experience blocks parsed.</span>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#fff',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: '15px',
    marginTop: '4px',
    marginBottom: '36px',
  },
  layout: {
    display: 'flex',
    gap: '30px',
  },
  userCard: {
    flex: 1,
    height: 'fit-content',
    textAlign: 'center',
    padding: '30px 20px',
  },
  parsedCol: {
    flex: 2.2,
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
    color: '#fff',
    fontSize: '32px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
  },
  userName: {
    fontSize: '22px',
    fontWeight: 600,
  },
  userRole: {
    fontSize: '12px',
    color: '#9ca3af',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    marginTop: '6px',
    display: 'inline-block',
  },
  infoList: {
    marginTop: '30px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'flex-start',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
  },
  infoVal: {
    color: '#d1d5db',
  },
  downloadCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderColor: 'rgba(6, 182, 212, 0.25)',
    background: 'rgba(6, 182, 212, 0.02)',
  },
  docIcon: {
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    padding: '8px',
    borderRadius: '8px',
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtn: {
    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  deleteBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  },
  dragArea: {
    border: '1px dashed rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    padding: '20px 10px',
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.01)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  dragAreaActive: {
    borderColor: '#06b6d4',
    background: 'rgba(6, 182, 212, 0.04)',
  },
  dragAreaWithFile: {
    borderStyle: 'solid',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  dragPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#9ca3af',
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  fileName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#fff',
  },
  skillsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  skillTag: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '13px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '6px 12px',
    color: '#d1d5db',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    position: 'relative',
    paddingLeft: '20px',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
  },
  timelineItem: {
    position: 'relative',
  },
  timelineBadge: {
    position: 'absolute',
    left: '-26px',
    top: '6px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#8b5cf6',
    border: '2px solid var(--bg-main)',
  },
  timelineContent: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    padding: '16px',
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineRole: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
  },
  timelineDuration: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  timelineCompany: {
    fontSize: '13px',
    color: '#8b5cf6',
    fontWeight: 500,
    marginTop: '2px',
  },
  timelineDesc: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '8px',
    lineHeight: 1.5,
  },
  emptyState: {
    textAlign: 'center',
    padding: '30px 20px',
    border: '1px dashed rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
  centerText: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
  },
  errorText: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
  },
};

export default Profile;
