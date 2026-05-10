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
import Companies from '../pages/Companies';

// Auth pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import AcceptInvite from '../pages/AcceptInvite';

// Protected user pages
import Dashboard from '../pages/Dashboard';
import Applications from '../pages/Applications';
import Profile from '../pages/Profile';
import Notifications from '../pages/Notifications';
import SavedJobs from '../pages/SavedJobs';
import Settings from '../pages/Settings';

// Recruiter pages
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard';
import PostJob from '../pages/recruiter/PostJob';
import ApplicationsManager from '../pages/recruiter/ApplicationsManager';
import Organizations from '../pages/recruiter/Organizations';
import CreateOrganization from '../pages/recruiter/CreateOrganization';

const AppRoutes = () => {
  return (
    <Routes>
      {/* AUTH LAYOUT */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />
      </Route>

      {/*  PUBLIC LAYOUT  */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/pricing" element={<Pricing />} />
      </Route>

      {/*  APP LAYOUT (protected)  */}
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
        <Route path="/saved-jobs" element={<SavedJobs />} />
        <Route path="/settings" element={<Settings />} />

        {/* Recruiter routes */}
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute requiredRole={["recruiter", "owner"]}>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/post-job"
          element={
            <ProtectedRoute requiredRole={["recruiter", "owner"]}>
              <PostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/applications/:jobId"
          element={
            <ProtectedRoute requiredRole={["recruiter", "owner"]}>
              <ApplicationsManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/applications"
          element={
            <ProtectedRoute requiredRole={["recruiter", "owner"]}>
              <ApplicationsManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/organizations"
          element={
            <ProtectedRoute requiredRole={["recruiter", "owner"]}>
              <Organizations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/create-organization"
          element={
            <ProtectedRoute requiredRole={["recruiter", "owner"]}>
              <CreateOrganization />
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
