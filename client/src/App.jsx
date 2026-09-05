import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ContractsPage } from './pages/ContractsPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { AttendancePage } from './pages/AttendancePage';
import { TimeOffPage } from './pages/TimeOffPage';
import { PayrunsPage } from './pages/PayrunsPage';
import { PayrunDetailPage } from './pages/PayrunDetailPage';
import { PayslipsPage } from './pages/PayslipsPage';
import { SalaryStructuresPage } from './pages/SalaryStructuresPage';
import { SalaryRulesPage } from './pages/SalaryRulesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  if (allowedRoles && user?.role !== 'Admin' && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Landing & Login Routes */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Platform Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route
                path="contracts"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
                    <ContractsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="schedules"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
                    <SchedulesPage />
                  </ProtectedRoute>
                }
              />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="time-off" element={<TimeOffPage />} />
              <Route
                path="payruns"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Payroll User', 'HR Payroll Manager']}>
                    <PayrunsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payruns/:id"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Payroll User', 'HR Payroll Manager']}>
                    <PayrunDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route path="payslips" element={<PayslipsPage />} />
              <Route
                path="salary-structures"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Payroll User', 'HR Payroll Manager']}>
                    <SalaryStructuresPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="salary-rules"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Payroll User', 'HR Payroll Manager']}>
                    <SalaryRulesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
