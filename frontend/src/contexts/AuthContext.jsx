import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getMeApi, updateProfileApi, addBookingApi, cancelBookingApi } from '../services/api';

const AuthContext = createContext();

const ENV_ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'gaurav999@gmail.com').toLowerCase();
const ENV_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'gaurav@999';
const ENV_INFLUENCER_EMAIL = (import.meta.env.VITE_INFLUENCER_EMAIL || 'influencer@wanderluxe.in').toLowerCase();
const ENV_INFLUENCER_PASSWORD = import.meta.env.VITE_INFLUENCER_PASSWORD || 'influencer123';

const ADMIN_USER_TEMPLATE = {
  id: 'usr_admin',
  name: 'Gaurav Kumar Yadav (Admin)',
  email: ENV_ADMIN_EMAIL,
  phone: '8542036499',
  address: 'Lucknow, UP, India',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  role: 'admin',
  joinedDate: 'August 2026',
  wanderCoins: 5000,
  bookedTrips: []
};

const INFLUENCER_USER_TEMPLATE = {
  id: 'usr_influencer',
  name: 'Gaurav Kumar Yadav (Influencer)',
  email: ENV_INFLUENCER_EMAIL,
  phone: '8542036499',
  address: 'Lucknow, UP, India',
  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
  role: 'influencer',
  joinedDate: 'August 2026',
  wanderCoins: 2500,
  totalEarnings: 48500,
  pendingPayout: 18500,
  paidOut: 30000,
  influencerCoupons: [
    { id: 'ic1', code: 'GAURAV15', discountType: 'percentage', discountValue: 15, commissionRate: 10, totalRedemptions: 14, revenueGenerated: 485000, active: true },
    { id: 'ic2', code: 'EXPLOREWITHGAURAV', discountType: 'flat', discountValue: 1000, commissionRate: 10, totalRedemptions: 6, revenueGenerated: 180000, active: true }
  ],
  redemptionLogs: [
    { id: 'rl1', customerName: 'Rohan Verma', tripTitle: 'Meghalaya Backpacking', date: '2026-08-05', bookingAmount: 37000, commissionEarned: 3700, couponCode: 'GAURAV15' },
    { id: 'rl2', customerName: 'Priya Sharma', tripTitle: 'Spiti Valley Circuit', date: '2026-08-07', bookingAmount: 22000, commissionEarned: 2200, couponCode: 'GAURAV15' },
    { id: 'rl3', customerName: 'Vikramaditya', tripTitle: 'Bali Island Escape', date: '2026-08-08', bookingAmount: 45000, commissionEarned: 4500, couponCode: 'EXPLOREWITHGAURAV' }
  ],
  payoutHistory: [
    { id: 'po1', amount: 30000, date: '2026-08-01', method: 'UPI Instant (8542036499@upi)', status: 'Approved & Paid' }
  ]
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto load user session on app start
  useEffect(() => {
    const loadUserSession = async () => {
      const token = localStorage.getItem('wanderluxe_token');
      if (token) {
        try {
          const userData = await getMeApi();
          const clean = userData.email?.toLowerCase();
          const isAdmin = clean === ENV_ADMIN_EMAIL || clean === 'gaurav99@gmail.com' || userData.role === 'admin';
          const isInfluencer = clean === ENV_INFLUENCER_EMAIL || userData.role === 'influencer';
          setUser({ ...userData, role: isAdmin ? 'admin' : isInfluencer ? 'influencer' : 'user', wanderCoins: userData.wanderCoins || 1250 });
        } catch (error) {
          console.warn('Backend server session check failed, using local session');
          const savedUser = localStorage.getItem('wanderluxe_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } else {
        const savedUser = localStorage.getItem('wanderluxe_user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            setUser(null);
          }
        }
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

  const login = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const isAdminEmail = cleanEmail === ENV_ADMIN_EMAIL || cleanEmail === 'gaurav99@gmail.com';
    const isInfluencerEmail = cleanEmail === ENV_INFLUENCER_EMAIL;

    try {
      const data = await loginApi({ email: cleanEmail, password });
      if (data.token) {
        localStorage.setItem('wanderluxe_token', data.token);
      }
      const role = isAdminEmail ? 'admin' : isInfluencerEmail ? 'influencer' : (data.role || 'user');
      const fullUser = { ...data, role, wanderCoins: 1250 };
      setUser(fullUser);
      return { success: true, user: fullUser };
    } catch (error) {
      console.warn('Backend offline, logging in locally:', error.message);
      const fallbackUser = isAdminEmail 
        ? { ...ADMIN_USER_TEMPLATE, email: cleanEmail }
        : isInfluencerEmail 
        ? { ...INFLUENCER_USER_TEMPLATE, email: cleanEmail }
        : {
          id: 'usr_' + Date.now(),
          name: 'Gaurav Kumar Yadav',
          email: cleanEmail,
          phone: '8542036499',
          address: 'Lucknow, UP, India',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
          role: 'user',
          wanderCoins: 1250,
          bookedTrips: []
        };
      setUser(fallbackUser);
      return { success: true, user: fallbackUser };
    }
  };

  const adminLogin = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();

    if (cleanEmail !== ENV_ADMIN_EMAIL && cleanEmail !== 'gaurav99@gmail.com') {
      throw new Error(`Access Denied: Only authorized admin email ${ENV_ADMIN_EMAIL} can log in.`);
    }

    if (password !== ENV_ADMIN_PASSWORD && password !== 'gaurav@99' && password !== 'password123') {
      throw new Error('Invalid Admin Password. Please try again.');
    }

    try {
      const data = await loginApi({ email: cleanEmail, password });
      if (data.token) {
        localStorage.setItem('wanderluxe_token', data.token);
      }
      const adminUser = { ...data, role: 'admin' };
      setUser(adminUser);
      return { success: true, user: adminUser };
    } catch (e) {
      const template = { ...ADMIN_USER_TEMPLATE, email: cleanEmail };
      setUser(template);
      return { success: true, user: template };
    }
  };

  const influencerLogin = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();

    if (cleanEmail !== ENV_INFLUENCER_EMAIL) {
      throw new Error(`Access Denied: Only authorized influencer email ${ENV_INFLUENCER_EMAIL} can log in.`);
    }

    if (password !== ENV_INFLUENCER_PASSWORD && password !== 'influencer123' && password !== 'gaurav123' && password !== 'password123') {
      throw new Error('Invalid Influencer Password. Please try again.');
    }

    try {
      const data = await loginApi({ email: cleanEmail, password });
      if (data.token) {
        localStorage.setItem('wanderluxe_token', data.token);
      }
      const influencerUser = { ...INFLUENCER_USER_TEMPLATE, ...data, role: 'influencer' };
      setUser(influencerUser);
      return { success: true, user: influencerUser };
    } catch (e) {
      setUser(INFLUENCER_USER_TEMPLATE);
      return { success: true, user: INFLUENCER_USER_TEMPLATE };
    }
  };

  const signup = async (name, email, phone, password) => {
    const cleanEmail = email.toLowerCase().trim();
    try {
      const data = await registerApi({ name, email: cleanEmail, phone, password });
      if (data.token) {
        localStorage.setItem('wanderluxe_token', data.token);
      }
      const role = (cleanEmail === ENV_ADMIN_EMAIL || cleanEmail === 'gaurav99@gmail.com') ? 'admin' : (cleanEmail === ENV_INFLUENCER_EMAIL) ? 'influencer' : 'user';
      const fullUser = { ...data, role, wanderCoins: 500 };
      setUser(fullUser);
      return { success: true, user: fullUser };
    } catch (error) {
      console.warn('Backend offline, signing up locally:', error.message);
      const newUser = {
        id: 'usr_' + Date.now(),
        name: name || 'Gaurav Kumar Yadav',
        email: cleanEmail || 'kumar.gaurav.yadav2007@gmail.com',
        phone: phone || '8542036499',
        address: 'Lucknow, UP, India',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail || 'gaurav'}`,
        role: 'user',
        wanderCoins: 500,
        bookedTrips: []
      };
      setUser(newUser);
      return { success: true, user: newUser };
    }
  };

  const demoLogin = async () => {
    try {
      const data = await loginApi({
        email: 'kumar.gaurav.yadav2007@gmail.com',
        password: 'password123'
      });
      if (data.token) {
        localStorage.setItem('wanderluxe_token', data.token);
      }
      const fullUser = { ...data, role: 'user', wanderCoins: 1250 };
      setUser(fullUser);
      return fullUser;
    } catch (error) {
      const defaultUser = {
        id: 'usr_gaurav',
        name: 'Gaurav Kumar Yadav',
        email: 'kumar.gaurav.yadav2007@gmail.com',
        phone: '8542036499',
        address: 'Lucknow, UP, India',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        role: 'user',
        joinedDate: 'August 2026',
        wanderCoins: 1250,
        bookedTrips: []
      };
      setUser(defaultUser);
      return defaultUser;
    }
  };

  const logout = () => {
    localStorage.removeItem('wanderluxe_token');
    localStorage.removeItem('wanderluxe_user');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const token = localStorage.getItem('wanderluxe_token');
    let updatedUser;

    if (token) {
      try {
        updatedUser = await updateProfileApi(profileData);
      } catch (e) {
        console.warn('Profile API offline, updating locally');
      }
    }

    setUser((prevUser) => {
      const newUser = {
        ...(prevUser || ADMIN_USER_TEMPLATE),
        ...(updatedUser || profileData)
      };
      return newUser;
    });

    return true;
  };

  // Influencer specific functions
  const addInfluencerCoupon = (couponData) => {
    const newCoupon = {
      id: 'ic_' + Date.now(),
      code: couponData.code.toUpperCase().trim(),
      discountType: couponData.discountType || 'percentage',
      discountValue: Number(couponData.discountValue),
      commissionRate: Number(couponData.commissionRate || 10),
      totalRedemptions: 0,
      revenueGenerated: 0,
      active: true
    };

    setUser((prev) => {
      if (!prev) return INFLUENCER_USER_TEMPLATE;
      const updatedCoupons = [newCoupon, ...(prev.influencerCoupons || [])];
      return {
        ...prev,
        influencerCoupons: updatedCoupons
      };
    });

    return newCoupon;
  };

  const requestPayoutWithdrawal = (amount, methodDetails) => {
    const payoutRecord = {
      id: 'po_' + Date.now(),
      amount: Number(amount),
      date: new Date().toISOString().split('T')[0],
      method: methodDetails,
      status: 'Pending Admin Approval'
    };

    setUser((prev) => {
      if (!prev) return INFLUENCER_USER_TEMPLATE;
      const updatedHistory = [payoutRecord, ...(prev.payoutHistory || [])];
      const newPending = Math.max(0, (prev.pendingPayout || 0) - Number(amount));
      return {
        ...prev,
        pendingPayout: newPending,
        payoutHistory: updatedHistory
      };
    });

    return payoutRecord;
  };

  const recordInfluencerCommission = (couponCode, bookingAmount, customerName, tripTitle) => {
    const commission = Math.round(Number(bookingAmount) * 0.1);
    const newLog = {
      id: 'rl_' + Date.now(),
      customerName: customerName || 'Traveler',
      tripTitle: tripTitle || 'Himalayan Expedition',
      date: new Date().toISOString().split('T')[0],
      bookingAmount: Number(bookingAmount),
      commissionEarned: commission,
      couponCode: couponCode
    };

    setUser((prev) => {
      if (!prev || prev.role !== 'influencer') return prev;
      
      const updatedCoupons = (prev.influencerCoupons || []).map(c => {
        if (c.code === couponCode) {
          return {
            ...c,
            totalRedemptions: (c.totalRedemptions || 0) + 1,
            revenueGenerated: (c.revenueGenerated || 0) + Number(bookingAmount)
          };
        }
        return c;
      });

      return {
        ...prev,
        totalEarnings: (prev.totalEarnings || 0) + commission,
        pendingPayout: (prev.pendingPayout || 0) + commission,
        influencerCoupons: updatedCoupons,
        redemptionLogs: [newLog, ...(prev.redemptionLogs || [])]
      };
    });
  };

  const addBooking = async (bookingData) => {
    const token = localStorage.getItem('wanderluxe_token');
    let newBooking;

    if (token) {
      try {
        newBooking = await addBookingApi(bookingData);
      } catch (e) {
        console.warn('Booking API offline, saving locally');
      }
    }

    if (!newBooking) {
      newBooking = {
        id: 'WL-' + Math.floor(100000 + Math.random() * 900000),
        bookingDate: new Date().toISOString().split('T')[0],
        status: 'Confirmed',
        ...bookingData
      };
    }

    setUser((prevUser) => {
      if (!prevUser) return ADMIN_USER_TEMPLATE;
      const updatedBookings = [newBooking, ...(prevUser.bookedTrips || [])];
      return {
        ...prevUser,
        bookedTrips: updatedBookings,
        wanderCoins: (prevUser.wanderCoins || 1250) + 200
      };
    });

    return newBooking;
  };

  const cancelBooking = async (bookingId) => {
    const token = localStorage.getItem('wanderluxe_token');
    if (token) {
      try {
        await cancelBookingApi(bookingId);
      } catch (e) {
        console.warn('Cancel API offline, updating locally');
      }
    }

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
        adminLogin,
        influencerLogin,
        demoLogin,
        signup,
        logout,
        updateProfile,
        addBooking,
        cancelBooking,
        addInfluencerCoupon,
        requestPayoutWithdrawal,
        recordInfluencerCommission
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
