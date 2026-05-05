import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// Public pages
import Landing from '../pages/Landing';
import Jobs from '../pages/Jobs';
import JobDetail from '../pages/JobDetail';
import Pricing from '../pages/Pricing';

// Auth pages
import Login from '../pages/Login';
import Register from '../pages/Register';

// Protected user pages
import Dashboard from '../pages/Dashboard';
import Applications from '../pages/Applications';
import Profile from '../pages/Profile';
import Notifications from '../pages/Notifications';

// Recruiter pages
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard';
import PostJob from '../pages/recruiter/PostJob';
import ApplicationsManager from '../pages/recruiter/ApplicationsManager';
import Organizations from '../pages/recruiter/Organizations';

const AppRoutes = () => {
  return (
    <Routes>
      {/* ── AUTH LAYOUT ── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* ── PUBLIC LAYOUT ── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/pricing" element={<Pricing />} />
      </Route>

      {/* ── APP LAYOUT (protected) ── */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* User routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />

        {/* Recruiter routes */}
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/post-job"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <PostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/applications/:jobId"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <ApplicationsManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/applications"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <ApplicationsManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/organizations"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <Organizations />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
