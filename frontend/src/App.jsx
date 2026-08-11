import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TripDetails from './pages/TripDetails';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Destinations from './pages/Destinations';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminRoute from './components/AdminRoute';
import InfluencerDashboard from './pages/InfluencerDashboard';
import InfluencerLogin from './pages/InfluencerLogin';
import InfluencerRoute from './components/InfluencerRoute';
import CreatorTrip from './pages/CreatorTrip';
import CreatorStorefront from './pages/CreatorStorefront';
import NotFound from './pages/NotFound';
import PlaceholderPage from './pages/PlaceholderPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="trip/:id" element={<TripDetails />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="influencer/login" element={<InfluencerLogin />} />
            <Route path="influencer" element={
              <InfluencerRoute>
                <InfluencerDashboard />
              </InfluencerRoute>
            } />
            <Route path="creator/:username" element={<CreatorStorefront />} />
            <Route path="creators/:username" element={<CreatorStorefront />} />
            <Route path="creators/:username/:tripSlug" element={<CreatorTrip />} />
            <Route path="destinations" element={<Destinations />} />
            <Route path="domestic" element={<Destinations />} />
            <Route path="international" element={<Destinations />} />
            <Route path="community-trips" element={<Destinations />} />
            <Route path="weekend-trips" element={<Destinations />} />
            <Route path="fixed-departures" element={<Destinations />} />
            <Route path="custom-trip" element={<Contact />} />
            <Route path="contact" element={<Contact />} />
            <Route path="blog" element={<Blog />} />
            <Route path="about" element={<About />} />
            <Route path="privacy" element={<PlaceholderPage />} />
            <Route path="terms" element={<PlaceholderPage />} />
            <Route path="cancellation" element={<PlaceholderPage />} />
            <Route path="faq" element={<PlaceholderPage />} />
            
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
