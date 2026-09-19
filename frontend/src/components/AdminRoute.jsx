import React from 'react';
import RoleProtectedRoute from './RoleProtectedRoute';

/**
 * AdminRoute: Restricts master /admin pages to admin & super_admin roles.
 * Sales specialists attempting to access /admin are automatically redirected to /staff/sales.
 */
const AdminRoute = ({ children }) => {
  return (
    <RoleProtectedRoute allowedRoles={['admin', 'super_admin']}>
      {children}
    </RoleProtectedRoute>
  );
};

export default AdminRoute;
