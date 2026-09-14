import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TripDetails from './pages/TripDetails';
import BookingDates from './pages/BookingDates';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingVerify from './pages/BookingVerify';
import Destinations from './pages/Destinations';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminRoute from './components/AdminRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import SalesPortal from './pages/SalesPortal';
import InfluencerDashboard from './pages/InfluencerDashboard';
import InfluencerLanding from './pages/InfluencerLanding';
import InfluencerSignup from './pages/InfluencerSignup';
import InfluencerLogin from './pages/InfluencerLogin';
import InfluencerRoute from './components/InfluencerRoute';
import CreatorTrip from './pages/CreatorTrip';
import CreatorStorefront from './pages/CreatorStorefront';
import SharedItinerary from './pages/SharedItinerary';
import DynamicPage from './pages/DynamicPage';
import PublicQuotationView from './pages/PublicQuotationView';
import QuotationDetail from './pages/QuotationDetail';
import NotFound from './pages/NotFound';
import PlaceholderPage from './pages/PlaceholderPage';
import AIPlannerPage from './pages/AIPlannerPage';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="plan" element={<AIPlannerPage />} />
            <Route path="plan/:planId" element={<AIPlannerPage />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="trip/:id" element={<TripDetails />} />
            <Route path="book/:tripSlug" element={<BookingDates />} />
            <Route path="book/:tripSlug/dates" element={<BookingDates />} />
            <Route path="book/:tripSlug/travelers" element={<Checkout />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="booking/confirmation/:bookingId" element={<BookingConfirmation />} />
            <Route path="bookings/:bookingId" element={<BookingConfirmation />} />
            <Route path="booking/verify/:token" element={<BookingVerify />} />
            <Route path="itinerary/shared/:shareToken" element={<SharedItinerary />} />
            <Route path="quotation/:token" element={<PublicQuotationView />} />
            <Route path="quotations/:token" element={<PublicQuotationView />} />
            <Route path="profile" element={<Profile />} />
            
            {/* Staff & Admin Routes */}
            <Route path="admin/login" element={<AdminLogin />} />
            
            {/* Dedicated Sales Portal (Sales & Admin Allowed) */}
            <Route path="admin/sales" element={
              <RoleProtectedRoute allowedRoles={['admin', 'super_admin', 'sales']}>
                <SalesPortal />
              </RoleProtectedRoute>
            } />

            {/* Master Admin Dashboard (Admin & Super Admin ONLY - Sales Strictly Denied) */}
            <Route path="admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="admin/quotations" element={
              <AdminRoute>
                <AdminDashboard defaultTab="quotations" />
              </AdminRoute>
            } />
            <Route path="admin/quotations/:id" element={
              <RoleProtectedRoute allowedRoles={['admin', 'super_admin', 'sales']}>
                <QuotationDetail />
              </RoleProtectedRoute>
            } />
            <Route path="admin/quotations/:quoteId/edit" element={
              <AdminRoute>
                <AdminDashboard defaultTab="quotations" />
              </AdminRoute>
            } />
            <Route path="admin/bookings/:id" element={
              <AdminRoute>
                <AdminDashboard defaultTab="bookings_crm" />
              </AdminRoute>
            } />

            {/* Creator / Influencer Routes */}
            <Route path="influencer/program" element={<InfluencerLanding />} />
            <Route path="influencer/signup" element={<InfluencerSignup />} />
            <Route path="influencer/apply" element={<InfluencerSignup />} />
            <Route path="influencer/login" element={<InfluencerLogin />} />
            <Route path="influencer" element={
              <InfluencerRoute>
                <InfluencerDashboard />
              </InfluencerRoute>
            } />
            
            {/* Creator Storefronts */}
            <Route path="creator/:username" element={<CreatorStorefront />} />
            <Route path="creators/:username" element={<CreatorStorefront />} />
            <Route path="creators/:username/:tripSlug" element={<CreatorTrip />} />
            
            {/* Travel Discovery & Catalog Routes (Phase C1 Unified Listing Engine) */}
            <Route path="destinations" element={<Destinations />} />
            <Route path="destinations/:destinationSlug" element={<Destinations />} />
            <Route path="destinationspage" element={<Destinations />} />
            <Route path="destination" element={<Destinations />} />
            <Route path="packages" element={<Destinations />} />
            <Route path="trips" element={<Destinations />} />
            <Route path="trips/india" element={<Destinations />} />
            <Route path="trips/international" element={<Destinations />} />
            <Route path="trips/:destinationSlug" element={<Destinations />} />
            <Route path="domestic" element={<Destinations />} />
            <Route path="international" element={<Destinations />} />
            <Route path="community-trips" element={<Destinations />} />
            <Route path="group-trips" element={<Destinations />} />
            <Route path="weekend-trips" element={<Destinations />} />
            <Route path="backpacking-trips" element={<Destinations />} />
            <Route path="adventure-treks" element={<Destinations />} />
            <Route path="romantic-escapes" element={<Destinations />} />
            <Route path="culture-heritage" element={<Destinations />} />
            <Route path="fixed-departures" element={<Destinations />} />
            <Route path="custom-trip" element={<Contact />} />
            <Route path="contact" element={<Contact />} />
            <Route path="blog" element={<Blog />} />
            <Route path="about" element={<About />} />
            <Route path="page/:slug" element={<DynamicPage />} />
            <Route path="pages/:slug" element={<DynamicPage />} />
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
