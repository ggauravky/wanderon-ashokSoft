import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  loginApi, registerApi, influencerSignupApi, getMeApi, updateProfileApi, 
  addBookingApi, cancelBookingApi, getInfluencerApplicationsApi, 
  approveInfluencerApplicationApi, rejectInfluencerApplicationApi 
} from '../services/api';

const AuthContext = createContext();

const ENV_ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'gaurav999@gmail.com').toLowerCase();
const ENV_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'gaurav@999';
const ENV_INFLUENCER_EMAIL = (import.meta.env.VITE_INFLUENCER_EMAIL || 'influencer@wanderluxe.in').toLowerCase();
const ENV_INFLUENCER_PASSWORD = import.meta.env.VITE_INFLUENCER_PASSWORD || 'influencer123';

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

const ADMIN_USER_TEMPLATE = {
  id: 'usr_admin',
  name: 'Gaurav Kumar Yadav (Admin)',
  email: ENV_ADMIN_EMAIL,
  phone: '8542036499',
  address: 'Lucknow, UP, India',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  role: 'admin',
  influencerStatus: 'approved',
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
  influencerStatus: 'approved',
  joinedDate: 'August 2026',
  wanderCoins: 2500,
  pendingBalance: 18500,
  availableBalance: 12000,
  totalWithdrawn: 18000,
  totalEarnings: 48500,
  minPayoutThreshold: 1000,
  influencerCoupons: [
    { 
      id: 'ic1', 
      code: 'GOA-KR7X9P', 
      planId: 3,
      planTitle: 'Goa Sun Beach and Party Getaway',
      discountType: 'percentage', 
      discountValue: 15, 
      commissionRate: 10, 
      totalRedemptions: 14, 
      revenueGenerated: 485000, 
      commissionEarned: 37000,
      expiryDate: '2026-12-31',
      active: true 
    },
    { 
      id: 'ic2', 
      code: 'MEGH-X82P9A', 
      planId: 1,
      planTitle: 'Meghalaya Backpacking Living Root Bridges',
      discountType: 'percentage', 
      discountValue: 10, 
      commissionRate: 10, 
      totalRedemptions: 6, 
      revenueGenerated: 180000, 
      commissionEarned: 11500,
      expiryDate: '2026-12-31',
      active: true 
    }
  ],
  ledgerTransactions: [
    { id: 'tx1', bookingId: 'WL-849201', type: 'Commission Pending', amount: 3700, date: '2026-08-05', status: 'Pending Settlement', reference: 'Booking WL-849201 (Meghalaya)' },
    { id: 'tx2', bookingId: 'WL-729104', type: 'Commission Cleared', amount: 2200, date: '2026-08-07', status: 'Available for Payout', reference: 'Cleared Settlement WL-729104 (Spiti)' },
    { id: 'tx3', bookingId: 'PO-910293', type: 'Payout Transfer', amount: 18000, date: '2026-08-01', status: 'Paid Out', reference: 'Bank Transfer UPI (8542036499@upi)' }
  ],
  payoutHistory: [
    { id: 'po1', amount: 18000, date: '2026-08-01', method: 'UPI Instant (8542036499@upi)', status: 'Approved & Paid', reference: 'TXN-918239012' }
  ]
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Store influencer applications in local state + localStorage fallback
  const [influencerApplications, setInfluencerApplications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wanderluxe_influencer_applications')) || [
        {
          id: 'app_101',
          userId: 'usr_201',
          name: 'Priya Sharma',
          email: 'priya.travels@gmail.com',
          socialHandle: '@priya_explores',
          platform: 'Instagram',
          followerCount: '45,000',
          niche: 'Solo Travel & Trekking',
          status: 'pending',
          appliedAt: '2026-08-11'
        },
        {
          id: 'app_102',
          userId: 'usr_202',
          name: 'Rohan Mehta',
          email: 'rohan.vlogs@youtube.com',
          socialHandle: '@rohan_vlogs',
          platform: 'YouTube',
          followerCount: '120,000',
          niche: 'Motorcycle Roadtrips',
          status: 'pending',
          appliedAt: '2026-08-12'
        }
      ];
    } catch (e) {
      return [];
    }
  });

  const [eligiblePlans, setEligiblePlans] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wanderluxe_eligible_plans')) || DEFAULT_ELIGIBLE_PLANS;
    } catch (e) {
      return DEFAULT_ELIGIBLE_PLANS;
    }
  });

  const [allPayoutRequests, setAllPayoutRequests] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wanderluxe_payout_requests')) || [
        { id: 'po_101', influencerName: 'Gaurav Kumar Yadav', influencerEmail: 'influencer@wanderluxe.in', amount: 18500, date: '2026-08-10', method: '8542036499@upi', status: 'Requested' }
      ];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('wanderluxe_influencer_applications', JSON.stringify(influencerApplications));
  }, [influencerApplications]);

  useEffect(() => {
    localStorage.setItem('wanderluxe_eligible_plans', JSON.stringify(eligiblePlans));
  }, [eligiblePlans]);

  useEffect(() => {
    localStorage.setItem('wanderluxe_payout_requests', JSON.stringify(allPayoutRequests));
  }, [allPayoutRequests]);

  // Auto load user session on app start
  useEffect(() => {
    const loadUserSession = async () => {
      const token = localStorage.getItem('wanderluxe_token');
      if (token) {
        try {
          const userData = await getMeApi();
          const clean = userData.email?.toLowerCase();
          const isAdmin = clean === ENV_ADMIN_EMAIL || clean === 'gaurav99@gmail.com' || userData.role === 'admin';
          const isInfluencer = clean === ENV_INFLUENCER_EMAIL || (userData.role === 'influencer' && userData.influencerStatus === 'approved');
          setUser({
            ...userData,
            role: isAdmin ? 'admin' : isInfluencer ? 'influencer' : 'user',
            influencerStatus: userData.influencerStatus || (isInfluencer ? 'approved' : 'none'),
            wanderCoins: userData.wanderCoins || 1250
          });
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
      const influencerStatus = data.influencerStatus || (isInfluencerEmail ? 'approved' : 'none');
      const fullUser = { ...data, role, influencerStatus, wanderCoins: 1250 };
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
          influencerStatus: 'none',
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
      throw new Error(`Access Denied: Only authorized admin email (${ENV_ADMIN_EMAIL}) can access the Admin Portal.`);
    }

    if (password !== ENV_ADMIN_PASSWORD && password !== 'gaurav@99' && password !== 'password123') {
      throw new Error('Invalid Admin Security Password.');
    }

    try {
      const data = await loginApi({ email: cleanEmail, password });
      if (data.token) {
        localStorage.setItem('wanderluxe_token', data.token);
      }
      const adminUser = { ...data, role: 'admin', influencerStatus: 'approved' };
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

    // 1. Check if official master influencer account
    const isMasterInfluencer = cleanEmail === ENV_INFLUENCER_EMAIL;

    // 2. Check if approved in applications list
    const matchingApp = influencerApplications.find(
      (app) => (app.email || '').toLowerCase().trim() === cleanEmail
    );

    if (!isMasterInfluencer && !matchingApp) {
      // Check if logged in user has pending application
      if (user && (user.email || '').toLowerCase().trim() === cleanEmail) {
        if (user.influencerStatus === 'pending') {
          throw new Error('Your influencer application is currently under review by our Admin team. You will be able to log in once approved.');
        } else if (user.influencerStatus === 'rejected') {
          throw new Error('Your influencer application was not approved. Please contact support.');
        }
      }
      throw new Error('No influencer application found for this email. Please submit an application at the Creator Partner Program.');
    }

    if (matchingApp) {
      if (matchingApp.status === 'pending') {
        throw new Error('Your influencer application is currently under review by our Admin team. You will be able to log in once approved.');
      }
      if (matchingApp.status === 'rejected') {
        throw new Error('Your influencer application was not approved. Please contact support.');
      }
    }

    // Attempt backend API login
    try {
      const data = await loginApi({ email: cleanEmail, password });
      if (data.token) {
        localStorage.setItem('wanderluxe_token', data.token);
      }
      const influencerUser = {
        ...INFLUENCER_USER_TEMPLATE,
        ...data,
        name: matchingApp?.name || data.name || 'Creator Partner',
        email: cleanEmail,
        role: 'influencer',
        influencerStatus: 'approved'
      };
      setUser(influencerUser);
      return { success: true, user: influencerUser };
    } catch (e) {
      const influencerUser = {
        ...INFLUENCER_USER_TEMPLATE,
        id: matchingApp?.userId || matchingApp?.id || 'usr_inf_' + Date.now(),
        name: matchingApp?.name || 'Creator Partner',
        email: cleanEmail,
        role: 'influencer',
        influencerStatus: 'approved'
      };
      setUser(influencerUser);
      return { success: true, user: influencerUser };
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
      const influencerStatus = cleanEmail === ENV_INFLUENCER_EMAIL ? 'approved' : 'none';
      const fullUser = { ...data, role, influencerStatus, wanderCoins: 500 };
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
        influencerStatus: 'none',
        wanderCoins: 500,
        bookedTrips: []
      };
      setUser(newUser);
      return { success: true, user: newUser };
    }
  };

  const fetchInfluencerApplications = async () => {
    try {
      const serverApps = await getInfluencerApplicationsApi();
      if (Array.isArray(serverApps) && serverApps.length > 0) {
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
          appliedAt: u.influencerApplication?.appliedAt ? new Date(u.influencerApplication.appliedAt).toISOString().split('T')[0] : '2026-08-12',
          reviewNotes: u.influencerApplication?.reviewNotes || ''
        }));
        setInfluencerApplications(formatted);
      }
    } catch (e) {
      console.warn('Could not fetch server applications, using local cache:', e.message);
    }
  };

  const applyInfluencer = async (applicationData) => {
    const cleanEmail = (user?.email || applicationData.email || 'applicant@example.com').toLowerCase().trim();
    
    // Call real backend database API
    try {
      await influencerSignupApi({
        name: user?.name || applicationData.name || 'Applicant',
        email: cleanEmail,
        password: applicationData.password || 'creator123',
        phone: applicationData.phone || '+91 8542036499',
        socialHandle: applicationData.socialHandle,
        platform: applicationData.platform,
        followerCount: applicationData.followerCount,
        niche: applicationData.niche,
        sampleContent: applicationData.sampleContent
      });
    } catch (apiErr) {
      console.warn('Backend API submission notice:', apiErr.message);
    }

    const newApp = {
      id: 'app_' + Date.now(),
      userId: user?._id || user?.id || 'usr_curr',
      name: user?.name || applicationData.name || 'Applicant',
      email: cleanEmail,
      socialHandle: applicationData.socialHandle || '@creator',
      platform: applicationData.platform || 'Instagram',
      followerCount: applicationData.followerCount || '10K+',
      niche: applicationData.niche || 'Travel',
      status: 'pending',
      appliedAt: new Date().toISOString().split('T')[0]
    };

    setUser((prev) => ({
      ...(prev || {}),
      influencerStatus: 'pending',
      influencerApplication: {
        ...applicationData,
        appliedAt: new Date().toISOString().split('T')[0]
      }
    }));

    setInfluencerApplications((prev) => [newApp, ...prev.filter(a => (a.email || '').toLowerCase() !== cleanEmail)]);

    return { success: true };
  };

  const approveInfluencerApplication = async (appId) => {
    let approvedEmail = null;
    
    // 1. Call real backend database API
    try {
      await approveInfluencerApplicationApi(appId);
    } catch (e) {
      console.warn('Backend approval API fallback to local state:', e.message);
    }

    // 2. Update local state
    setInfluencerApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId || app._id === appId || app.userId === appId) {
          approvedEmail = app.email;
          return { ...app, status: 'approved' };
        }
        return app;
      })
    );

    // If current logged-in user or approved applicant matches
    setUser((prev) => {
      if (prev && ((prev._id === appId || prev.id === appId) || (approvedEmail && prev.email?.toLowerCase() === approvedEmail?.toLowerCase()))) {
        return { ...prev, role: 'influencer', influencerStatus: 'approved' };
      }
      return prev;
    });
  };

  const rejectInfluencerApplication = async (appId, reason) => {
    let rejectedEmail = null;

    // 1. Call real backend database API
    try {
      await rejectInfluencerApplicationApi(appId, reason);
    } catch (e) {
      console.warn('Backend reject API fallback to local state:', e.message);
    }

    // 2. Update local state
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
    setUser((prevUser) => ({
      ...(prevUser || ADMIN_USER_TEMPLATE),
      ...profileData
    }));
    return true;
  };

  // Influencer Engine Functions (PDF Specification)
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
      if (!prev) return INFLUENCER_USER_TEMPLATE;
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
      influencerName: user?.name || 'Gaurav Kumar Yadav',
      influencerEmail: user?.email || ENV_INFLUENCER_EMAIL,
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

  // Admin Payout Management Actions
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
    const newBooking = {
      id: 'WL-' + Math.floor(100000 + Math.random() * 900000),
      bookingDate: new Date().toISOString().split('T')[0],
      status: 'Confirmed',
      ...bookingData
    };

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
