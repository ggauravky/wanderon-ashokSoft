import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getMeApi, updateProfileApi, addBookingApi, cancelBookingApi } from '../services/api';

const AuthContext = createContext();

const ADMIN_USER_TEMPLATE = {
  id: 'usr_admin',
  name: 'Gaurav Kumar Yadav (Admin)',
  email: 'gaurav99@gmail.com',
  phone: '8542036499',
  address: 'Lucknow, UP, India',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  role: 'admin',
  joinedDate: 'August 2026',
  wanderCoins: 5000,
  bookedTrips: []
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
          const isAdmin = userData.email?.toLowerCase() === 'gaurav99@gmail.com' || userData.role === 'admin';
          setUser({ ...userData, role: isAdmin ? 'admin' : 'user', wanderCoins: userData.wanderCoins || 1250 });
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
    const isAdminEmail = cleanEmail === 'gaurav99@gmail.com';

    try {
      const data = await loginApi({ email: cleanEmail, password });
      if (data.token) {
        localStorage.setItem('wanderluxe_token', data.token);
      }
      const fullUser = { ...data, role: isAdminEmail ? 'admin' : (data.role || 'user'), wanderCoins: 1250 };
      setUser(fullUser);
      return { success: true, user: fullUser };
    } catch (error) {
      console.warn('Backend offline, logging in locally:', error.message);
      const fallbackUser = isAdminEmail ? ADMIN_USER_TEMPLATE : {
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

    if (cleanEmail !== 'gaurav99@gmail.com') {
      throw new Error('Access Denied: Only authorized admin email gaurav99@gmail.com can log in.');
    }

    if (password !== 'gaurav@99' && password !== 'password123') {
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
      setUser(ADMIN_USER_TEMPLATE);
      return { success: true, user: ADMIN_USER_TEMPLATE };
    }
  };

  const signup = async (name, email, phone, password) => {
    try {
      const data = await registerApi({ name, email, phone, password });
      if (data.token) {
        localStorage.setItem('wanderluxe_token', data.token);
      }
      const fullUser = { ...data, role: email.toLowerCase().trim() === 'gaurav99@gmail.com' ? 'admin' : 'user', wanderCoins: 500 };
      setUser(fullUser);
      return { success: true, user: fullUser };
    } catch (error) {
      console.warn('Backend offline, signing up locally:', error.message);
      const newUser = {
        id: 'usr_' + Date.now(),
        name: name || 'Gaurav Kumar Yadav',
        email: email || 'kumar.gaurav.yadav2007@gmail.com',
        phone: phone || '8542036499',
        address: 'Lucknow, UP, India',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || 'gaurav'}`,
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
        demoLogin,
        signup,
        logout,
        updateProfile,
        addBooking,
        cancelBooking
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
