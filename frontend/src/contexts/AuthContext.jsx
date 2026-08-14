import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  loginApi, registerApi, influencerLoginApi, influencerApplyApi, getMeApi, 
  updateProfileApi, addBookingApi, cancelBookingApi, getInfluencerApplicationsApi, 
  approveInfluencerApplicationApi, rejectInfluencerApplicationApi 
} from '../services/api';

const AuthContext = createContext();

const ENV_ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'gaurav999@gmail.com').toLowerCase();
const ENV_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'gaurav@999';

const DEFAULT_ELIGIBLE_PLANS = [
  { 
    id: 1, 
    planTitle: 'Meghalaya Backpacking Living Root Bridges', 
    destination: 'Meghalaya, India', 
    duration: '5D/4N', 
    basePrice: 18500, 
    customerDiscountPct: 10, 
    influencerCommissionPct: 10, 
    expiryDate: '2026-12-31', 
    terms: 'Min booking value ₹15,000. Valid for group departures.',
    status: 'Approved & Active' 
  },
  { 
    id: 2, 
    planTitle: 'Spiti Valley Circuit High Altitude Roadtrip', 
    destination: 'Spiti Valley, Himachal', 
    duration: '7D/6N', 
    basePrice: 22000, 
    customerDiscountPct: 10, 
    influencerCommissionPct: 8, 
    expiryDate: '2026-12-31', 
    terms: 'Min booking value ₹20,000. Max 50 redemptions per code.',
    status: 'Approved & Active' 
  },
  { 
    id: 3, 
    planTitle: 'Goa Sun Beach and Party Getaway', 
    destination: 'Goa, India', 
    duration: '4D/3N', 
    basePrice: 14500, 
    customerDiscountPct: 15, 
    influencerCommissionPct: 10, 
    expiryDate: '2026-12-31', 
    terms: 'Valid on Double & Triple sharing plans.',
    status: 'Approved & Active' 
  },
  { 
    id: 4, 
    planTitle: 'Bali Island Escape Beaches and Culture', 
    destination: 'Bali, Indonesia', 
    duration: '6D/5N', 
    basePrice: 45000, 
    customerDiscountPct: 10, 
    influencerCommissionPct: 5, 
    expiryDate: '2026-12-31', 
    terms: 'Valid on international flight inclusive bookings.',
    status: 'Approved & Active' 
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [influencerApplications, setInfluencerApplications] = useState([]);

  const [eligiblePlans, setEligiblePlans] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wanderluxe_eligible_plans')) || DEFAULT_ELIGIBLE_PLANS;
    } catch (e) {
      return DEFAULT_ELIGIBLE_PLANS;
    }
  });

  const [allPayoutRequests, setAllPayoutRequests] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wanderluxe_payout_requests')) || [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('wanderluxe_eligible_plans', JSON.stringify(eligiblePlans));
  }, [eligiblePlans]);

  useEffect(() => {
    localStorage.setItem('wanderluxe_payout_requests', JSON.stringify(allPayoutRequests));
  }, [allPayoutRequests]);

  // Load database applications directly from MongoDB
  const fetchInfluencerApplications = async () => {
    try {
      const serverApps = await getInfluencerApplicationsApi();
      if (Array.isArray(serverApps)) {
        const formatted = serverApps.map(u => ({
          id: u._id || u.id,
          userId: u._id || u.id,
          name: u.name,
          email: u.email,
          socialHandle: u.influencerApplication?.socialHandle || '@creator',
          platform: u.influencerApplication?.platform || 'Instagram',
          followerCount: u.influencerApplication?.followerCount || '10K+',
          niche: u.influencerApplication?.niche || 'Travel',
          status: u.influencerStatus || 'pending',
          appliedAt: u.influencerApplication?.appliedAt ? new Date(u.influencerApplication.appliedAt).toISOString().split('T')[0] : 'Today',
          reviewNotes: u.influencerApplication?.reviewNotes || ''
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
          const isAdmin = clean === ENV_ADMIN_EMAIL || userData.role === 'admin';
          const isInfluencer = userData.role === 'influencer' && userData.influencerStatus === 'approved';
          setUser({
            ...userData,
            role: isAdmin ? 'admin' : isInfluencer ? 'influencer' : (userData.role || 'user'),
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
    const isAdmin = cleanEmail === ENV_ADMIN_EMAIL || data.role === 'admin';
    const isInfluencer = data.role === 'influencer' && data.influencerStatus === 'approved';
    const fullUser = {
      ...data,
      role: isAdmin ? 'admin' : isInfluencer ? 'influencer' : (data.role || 'user'),
      influencerStatus: data.influencerStatus || 'none',
      wanderCoins: data.wanderCoins || 500
    };
    setUser(fullUser);
    return { success: true, user: fullUser };
  };

  // Dedicated Admin Login (Strict credentials & Database Auth)
  const adminLogin = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();

    if (cleanEmail !== ENV_ADMIN_EMAIL) {
      throw new Error(`Access Denied: Only authorized admin email (${ENV_ADMIN_EMAIL}) can access the Admin Portal.`);
    }

    if (password !== ENV_ADMIN_PASSWORD && password !== 'gaurav@99') {
      throw new Error('Invalid Admin Security Password.');
    }

    const data = await loginApi({ email: cleanEmail, password });
    if (data.token) {
      localStorage.setItem('wanderluxe_token', data.token);
    }
    const adminUser = { ...data, role: 'admin', influencerStatus: 'approved' };
    setUser(adminUser);
    return { success: true, user: adminUser };
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
    let approvedEmail = null;
    
    // Call backend database API
    await approveInfluencerApplicationApi(appId);

    // Update local state
    setInfluencerApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId || app._id === appId || app.userId === appId) {
          approvedEmail = app.email;
          return { ...app, status: 'approved' };
        }
        return app;
      })
    );

    // If current logged-in user matches the approved applicant
    setUser((prev) => {
      if (prev && ((prev._id === appId || prev.id === appId) || (approvedEmail && prev.email?.toLowerCase() === approvedEmail?.toLowerCase()))) {
        return { ...prev, role: 'influencer', influencerStatus: 'approved' };
      }
      return prev;
    });
  };

  // Admin Rejects Application
  const rejectInfluencerApplication = async (appId, reason) => {
    let rejectedEmail = null;

    // Call backend database API
    await rejectInfluencerApplicationApi(appId, reason);

    // Update local state
    setInfluencerApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId || app._id === appId || app.userId === appId) {
          rejectedEmail = app.email;
          return { ...app, status: 'rejected', reviewNotes: reason || 'Criteria not met' };
        }
        return app;
      })
    );

    setUser((prev) => {
      if (prev && ((prev._id === appId || prev.id === appId) || (rejectedEmail && prev.email?.toLowerCase() === rejectedEmail?.toLowerCase()))) {
        return { ...prev, role: 'user', influencerStatus: 'rejected' };
      }
      return prev;
    });
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

  // Influencer Engine Functions
  const generatePlanCoupon = (plan) => {
    const prefix = (plan.destination || 'TRIP').slice(0, 4).toUpperCase();
    const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    const uniqueCode = `${prefix}-${randomHash}`;

    const newCoupon = {
      id: 'ic_' + Date.now(),
      code: uniqueCode,
      planId: plan.id,
      planTitle: plan.planTitle,
      discountType: 'percentage',
      discountValue: plan.customerDiscountPct || 10,
      commissionRate: plan.influencerCommissionPct || 10,
      totalRedemptions: 0,
      revenueGenerated: 0,
      commissionEarned: 0,
      expiryDate: plan.expiryDate || '2026-12-31',
      active: true
    };

    setUser((prev) => {
      if (!prev) return null;
      const updated = [newCoupon, ...(prev.influencerCoupons || [])];
      return {
        ...prev,
        influencerCoupons: updated
      };
    });

    return newCoupon;
  };

  const requestPayoutWithdrawal = (amount, methodDetails) => {
    const amt = Number(amount);
    const minThreshold = user?.minPayoutThreshold || 1000;

    if (amt < minThreshold) {
      throw new Error(`Minimum payout threshold is ₹${minThreshold.toLocaleString()}`);
    }

    if (user && amt > (user.availableBalance || 0)) {
      throw new Error(`Requested amount ₹${amt} exceeds available wallet balance of ₹${user.availableBalance}`);
    }

    const payoutRecord = {
      id: 'po_' + Date.now(),
      influencerName: user?.name,
      influencerEmail: user?.email,
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      method: methodDetails,
      status: 'Requested',
      reference: `REQ-${Math.floor(100000 + Math.random() * 900000)}`
    };

    setAllPayoutRequests((prev) => [payoutRecord, ...prev]);

    setUser((prev) => {
      if (!prev) return prev;
      const newAvailable = Math.max(0, (prev.availableBalance || 0) - amt);
      const newLedgerTx = {
        id: 'tx_' + Date.now(),
        bookingId: payoutRecord.id,
        type: 'Payout Transfer Requested',
        amount: amt,
        date: payoutRecord.date,
        status: 'Under Review',
        reference: `Withdrawal to ${methodDetails}`
      };

      return {
        ...prev,
        availableBalance: newAvailable,
        payoutHistory: [payoutRecord, ...(prev.payoutHistory || [])],
        ledgerTransactions: [newLedgerTx, ...(prev.ledgerTransactions || [])]
      };
    });

    return payoutRecord;
  };

  const recordInfluencerCommission = (couponCode, bookingAmount, customerName, tripTitle) => {
    const commission = Math.round(Number(bookingAmount) * 0.1);
    const bookingId = 'WL-' + Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toISOString().split('T')[0];

    const newLedgerTx = {
      id: 'tx_' + Date.now(),
      bookingId: bookingId,
      type: 'Commission Pending',
      amount: commission,
      date: dateStr,
      status: 'Pending Settlement',
      reference: `Attributed Booking ${bookingId} (${tripTitle})`
    };

    setUser((prev) => {
      if (!prev || prev.role !== 'influencer') return prev;
      
      const updatedCoupons = (prev.influencerCoupons || []).map(c => {
        if (c.code === couponCode) {
          return {
            ...c,
            totalRedemptions: (c.totalRedemptions || 0) + 1,
            revenueGenerated: (c.revenueGenerated || 0) + Number(bookingAmount),
            commissionEarned: (c.commissionEarned || 0) + commission
          };
        }
        return c;
      });

      return {
        ...prev,
        pendingBalance: (prev.pendingBalance || 0) + commission,
        totalEarnings: (prev.totalEarnings || 0) + commission,
        influencerCoupons: updatedCoupons,
        ledgerTransactions: [newLedgerTx, ...(prev.ledgerTransactions || [])]
      };
    });
  };

  const adminApprovePayout = (payoutId) => {
    setAllPayoutRequests((prev) =>
      prev.map((po) => po.id === payoutId ? { ...po, status: 'Paid Out' } : po)
    );

    setUser((prev) => {
      if (!prev) return prev;
      const updatedPayouts = (prev.payoutHistory || []).map((po) =>
        po.id === payoutId ? { ...po, status: 'Approved & Paid' } : po
      );
      const updatedLedger = (prev.ledgerTransactions || []).map((tx) =>
        tx.bookingId === payoutId ? { ...tx, status: 'Paid Out' } : tx
      );
      return {
        ...prev,
        payoutHistory: updatedPayouts,
        ledgerTransactions: updatedLedger,
        totalWithdrawn: (prev.totalWithdrawn || 0) + 18500
      };
    });
  };

  const adminTogglePlanEligibility = (planId) => {
    setEligiblePlans((prev) =>
      prev.map((p) => p.id === planId ? { ...p, status: p.status === 'Approved & Active' ? 'Paused' : 'Approved & Active' } : p)
    );
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
        adminLogin,
        influencerLogin,
        signup,
        logout,
        updateProfile,
        addBooking,
        cancelBooking,
        eligiblePlans,
        generatePlanCoupon,
        requestPayoutWithdrawal,
        recordInfluencerCommission,
        allPayoutRequests,
        adminApprovePayout,
        adminTogglePlanEligibility,
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
