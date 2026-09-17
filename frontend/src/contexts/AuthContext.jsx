import React, { createContext, useContext, useState, useEffect } from 'react';
import * as apiService from '../services/api.js';

const loginApi = async (...args) => (apiService.loginApi || apiService.default?.loginApi)?.(...args);
const registerApi = async (...args) => (apiService.registerApi || apiService.default?.registerApi)?.(...args);
const influencerLoginApi = async (...args) => (apiService.influencerLoginApi || apiService.default?.influencerLoginApi)?.(...args);
const influencerApplyApi = async (...args) => (apiService.influencerApplyApi || apiService.default?.influencerApplyApi)?.(...args);
const getMeApi = async (...args) => (apiService.getMeApi || apiService.default?.getMeApi)?.(...args);
const updateProfileApi = async (...args) => (apiService.updateProfileApi || apiService.default?.updateProfileApi)?.(...args);
const addBookingApi = async (...args) => (apiService.addBookingApi || apiService.default?.addBookingApi)?.(...args);
const cancelBookingApi = async (...args) => (apiService.cancelBookingApi || apiService.default?.cancelBookingApi)?.(...args);
const getInfluencerApplicationsApi = async (...args) => (apiService.getInfluencerApplicationsApi || apiService.default?.getInfluencerApplicationsApi)?.(...args);
const approveInfluencerApplicationApi = async (...args) => (apiService.approveInfluencerApplicationApi || apiService.default?.approveInfluencerApplicationApi)?.(...args);
const rejectInfluencerApplicationApi = async (...args) => (apiService.rejectInfluencerApplicationApi || apiService.default?.rejectInfluencerApplicationApi)?.(...args);

const AuthContext = createContext();

const ENV_ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'gaurav999@gmail.com').toLowerCase();
const ENV_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'gaurav@999';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [influencerApplications, setInfluencerApplications] = useState([]);

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
      if (token) {
        try {
          const userData = await getMeApi();
          const clean = userData.email?.toLowerCase();
          const normalizedRole = (userData.role || 'user').toLowerCase();
          const isSuperAdmin = normalizedRole === 'super_admin';
          const isSales = normalizedRole === 'sales';
          const isAdmin = normalizedRole === 'admin' || clean === ENV_ADMIN_EMAIL;
          const isInfluencer = normalizedRole === 'influencer' && userData.influencerStatus === 'approved';
          
          const effectiveRole = isSuperAdmin ? 'super_admin' : isSales ? 'sales' : isAdmin ? 'admin' : isInfluencer ? 'influencer' : normalizedRole;

          setUser({
            ...userData,
            role: effectiveRole,
            influencerStatus: userData.influencerStatus || 'none',
            wanderCoins: userData.wanderCoins || 500
          });
        } catch (error) {
          console.warn('Session expired or invalid, clearing token');
          localStorage.removeItem('wanderluxe_token');
          localStorage.removeItem('wanderluxe_user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    loadUserSession();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('wanderluxe_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('wanderluxe_user');
    }
  }, [user]);

  // Standard User Login (Strict Database Auth)
  const login = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const data = await loginApi({ email: cleanEmail, password });
    if (data.token) {
      localStorage.setItem('wanderluxe_token', data.token);
    }
    const cleanRole = (data.role || 'user').toLowerCase();
    const isSuperAdmin = cleanRole === 'super_admin';
    const isSales = cleanRole === 'sales';
    const isAdmin = cleanRole === 'admin' || cleanEmail === ENV_ADMIN_EMAIL;
    const isInfluencer = cleanRole === 'influencer' && data.influencerStatus === 'approved';
    const fullUser = {
      ...data,
      role: isSuperAdmin ? 'super_admin' : isSales ? 'sales' : isAdmin ? 'admin' : isInfluencer ? 'influencer' : cleanRole,
      influencerStatus: data.influencerStatus || 'none',
      wanderCoins: data.wanderCoins || 500
    };
    setUser(fullUser);
    return { success: true, user: fullUser };
  };

  // Canonical Staff Control Center login
  const staffLogin = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const data = await loginApi({ email: cleanEmail, password });

    const returnedRole = (data.role || '').toLowerCase();
    const allowedStaffRoles = ['super_admin', 'admin', 'sales', 'marketing'];

    if (!allowedStaffRoles.includes(returnedRole)) {
      throw new Error('This account does not have staff portal access.');
    }

    if (data.token) {
      localStorage.setItem('wanderluxe_token', data.token);
    }

    const staffUser = {
      ...data,
      role: returnedRole,
      influencerStatus: data.influencerStatus || 'none',
      wanderCoins: data.wanderCoins || 500
    };

    setUser(staffUser);
    return {
      success: true,
      user: staffUser,
      role: staffUser.role,
      destination: '/staff'
    };
  };

  // Backwards-compatible Admin Login delegate
  const adminLogin = async (email, password) => {
    return await staffLogin(email, password);
  };

  // Dedicated Influencer Login (Strict database approval check)
  const influencerLogin = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const data = await influencerLoginApi({ email: cleanEmail, password });
    if (data.token) {
      localStorage.setItem('wanderluxe_token', data.token);
    }
    const influencerUser = {
      ...data,
      role: 'influencer',
      influencerStatus: 'approved'
    };
    setUser(influencerUser);
    return { success: true, user: influencerUser };
  };

  // Standard User Signup (Saved directly into MongoDB)
  const signup = async (name, email, phone, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const data = await registerApi({ name, email: cleanEmail, phone, password });
    if (data.token) {
      localStorage.setItem('wanderluxe_token', data.token);
    }
    const fullUser = { ...data, role: data.role || 'user', influencerStatus: data.influencerStatus || 'none', wanderCoins: 500 };
    setUser(fullUser);
    return { success: true, user: fullUser };
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
    localStorage.removeItem('wanderluxe_token');
    localStorage.removeItem('wanderluxe_user');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const updated = await updateProfileApi(profileData);
    setUser((prev) => ({
      ...(prev || {}),
      ...updated
    }));
    return true;
  };

  const addBooking = async (bookingData) => {
    const saved = await addBookingApi(bookingData);
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedBookings = [saved, ...(prevUser.bookedTrips || [])];
      return {
        ...prevUser,
        bookedTrips: updatedBookings,
        wanderCoins: (prevUser.wanderCoins || 500) + 200
      };
    });
    return saved;
  };

  const cancelBooking = async (bookingId) => {
    await cancelBookingApi(bookingId);
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedBookings = (prevUser.bookedTrips || []).map((b) =>
        b.id === bookingId ? { ...b, status: 'Cancelled' } : b
      );
      return {
        ...prevUser,
        bookedTrips: updatedBookings
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        staffLogin,
        adminLogin,
        influencerLogin,
        signup,
        logout,
        updateProfile,
        addBooking,
        cancelBooking,
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
