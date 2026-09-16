import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessStaffRoute, getStaffModuleById } from '../staffAccess';

const StaffModuleRoute = ({ moduleId, children }) => {
  const { user } = useAuth();
  const module = getStaffModuleById(moduleId);

  if (!module || !canAccessStaffRoute(user?.role, module)) {
    return <Navigate to="/staff" replace />;
  }

  return children;
};

export default StaffModuleRoute;
