import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ScreenLocked from './ScreenLocked';

export default function RoleBasedRoute({ children, screenKey, allowedRoles = [], isLayoutRoute = false }) {
  const { user, loading, isScreenPermitted, isRegistered } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If this is the outer Layout shell wrapper, allow rendering so the shell & /settings stay mounted
  if (isLayoutRoute) {
    return children;
  }

  // If client is not registered with Renic Soft, lock all operational screens except Settings
  if (!isRegistered && screenKey && screenKey !== 'settings') {
    return <ScreenLocked screenName={screenKey} isActivationRequired={true} />;
  }

  if (screenKey && !isScreenPermitted(screenKey)) {
    return <ScreenLocked screenName={screenKey} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role) && user.role !== 'ADMIN') {
    return <ScreenLocked screenName="Authorized Access Only" />;
  }

  return children;
}
