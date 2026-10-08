import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import MemberManagement from './pages/admin/MemberManagement';
import ExpenseManagement from './pages/admin/ExpenseManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import TaskManager from './pages/admin/TaskManager';
import MonthlyReports from './pages/admin/MonthlyReports';
import SettingsPage from './pages/admin/SettingsPage';

// Member pages
import MemberDashboard from './pages/member/MemberDashboard';
import MyExpenses from './pages/member/MyExpenses';
import MyPayments from './pages/member/MyPayments';
import MyTasks from './pages/member/MyTasks';
import MyProfile from './pages/member/MyProfile';

// Route guard for authenticated users
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Route guard for Admin role
function AdminOnlyRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/member/dashboard" replace />;
  return children;
}

// Route guard for Member role
function MemberOnlyRoute({ children }) {
  const { user, isMember, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isMember) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

// Root redirector based on authentication and role
function RootRedirect() {
  const { user, isAdmin, isMember, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/member/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route (No Public Signup) */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Frame */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Root index route */}
            <Route path="/" element={<RootRedirect />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminOnlyRoute>
                  <AdminDashboard />
                </AdminOnlyRoute>
              }
            />
            <Route
              path="/admin/members"
              element={
                <AdminOnlyRoute>
                  <MemberManagement />
                </AdminOnlyRoute>
              }
            />
            <Route
              path="/admin/expenses"
              element={
                <AdminOnlyRoute>
                  <ExpenseManagement />
                </AdminOnlyRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <AdminOnlyRoute>
                  <PaymentManagement />
                </AdminOnlyRoute>
              }
            />
            <Route
              path="/admin/tasks"
              element={
                <AdminOnlyRoute>
                  <TaskManager />
                </AdminOnlyRoute>
              }
            />
            <Route
              path="/admin/ledger"
              element={
                <AdminOnlyRoute>
                  <MonthlyReports />
                </AdminOnlyRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminOnlyRoute>
                  <SettingsPage />
                </AdminOnlyRoute>
              }
            />

            {/* Member Routes */}
            <Route
              path="/member/dashboard"
              element={
                <MemberOnlyRoute>
                  <MemberDashboard />
                </MemberOnlyRoute>
              }
            />
            <Route
              path="/member/expenses"
              element={
                <MemberOnlyRoute>
                  <MyExpenses />
                </MemberOnlyRoute>
              }
            />
            <Route
              path="/member/payments"
              element={
                <MemberOnlyRoute>
                  <MyPayments />
                </MemberOnlyRoute>
              }
            />
            <Route
              path="/member/tasks"
              element={
                <MemberOnlyRoute>
                  <MyTasks />
                </MemberOnlyRoute>
              }
            />
            <Route
              path="/member/profile"
              element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
