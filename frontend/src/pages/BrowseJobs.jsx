import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Search, MapPin, Briefcase, ChevronRight, Tag } from 'lucide-react';

const BrowseJobs = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        } else {
          setError('Failed to fetch job postings');
        }
      } catch (err) {
        setError('Error connecting to the server');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [token]);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Browse Open Career Roles</h1>
          <p style={styles.subtitle}>Find your next opportunity and submit your resume for automated evaluation</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="glass-panel" style={styles.searchBar}>
        <Search size={20} style={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search for job titles, roles, or keyword descriptions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {loading && <div style={styles.loading}>Loading opportunities...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {!loading && !error && (
        <div style={styles.jobList}>
          {filteredJobs.length > 0 ? (
            filteredJobs.map(job => (
              <div 
                key={job.id} 
                className="glass-card" 
                style={styles.jobCard}
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.jobTitle}>{job.title}</h3>
                    <div style={styles.metaRow}>
                      <span style={styles.metaItem}>
                        <Briefcase size={14} style={{ marginRight: '4px' }} />
                        Full Time
                      </span>
                      <span style={styles.metaItem}>
                        <MapPin size={14} style={{ marginRight: '4px' }} />
                        Remote / Hybrid
                      </span>
                    </div>
                  </div>
                  <button style={styles.detailsBtn}>
                    Apply Now
                    <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                  </button>
                </div>

                <p style={styles.description}>
                  {job.description.length > 180 
                    ? `${job.description.substring(0, 180)}...` 
                    : job.description}
                </p>

                {/* Skills tags */}
                {job.required_skills && job.required_skills.length > 0 && (
                  <div style={styles.skillsContainer}>
                    <Tag size={12} color="#8b5cf6" style={{ marginRight: '6px', marginTop: '4px' }} />
                    <div style={styles.skillsList}>
                      {job.required_skills.map((skill, idx) => (
                        <span key={idx} style={styles.skillTag}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={styles.emptyState} className="glass-panel">
              <h3>No jobs found matching your search.</h3>
              <p>Try searching for different keywords or checking back later.</p>
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
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: '15px',
    marginTop: '4px',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    marginBottom: '30px',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  searchIcon: {
    color: '#9ca3af',
    marginRight: '12px',
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
  },
  jobList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  jobCard: {
    cursor: 'pointer',
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '14px',
  },
  jobTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#fff',
  },
  metaRow: {
    display: 'flex',
    gap: '16px',
    marginTop: '6px',
    color: '#9ca3af',
    fontSize: '13px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
  },
  detailsBtn: {
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    color: '#c084fc',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
  },
  description: {
    color: '#d1d5db',
    fontSize: '14px',
    lineHeight: 1.6,
    marginBottom: '20px',
  },
  skillsContainer: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  skillsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  skillTag: {
    fontSize: '11px',
    fontWeight: 600,
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.15)',
    color: '#a78bfa',
    padding: '3px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
  },
};

export default BrowseJobs;
