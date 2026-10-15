import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Layout from './components/Layout';
import RoleBasedRoute from './components/RoleBasedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewPawn from './pages/NewPawn';
import PawnList from './pages/PawnList';
import Repayments from './pages/Repayments';
import Redemption from './pages/Redemption';
import VaultManager from './pages/VaultManager';
import OverdueManager from './pages/OverdueManager';
import Auctions from './pages/Auctions';
import Customers from './pages/Customers';
import DayBook from './pages/DayBook';
import DailyRates from './pages/DailyRates';
import Reports from './pages/Reports';
import PrintTemplateEditor from './pages/PrintTemplateEditor';
import Settings from './pages/Settings';
import RePledgeManager from './pages/RePledgeManager';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Authenticated Dashboard Shell */}
            <Route
              path="/"
              element={
                <RoleBasedRoute isLayoutRoute={true}>
                  <Layout />
                </RoleBasedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <RoleBasedRoute screenKey="dashboard">
                    <Dashboard />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="new-pawn"
                element={
                  <RoleBasedRoute screenKey="newPawn">
                    <NewPawn />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="pawn-list"
                element={
                  <RoleBasedRoute screenKey="pawnList">
                    <PawnList />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="repayments"
                element={
                  <RoleBasedRoute screenKey="repayments">
                    <Repayments />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="redemption"
                element={
                  <RoleBasedRoute screenKey="redemption">
                    <Redemption />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="repledge"
                element={
                  <RoleBasedRoute screenKey="repledge">
                    <RePledgeManager />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="vaults"
                element={
                  <RoleBasedRoute screenKey="vaultManager">
                    <VaultManager />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="overdue"
                element={
                  <RoleBasedRoute screenKey="overdueManager">
                    <OverdueManager />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="auctions"
                element={
                  <RoleBasedRoute screenKey="auctions">
                    <Auctions />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="customers"
                element={
                  <RoleBasedRoute screenKey="customers">
                    <Customers />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="daybook"
                element={
                  <RoleBasedRoute screenKey="daybook">
                    <DayBook />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="daily-rates"
                element={
                  <RoleBasedRoute screenKey="dailyRates">
                    <DailyRates />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <RoleBasedRoute screenKey="reports">
                    <Reports />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="print-templates"
                element={
                  <RoleBasedRoute screenKey="printTemplates">
                    <PrintTemplateEditor />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <RoleBasedRoute screenKey="auditLogs">
                    <Reports />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <RoleBasedRoute screenKey="settings">
                    <Settings />
                  </RoleBasedRoute>
                }
              />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
