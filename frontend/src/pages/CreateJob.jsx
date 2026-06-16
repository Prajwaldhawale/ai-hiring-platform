import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { ArrowLeft, Tag, X, Plus } from 'lucide-react';

const CreateJob = () => {
  const { id } = useParams(); // Presents in edit mode
  const isEditMode = !!id;
  
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Tag lists
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [reqInput, setReqInput] = useState('');
  
  const [preferredSkills, setPreferredSkills] = useState([]);
  const [prefInput, setPrefInput] = useState('');

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      const fetchJobDetails = async () => {
        try {
          const res = await fetch(`${API_BASE}/jobs`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const list = await res.json();
            const found = list.find(j => j.id === id);
            if (found) {
              setTitle(found.title);
              setDescription(found.description);
              setRequiredSkills(found.required_skills || []);
              setPreferredSkills(found.preferred_skills || []);
            } else {
              setError('Job posting not found');
            }
          } else {
            setError('Failed to fetch job data');
          }
        } catch (err) {
          setError('Error loading job details');
        } finally {
          setLoading(false);
        }
      };
      fetchJobDetails();
    }
  }, [id, token, isEditMode]);

  // Skill Add/Delete Handlers
  const handleAddReqSkill = (e) => {
    e.preventDefault();
    if (reqInput.trim() && !requiredSkills.includes(reqInput.trim())) {
      setRequiredSkills([...requiredSkills, reqInput.trim()]);
      setReqInput('');
    }
  };

  const handleRemoveReqSkill = (skill) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skill));
  };

  const handleAddPrefSkill = (e) => {
    e.preventDefault();
    if (prefInput.trim() && !preferredSkills.includes(prefInput.trim())) {
      setPreferredSkills([...preferredSkills, prefInput.trim()]);
      setPrefInput('');
    }
  };

  const handleRemovePrefSkill = (skill) => {
    setPreferredSkills(preferredSkills.filter(s => s !== skill));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (requiredSkills.length === 0) {
      setError('Please add at least one required skill.');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    const payload = {
      title,
      description,
      required_skills: requiredSkills,
      preferred_skills: preferredSkills
    };
    
    try {
      const url = isEditMode ? `${API_BASE}/jobs/${id}` : `${API_BASE}/jobs`;
      const method = isEditMode ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        navigate('/hr/jobs');
      } else {
        setError(data.detail || 'Failed to save job posting.');
      }
    } catch (err) {
      setError('Error connecting to server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      <Link to="/hr/jobs" style={styles.backLink}>
        <ArrowLeft size={16} style={{ marginRight: '6px' }} />
        Back to Job Postings
      </Link>

      <div className="glass-panel" style={styles.formPanel}>
        <h1 style={styles.title}>{isEditMode ? 'Edit Job Posting' : 'Create New Job Posting'}</h1>
        <p style={styles.subtitle}>Define job descriptions and key technologies to score candidates against</p>

        {loading ? (
          <div style={styles.centerText}>Loading job data...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
            {error && <div style={styles.errorAlert}>{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="title">Job Title</label>
              <input
                id="title"
                type="text"
                required
                placeholder="e.g. Senior Backend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Job Description</label>
              <textarea
                id="description"
                required
                rows={6}
                placeholder="Describe key responsibilities, requirements, and day-to-day operations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
                style={{ resize: 'vertical', minHeight: '120px' }}
              />
            </div>

            {/* Required skills tags */}
            <div className="form-group">
              <label className="form-label">Required Skills (evaluated in match score)</label>
              <div style={styles.tagInputRow}>
                <input
                  type="text"
                  placeholder="Type a skill and click Add..."
                  value={reqInput}
                  onChange={(e) => setReqInput(e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddReqSkill(e);
                    }
                  }}
                />
                <button type="button" onClick={handleAddReqSkill} className="btn-secondary" style={styles.addTagBtn}>
                  <Plus size={16} />
                </button>
              </div>
              
              <div style={styles.tagsContainer}>
                {requiredSkills.map(skill => (
                  <span key={skill} style={styles.tagRequired}>
                    {skill}
                    <X size={12} style={styles.removeTagIcon} onClick={() => handleRemoveReqSkill(skill)} />
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred skills tags */}
            <div className="form-group" style={{ marginBottom: '36px' }}>
              <label className="form-label">Preferred Skills (adds bonus matching score)</label>
              <div style={styles.tagInputRow}>
                <input
                  type="text"
                  placeholder="Type a skill and click Add..."
                  value={prefInput}
                  onChange={(e) => setPrefInput(e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPrefSkill(e);
                    }
                  }}
                />
                <button type="button" onClick={handleAddPrefSkill} className="btn-secondary" style={styles.addTagBtn}>
                  <Plus size={16} />
                </button>
              </div>
              
              <div style={styles.tagsContainer}>
                {preferredSkills.map(skill => (
                  <span key={skill} style={styles.tagPreferred}>
                    {skill}
                    <X size={12} style={styles.removeTagIcon} onClick={() => handleRemovePrefSkill(skill)} />
                  </span>
                ))}
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={styles.submitBtn}
              >
                {submitting ? 'Saving Job Posting...' : isEditMode ? 'Save Changes' : 'Publish Job Posting'}
              </button>
              <Link to="/hr/jobs" className="btn-secondary" style={styles.cancelBtn}>
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
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
  formPanel: {
    padding: '40px 30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#fff',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: '14px',
    marginTop: '4px',
  },
  tagInputRow: {
    display: 'flex',
    gap: '10px',
  },
  addTagBtn: {
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '12px',
  },
  tagRequired: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 600,
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    color: '#a78bfa',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  tagPreferred: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 600,
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    color: '#22d3ee',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  removeTagIcon: {
    marginLeft: '6px',
    cursor: 'pointer',
    color: '#9ca3af',
    '&:hover': {
      color: '#fff',
    }
  },
  formActions: {
    display: 'flex',
    gap: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '24px',
  },
  submitBtn: {
    padding: '12px 28px',
    fontSize: '15px',
  },
  cancelBtn: {
    padding: '12px 28px',
    fontSize: '15px',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  centerText: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
  },
};

export default CreateJob;
