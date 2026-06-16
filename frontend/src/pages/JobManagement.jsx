import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Briefcase, Plus, Pencil, Trash, AlertTriangle, Eye } from 'lucide-react';

const JobManagement = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter jobs created by this HR Recruiter
        const filtered = data.filter(job => job.created_by === user.id);
        setJobs(filtered);
      } else {
        setError('Failed to fetch job postings');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [token, user]);

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  const confirmDelete = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setJobs(jobs.filter(j => j.id !== id));
        setDeleteConfirmId(null);
      } else {
        setError('Failed to delete job posting');
      }
    } catch (err) {
      setError('Error deleting job posting');
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Manage Job Postings</h1>
          <p style={styles.subtitle}>Create, edit, and archive job requirements for candidate evaluations</p>
        </div>
        <Link to="/hr/jobs/create" className="btn-primary" style={styles.createBtn}>
          <Plus size={16} style={{ marginRight: '6px' }} />
          Create New Job
        </Link>
      </div>

      {loading && <div style={styles.centerText}>Loading your job postings...</div>}
      {error && <div style={styles.errorAlert}>{error}</div>}

      {!loading && !error && (
        <div style={styles.list}>
          {jobs.length > 0 ? (
            jobs.map(job => (
              <div 
                key={job.id} 
                className="glass-card" 
                style={styles.card}
                onClick={() => navigate(`/hr/jobs/${job.id}/rankings`)}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.jobInfo}>
                    <h3 style={styles.jobTitle}>{job.title}</h3>
                    <p style={styles.metaText}>
                      Required Skills: {job.required_skills?.length || 0} • Preferred Skills: {job.preferred_skills?.length || 0}
                    </p>
                  </div>
                  
                  <div style={styles.actionRow}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/hr/jobs/edit/${job.id}`);
                      }}
                      className="btn-secondary"
                      style={styles.actionBtn}
                      title="Edit Job"
                    >
                      <Pencil size={14} />
                    </button>
                    
                    {deleteConfirmId === job.id ? (
                      <div style={styles.confirmGroup}>
                        <button 
                          onClick={(e) => confirmDelete(e, job.id)}
                          style={styles.deleteConfirmBtn}
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={cancelDelete}
                          style={styles.deleteCancelBtn}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => handleDeleteClick(e, job.id)}
                        style={styles.deleteBtn}
                        title="Delete Job"
                      >
                        <Trash size={14} />
                      </button>
                    )}

                    <button 
                      onClick={() => navigate(`/hr/jobs/${job.id}/rankings`)}
                      className="btn-primary"
                      style={styles.viewBtn}
                    >
                      <Eye size={14} style={{ marginRight: '6px' }} />
                      Applicants
                    </button>
                  </div>
                </div>

                <p style={styles.description}>
                  {job.description.length > 200 
                    ? `${job.description.substring(0, 200)}...` 
                    : job.description}
                </p>

                {/* Display Skills */}
                <div style={styles.skillsSummary}>
                  {job.required_skills?.slice(0, 5).map((skill, i) => (
                    <span key={i} style={styles.skillTag}>
                      {skill}
                    </span>
                  ))}
                  {job.required_skills?.length > 5 && (
                    <span style={styles.moreSkills}>+{job.required_skills.length - 5} more</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={styles.emptyState} className="glass-panel">
              <Briefcase size={36} color="#9ca3af" style={{ marginBottom: '12px' }} />
              <h4>No job postings found.</h4>
              <p style={{ color: '#9ca3af', marginTop: '6px', fontSize: '13px' }}>
                You haven't posted any jobs yet. Click the button above to create your first vacancy.
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
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
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
  createBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  card: {
    cursor: 'pointer',
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
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
  metaText: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '4px',
  },
  actionRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  actionBtn: {
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtn: {
    padding: '8px 14px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
  },
  deleteBtn: {
    background: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    borderRadius: '8px',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  confirmGroup: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  deleteConfirmBtn: {
    background: '#ef4444',
    border: 'none',
    color: '#fff',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteCancelBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#d1d5db',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  description: {
    fontSize: '14px',
    color: '#d1d5db',
    lineHeight: 1.6,
    marginBottom: '16px',
  },
  skillsSummary: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'center',
  },
  skillTag: {
    fontSize: '11px',
    fontWeight: 600,
    background: 'rgba(139, 92, 246, 0.08)',
    border: '1px solid rgba(139, 92, 246, 0.15)',
    color: '#a78bfa',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  moreSkills: {
    fontSize: '11px',
    color: '#9ca3af',
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

export default JobManagement;
