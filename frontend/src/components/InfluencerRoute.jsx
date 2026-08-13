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

  const isOfficialAdmin = user?.role === 'admin' || user?.email?.toLowerCase() === 'gaurav999@gmail.com';
  const isOfficialTestInfluencer = user?.email?.toLowerCase() === 'influencer@wanderluxe.in';
  const isApprovedInfluencer = user?.role === 'influencer' && (user?.influencerStatus === 'approved' || !user?.influencerStatus);

  // If applicant is pending approval or rejected, render InfluencerPending screen
  if (!isOfficialAdmin && !isOfficialTestInfluencer && !isApprovedInfluencer) {
    return <InfluencerPending />;
  }

  return children;
};

export default InfluencerRoute;
