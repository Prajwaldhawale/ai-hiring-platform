import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { BarChart3, HelpCircle, AlertTriangle, Sparkles, Award } from 'lucide-react';

const Analytics = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_BASE}/analytics/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setError('Failed to fetch analytics data');
        }
      } catch (err) {
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token]);

  const COLORS = {
    'APPLIED': '#3b82f6',
    'SCREENED': '#8b5cf6',
    'INTERVIEW_SCHEDULED': '#eab308',
    'INTERVIEWED': '#10b981',
    'SELECTED': '#06b6d4',
    'REJECTED': '#ef4444'
  };

  const formatFunnelData = (funnel) => {
    if (!funnel) return [];
    return funnel.map(item => ({
      name: item.stage.replace('_', ' '),
      count: item.count,
      fill: COLORS[item.stage] || '#3b82f6'
    }));
  };

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={styles.chartTooltip}>
          <p style={{ fontWeight: 600 }}>{data.name}</p>
          <p style={{ color: data.fill, marginTop: '4px' }}>
            Candidates: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <BarChart3 size={32} color="#8b5cf6" />
        <div style={{ marginLeft: '12px' }}>
          <h1 style={styles.title}>Hiring Funnel Analytics</h1>
          <p style={styles.subtitle}>Aggregate performance metrics, candidate conversion flow, and matching statistics</p>
        </div>
      </div>

      {loading && <div style={styles.centerText}>Computing analytics dashboard...</div>}
      {error && <div style={styles.errorAlert}>{error}</div>}

      {!loading && stats && (
        <>
          {/* Top Metrics Cards */}
          <div style={styles.metricsGrid}>
            <div className="glass-panel" style={styles.metricCard}>
              <span style={styles.metricLabel}>Conversion Rate</span>
              <h2 style={styles.metricVal}>{stats.conversion_rate}%</h2>
              <span style={styles.metricHint}>Selection to applicant ratio</span>
            </div>
            
            <div className="glass-panel" style={styles.metricCard}>
              <span style={styles.metricLabel}>Average Match Score</span>
              <h2 style={{ ...styles.metricVal, color: '#06b6d4' }}>{stats.average_score}%</h2>
              <span style={styles.metricHint}>Active candidate skill alignment</span>
            </div>

            <div className="glass-panel" style={styles.metricCard}>
              <span style={styles.metricLabel}>Hiring Funnel Volume</span>
              <h2 style={{ ...styles.metricVal, color: '#8b5cf6' }}>{stats.total_applications}</h2>
              <span style={styles.metricHint}>Active applicants processed</span>
            </div>
          </div>

          <div style={styles.chartSection} className="glass-panel">
            <h3 style={styles.chartTitle}>Overall Application Pipeline Stages</h3>
            <div style={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={formatFunnelData(stats.funnel)}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {formatFunnelData(stats.funnel).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Job-by-Job Funnels */}
          <div style={styles.jobFunnelsSection}>
            <h2 style={styles.sectionTitle}>Active Vacancy Funnels</h2>
            <div style={styles.jobFunnelsGrid}>
              {stats.job_funnels?.length > 0 ? (
                stats.job_funnels.map(jobFunnel => (
                  <div key={jobFunnel.job_id} className="glass-panel" style={styles.jobFunnelCard}>
                    <h4 style={styles.jobTitle}>{jobFunnel.job_title}</h4>
                    <div style={styles.funnelSteps}>
                      {jobFunnel.stages.map((st, i) => {
                        const maxVal = Math.max(...jobFunnel.stages.map(s => s.count)) || 1;
                        const fillPercent = (st.count / maxVal) * 100;
                        const barColor = COLORS[st.stage] || '#3b82f6';
                        
                        return (
                          <div key={i} style={styles.funnelRow}>
                            <span style={styles.funnelStepName}>{st.stage.replace('_', ' ')}</span>
                            <div style={styles.funnelTrack}>
                              <div style={{
                                ...styles.funnelBar,
                                width: `${fillPercent}%`,
                                background: barColor
                              }} />
                            </div>
                            <span style={styles.funnelStepVal}>{st.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState} className="glass-panel">
                  <AlertTriangle size={36} color="#9ca3af" style={{ marginBottom: '12px' }} />
                  <h4>No active vacancy statistics yet.</h4>
                </div>
              )}
            </div>
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  metricCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  metricVal: {
    fontSize: '38px',
    fontWeight: 800,
    color: '#34d399',
    margin: '8px 0',
  },
  metricHint: {
    fontSize: '12px',
    color: '#6b7280',
  },
  chartSection: {
    padding: '30px',
    marginBottom: '40px',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '24px',
  },
  chartWrapper: {
    width: '100%',
    height: '300px',
  },
  chartTooltip: {
    background: 'rgba(16, 18, 27, 0.9)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '12px 16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
    fontSize: '13px',
    color: '#fff',
  },
  jobFunnelsSection: {
    marginTop: '20px',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: 700,
    marginBottom: '24px',
    color: '#fff',
  },
  jobFunnelsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  jobFunnelCard: {
    padding: '24px',
  },
  jobTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '18px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '10px',
  },
  funnelSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  funnelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  funnelStepName: {
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: 500,
    width: '120px',
    textTransform: 'uppercase',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  funnelTrack: {
    flex: 1,
    height: '8px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  funnelBar: {
    height: '100%',
    borderRadius: '4px',
  },
  funnelStepVal: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    width: '24px',
    textAlign: 'right',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
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

export default Analytics;
