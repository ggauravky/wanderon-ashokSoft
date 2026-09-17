import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  approveInfluencerApplicationApi,
  getInfluencerApplicationsApi,
  getMeApi,
  influencerApplyApi,
  influencerLoginApi,
  loginApi,
  registerApi,
  rejectInfluencerApplicationApi,
  updateProfileApi
} from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [influencerApplications, setInfluencerApplications] = useState([]);

  const clearSession = () => {
    localStorage.removeItem('wanderluxe_token');
    localStorage.removeItem('wanderluxe_user');
    setUser(null);
  };

  const establishSession = async (loginData) => {
    if (!loginData?.token) throw new Error('Authentication did not return a session token.');
    localStorage.setItem('wanderluxe_token', loginData.token);
    try {
      const currentUser = await getMeApi();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      clearSession();
      throw error;
    }
  };

  // Load database applications directly from MongoDB
  const fetchInfluencerApplications = async () => {
    try {
      const serverApps = await getInfluencerApplicationsApi();
      if (Array.isArray(serverApps)) {
        const formatted = serverApps.map(u => ({
          ...u,
          ...(u.influencerApplication || {}),
          id: u._id || u.id,
          userId: u._id || u.id,
          status: u.influencerStatus || 'pending',
        }));
        setInfluencerApplications(formatted);
      }
    } catch (e) {
      console.warn('Could not fetch server applications:', e.message);
    }
  };

  // Auto load user session on app start from Backend Database
  useEffect(() => {
    const loadUserSession = async () => {
      const token = localStorage.getItem('wanderluxe_token');
      localStorage.removeItem('wanderluxe_user');
      if (token) {
        try {
          const userData = await getMeApi();
          setUser(userData);
        } catch (error) {
          console.warn('Session expired or invalid, clearing token');
          clearSession();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    loadUserSession();
  }, []);

  // Standard User Login (Strict Database Auth)
  const login = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const data = await loginApi({ email: cleanEmail, password });
    const currentUser = await establishSession(data);
    return { success: true, user: currentUser };
  };

  // Canonical Staff Control Center login
  const staffLogin = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const data = await loginApi({ email: cleanEmail, password });
    const currentUser = await establishSession(data);
    const returnedRole = (currentUser.role || '').toLowerCase();
    const allowedStaffRoles = ['super_admin', 'admin', 'sales', 'marketing'];

    if (!allowedStaffRoles.includes(returnedRole)) {
      clearSession();
      throw new Error('This account does not have staff portal access.');
    }
    return {
      success: true,
      user: currentUser,
      role: returnedRole,
      destination: '/staff'
    };
  };

  // Dedicated Influencer Login (Strict database approval check)
  const influencerLogin = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const data = await influencerLoginApi({ email: cleanEmail, password });
    const currentUser = await establishSession(data);
    if (currentUser.role !== 'influencer' || currentUser.influencerStatus !== 'approved') {
      clearSession();
      throw new Error('This account does not have approved creator access.');
    }
    return { success: true, user: currentUser };
  };

  // Standard User Signup (Saved directly into MongoDB)
  const signup = async (name, email, phone, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const data = await registerApi({ name, email: cleanEmail, phone, password });
    const currentUser = await establishSession(data);
    return { success: true, user: currentUser };
  };

  // Submit Influencer Application for Current Logged-in User
  const applyInfluencer = async (applicationData) => {
    const res = await influencerApplyApi({
      name: applicationData.name || user?.name,
      phone: applicationData.phone || user?.phone,
      socialHandle: applicationData.socialHandle,
      platform: applicationData.platform,
      followerCount: applicationData.followerCount,
      niche: applicationData.niche,
      sampleContent: applicationData.sampleContent
    });

    setUser((prev) => ({
      ...(prev || {}),
      name: applicationData.name || prev?.name,
      phone: applicationData.phone || prev?.phone,
      influencerStatus: 'pending',
      influencerApplication: {
        ...applicationData,
        applicationSubmitted: true,
        appliedAt: new Date().toISOString().split('T')[0]
      }
    }));

    await fetchInfluencerApplications();
    return res;
  };

  // Admin Approves Application
  const approveInfluencerApplication = async (appId) => {
    await approveInfluencerApplicationApi(appId);
    await fetchInfluencerApplications();
  };

  // Admin Rejects Application
  const rejectInfluencerApplication = async (appId, reason) => {
    await rejectInfluencerApplicationApi(appId, reason);
    await fetchInfluencerApplications();
  };

  const logout = () => {
    clearSession();
  };

  const updateProfile = async (profileData) => {
    const updated = await updateProfileApi(profileData);
    setUser((prev) => ({
      ...(prev || {}),
      ...updated
    }));
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        staffLogin,
        influencerLogin,
        signup,
        logout,
        updateProfile,
        influencerApplications,
        fetchInfluencerApplications,
        applyInfluencer,
        approveInfluencerApplication,
        rejectInfluencerApplication
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
