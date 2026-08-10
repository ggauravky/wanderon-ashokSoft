import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const InfluencerRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-navy text-white">
        <div className="w-10 h-10 border-4 border-brand-emerald border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isInfluencerOrAdmin = 
    isAuthenticated && 
    (user?.role === 'influencer' || user?.role === 'admin' || user?.email?.toLowerCase() === 'influencer@wanderluxe.in');

  if (!isInfluencerOrAdmin) {
    return <Navigate to="/influencer/login" state={{ from: location }} replace />;
  }

  return children;
};

export default InfluencerRoute;
