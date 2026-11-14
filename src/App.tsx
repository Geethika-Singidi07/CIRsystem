import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EmailVerificationNotice } from './components/EmailVerificationNotice';
import { HomePage } from './pages/HomePage';
import { CitizenAuthPage } from './pages/CitizenAuthPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { SubmitComplaintPage } from './pages/SubmitComplaintPage';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { CitizenProfilePage } from './pages/CitizenProfilePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminStaffPage } from './pages/AdminStaffPage';

function FullPageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-civic-royal border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-medium text-slate-600">Loading CIRS session...</p>
      </div>
    </div>
  );
}

function CitizenProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, emailVerified, loading, authReady } = useAuth();

  if (!authReady || loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!emailVerified) {
    return <EmailVerificationNotice />;
  }

  return <>{children}</>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, authReady } = useAuth();

  if (!authReady || loading) {
    return <FullPageLoader />;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<CitizenAuthPage initialMode="login" />} />
            <Route path="/register" element={<CitizenAuthPage initialMode="register" />} />

            <Route
              path="/dashboard"
              element={
                <CitizenProtectedRoute>
                  <CitizenDashboard />
                </CitizenProtectedRoute>
              }
            />
            <Route
              path="/submit"
              element={
                <CitizenProtectedRoute>
                  <SubmitComplaintPage />
                </CitizenProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <CitizenProtectedRoute>
                  <CitizenProfilePage />
                </CitizenProtectedRoute>
              }
            />
            <Route
              path="/complaints/:id"
              element={
                <CitizenProtectedRoute>
                  <ComplaintDetailPage />
                </CitizenProtectedRoute>
              }
            />

            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <AdminProtectedRoute>
                  <AdminStaffPage />
                </AdminProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
