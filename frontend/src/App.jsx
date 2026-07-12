import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadResumes from './pages/UploadResumes';
import ResumeLibrary from './pages/ResumeLibrary';
import CreateJobDescription from './pages/CreateJobDescription';
import ComparisonResult from './pages/ComparisonResult';
import ComparisonHistory from './pages/ComparisonHistory';

// Route guard to check for auth tokens before loading workspaces
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Authentication Onboarding */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated Workspaces */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<UploadResumes />} />
          <Route path="library" element={<ResumeLibrary />} />
          <Route path="jobs" element={<CreateJobDescription />} />
          <Route path="comparisons/:id" element={<ComparisonResult />} />
          <Route path="history" element={<ComparisonHistory />} />
        </Route>

        {/* Catch All Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
