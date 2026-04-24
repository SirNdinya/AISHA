import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { Provider } from 'react-redux';
import { store } from './store';
import { system } from './theme';
import { ColorModeProviderWrapper } from './components/ui/color-mode';
import ErrorBoundary from './components/common/ErrorBoundary';

// Layouts
import StudentLayout from './components/layout/StudentLayout';
import CompanyLayout from './components/layout/CompanyLayout';
import AdminLayout from './components/layout/AdminLayout';
import PortalSelector from './pages/PortalSelector';

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import { SocketProvider } from './context/SocketContext';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import TitleManager from './components/common/TitleManager';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentAttachments from './pages/student/StudentAttachments';
import StudentSettings from './pages/student/StudentSettings';
import LogbookManager from './pages/student/LogbookManager';
import LogbookReview from './components/common/LogbookReview';

// Company Pages
import CompanyDashboard from './pages/company/CompanyDashboard';
import OpportunityManager from './pages/company/OpportunityManager';
import CompanyPlacementTracker from './pages/company/PlacementTracker';
import CompanySettings from './pages/company/CompanySettings';
import CompanyTransactions from './pages/company/CompanyTransactions';

// Institution Pages
import AdminPortalLayout from './pages/admin/AdminPortal/AdminPortalLayout';
import AnalyticsOverview from './pages/admin/AdminPortal/AnalyticsOverview';
import StudentSyncManager from './pages/admin/AdminPortal/StudentSyncManager';
import DepartmentManager from './pages/admin/AdminPortal/DepartmentManager';
import Broadcasting from './pages/admin/AdminPortal/Broadcasting';
import PlacementTracker from './pages/admin/AdminPortal/PlacementTracker';
import SettingsPage from './pages/admin/AdminPortal/SettingsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Common Pages
import NotificationPage from './pages/common/NotificationPage';

const App: React.FC = () => {
  const currentPortal = import.meta.env.VITE_PORTAL;

  const renderPortalRoutes = () => {
    // Shared routes for all portals
    const authRoutes = (
      <>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </>
    );

    const studentRoutes = (
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="attachments" element={<StudentAttachments />} />
        <Route path="settings" element={<StudentSettings />} />
        <Route path="logbook" element={<LogbookManager />} />
        <Route path="notifications" element={<NotificationPage />} />
      </Route>
    );

    const companyRoutes = (
      <Route path="/company" element={
        <ProtectedRoute allowedRoles={['COMPANY']}>
          <CompanyLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CompanyDashboard />} />
        <Route path="opportunities" element={<OpportunityManager />} />
        <Route path="placements" element={<CompanyPlacementTracker />} />
        <Route path="transactions" element={<CompanyTransactions />} />
        <Route path="settings" element={<CompanySettings />} />
        <Route path="notifications" element={<NotificationPage />} />
        <Route path="logbooks" element={<LogbookReview role="COMPANY" />} />
      </Route>
    );

    const institutionRoutes = (
      <>
        <Route path="/institution" element={
          <ProtectedRoute allowedRoles={['INSTITUTION']}>
            <AdminPortalLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AnalyticsOverview />} />
          <Route path="departments" element={<DepartmentManager />} />
          <Route path="students" element={<StudentSyncManager />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/department" element={
          <ProtectedRoute allowedRoles={['DEPARTMENT_ADMIN']}>
            <AdminPortalLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Broadcasting />} />
          <Route path="students" element={<StudentSyncManager />} />
          <Route path="logbooks" element={<LogbookReview role="INSTITUTION" />} />
          <Route path="placements" element={<PlacementTracker />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </>
    );

    const adminRoutes = (
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>
    );

    switch (currentPortal) {
      case 'student':
        return (
          <>
            <Route path="/" element={<Navigate to="/login" replace />} />
            {authRoutes}
            {studentRoutes}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        );

      case 'company':
        return (
          <>
            <Route path="/" element={<Navigate to="/login" replace />} />
            {authRoutes}
            {companyRoutes}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        );

      case 'institution':
        return (
          <>
            <Route path="/" element={<Navigate to="/login" replace />} />
            {authRoutes}
            {institutionRoutes}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        );

      case 'admin':
        return (
          <>
            <Route path="/" element={<Navigate to="/login" replace />} />
            {authRoutes}
            {adminRoutes}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        );

      default:
        return (
          <>
            <Route path="/" element={<PortalSelector />} />
            {authRoutes}
            {studentRoutes}
            {companyRoutes}
            {institutionRoutes}
            {adminRoutes}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        );
    }
  };

  return (
    <Provider store={store}>
      <ChakraProvider value={system}>
        <ErrorBoundary>
          <ColorModeProviderWrapper>
            <Router>
              <TitleManager />
              <SocketProvider userId={store.getState().auth.user?.id} institutionId={store.getState().auth.user?.institutionId}>
                <Routes>
                  {renderPortalRoutes()}
                </Routes>
              </SocketProvider>
            </Router>
          </ColorModeProviderWrapper>
        </ErrorBoundary>
      </ChakraProvider>
    </Provider>
  );
};

export default App;
