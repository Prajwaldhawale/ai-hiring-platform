import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Candidate Pages
import BrowseJobs from './pages/BrowseJobs';
import JobDetails from './pages/JobDetails';
import MyApplications from './pages/MyApplications';
import Profile from './pages/Profile';

// HR Recruiter Pages
import HRDashboard from './pages/HRDashboard';
import JobManagement from './pages/JobManagement';
import CreateJob from './pages/CreateJob';
import CandidateRankings from './pages/CandidateRankings';
import AIEvaluationResults from './pages/AIEvaluationResults';
import Analytics from './pages/Analytics';

// Route Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#9ca3af' }}>
        Authenticating session...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect role violations to corresponding dashboards or home
    return user.role === 'ROLE_HR' 
      ? <Navigate to="/hr/dashboard" replace /> 
      : <Navigate to="/jobs" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#9ca3af' }}>
        Loading account portal...
      </div>
    );
  }

  if (token && user) {
    return user.role === 'ROLE_HR' 
      ? <Navigate to="/hr/dashboard" replace /> 
      : <Navigate to="/jobs" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />

        {/* Candidate Protected Routes */}
        <Route path="/jobs" element={
          <ProtectedRoute allowedRoles={['ROLE_CANDIDATE']}>
            <BrowseJobs />
          </ProtectedRoute>
        } />
        
        <Route path="/jobs/:id" element={
          <ProtectedRoute allowedRoles={['ROLE_CANDIDATE']}>
            <JobDetails />
          </ProtectedRoute>
        } />
        
        <Route path="/applications" element={
          <ProtectedRoute allowedRoles={['ROLE_CANDIDATE']}>
            <MyApplications />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['ROLE_CANDIDATE']}>
            <Profile />
          </ProtectedRoute>
        } />

        {/* HR Recruiter Protected Routes */}
        <Route path="/hr/dashboard" element={
          <ProtectedRoute allowedRoles={['ROLE_HR']}>
            <HRDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/hr/jobs" element={
          <ProtectedRoute allowedRoles={['ROLE_HR']}>
            <JobManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/hr/jobs/create" element={
          <ProtectedRoute allowedRoles={['ROLE_HR']}>
            <CreateJob />
          </ProtectedRoute>
        } />
        
        <Route path="/hr/jobs/edit/:id" element={
          <ProtectedRoute allowedRoles={['ROLE_HR']}>
            <CreateJob />
          </ProtectedRoute>
        } />
        
        <Route path="/hr/jobs/:id/rankings" element={
          <ProtectedRoute allowedRoles={['ROLE_HR']}>
            <CandidateRankings />
          </ProtectedRoute>
        } />
        
        <Route path="/hr/applications/:id/evaluation" element={
          <ProtectedRoute allowedRoles={['ROLE_HR']}>
            <AIEvaluationResults />
          </ProtectedRoute>
        } />
        
        <Route path="/hr/analytics" element={
          <ProtectedRoute allowedRoles={['ROLE_HR']}>
            <Analytics />
          </ProtectedRoute>
        } />

        {/* Fallback Catch */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
