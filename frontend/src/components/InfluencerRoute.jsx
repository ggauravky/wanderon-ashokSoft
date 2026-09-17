import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import InfluencerPending from './InfluencerPending';

const InfluencerRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b132b] text-white">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/influencer/login" state={{ from: location }} replace />;
  }

  const isOfficialAdmin = user?.role === 'admin';
  const isApprovedInfluencer = user?.role === 'influencer' && user?.influencerStatus === 'approved';

  // If applicant is pending approval or not approved, render InfluencerPending screen
  if (!isOfficialAdmin && !isApprovedInfluencer) {
    return <InfluencerPending />;
  }

  return children;
};

export default InfluencerRoute;
