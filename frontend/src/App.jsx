import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
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
import AdminLogin from './pages/AdminLogin';
import RoleProtectedRoute from './components/RoleProtectedRoute';
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
import NotFound from './pages/NotFound';
import PlaceholderPage from './pages/PlaceholderPage';
import AIPlannerPage from './pages/AIPlannerPage';
import ScrollToTop from './components/ScrollToTop';
import StaffShell from './staff/StaffShell';
import StaffOverview from './staff/StaffOverview';
import StaffModuleRoute from './staff/components/StaffModuleRoute';
import AdminWorkspace from './staff/workspaces/AdminWorkspace';
import ManagementOverview from './staff/modules/management/ManagementOverview';
import CampaignsWorkspace from './staff/modules/management/campaigns/CampaignsWorkspace';
import CampaignEditor from './staff/modules/management/campaigns/CampaignEditor';
import BannersWorkspace from './staff/modules/management/banners/BannersWorkspace';
import BannerEditor from './staff/modules/management/banners/BannerEditor';
import SalesOverview from './staff/modules/sales/SalesOverview';
import ExpertRequestsWorkspace from './staff/modules/sales/ExpertRequestsWorkspace';
import QuotationsWorkspace from './staff/modules/sales/quotations/QuotationsWorkspace';
import QuotationBuilderPage from './staff/modules/sales/quotations/QuotationBuilderPage';
import QuotationDetailPage from './staff/modules/sales/quotations/QuotationDetailPage';
import SalesBookingsWorkspace from './staff/modules/sales/bookings/SalesBookingsWorkspace';
import SalesBookingDetail from './staff/modules/sales/bookings/SalesBookingDetail';
import TripsWorkspace from './staff/modules/admin/trips/TripsWorkspace';
import TripEditor from './staff/modules/admin/trips/TripEditor';
import AdminBookingsWorkspace from './staff/modules/admin/bookings/AdminBookingsWorkspace';
import AdminBookingDetail from './staff/modules/admin/bookings/AdminBookingDetail';
import MediaWorkspace from './staff/modules/admin/media/MediaWorkspace';
import PagesWorkspace from './staff/modules/admin/pages/PagesWorkspace';
import PageEditor from './staff/modules/admin/pages/PageEditor';
import UsersWorkspace from './staff/modules/admin/users/UsersWorkspace';
import UserDetail from './staff/modules/admin/users/UserDetail';
import CreatorApplicationsWorkspace from './staff/modules/admin/creators/CreatorApplicationsWorkspace';
import CreatorApplicationDetail from './staff/modules/admin/creators/CreatorApplicationDetail';
import PayoutsWorkspace from './staff/modules/admin/payouts/PayoutsWorkspace';
import PayoutDetail from './staff/modules/admin/payouts/PayoutDetail';
import DiscountsWorkspace from './staff/modules/admin/discounts/DiscountsWorkspace';

const LegacyQuotationRedirect = ({ edit = false }) => {
  const { id, quoteId } = useParams();
  const quotationId = id || quoteId;
  return <Navigate to={`/staff/sales/quotations/${quotationId}${edit ? '/edit' : ''}`} replace />;
};

const LegacyAdminBookingRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/staff/admin/bookings/${encodeURIComponent(id)}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/staff/login" element={<AdminLogin />} />
          <Route path="/admin/login" element={<Navigate to="/staff/login" replace />} />
          <Route path="/admin" element={<Navigate to="/staff/admin" replace />} />
          <Route path="/admin/sales" element={<Navigate to="/staff/sales" replace />} />
          <Route path="/admin/quotations" element={<Navigate to="/staff/sales/quotations" replace />} />
          <Route path="/admin/quotations/:id" element={<LegacyQuotationRedirect />} />
          <Route path="/admin/quotations/:quoteId/edit" element={<LegacyQuotationRedirect edit />} />
          <Route path="/admin/bookings/:id" element={<LegacyAdminBookingRedirect />} />

          {/* Canonical unified Staff Control Center */}
          <Route path="/staff" element={
            <RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'sales', 'marketing']}>
              <StaffShell />
            </RoleProtectedRoute>
          }>
            <Route index element={<StaffOverview />} />
            <Route path="admin" element={
              <StaffModuleRoute moduleId="admin">
                <AdminWorkspace />
              </StaffModuleRoute>
            } />
            <Route path="admin/trips" element={
              <StaffModuleRoute moduleId="trips"><TripsWorkspace /></StaffModuleRoute>
            } />
            <Route path="admin/trips/new" element={
              <StaffModuleRoute moduleId="trips"><TripEditor /></StaffModuleRoute>
            } />
            <Route path="admin/trips/:id/edit" element={
              <StaffModuleRoute moduleId="trips"><TripEditor /></StaffModuleRoute>
            } />
            <Route path="admin/bookings" element={
              <StaffModuleRoute moduleId="admin_bookings"><AdminBookingsWorkspace /></StaffModuleRoute>
            } />
            <Route path="admin/bookings/:id" element={
              <StaffModuleRoute moduleId="admin_bookings"><AdminBookingDetail /></StaffModuleRoute>
            } />
            <Route path="admin/media" element={
              <StaffModuleRoute moduleId="admin_media"><MediaWorkspace /></StaffModuleRoute>
            } />
            <Route path="admin/pages" element={
              <StaffModuleRoute moduleId="admin_pages"><PagesWorkspace /></StaffModuleRoute>
            } />
            <Route path="admin/pages/new" element={
              <StaffModuleRoute moduleId="admin_pages"><PageEditor /></StaffModuleRoute>
            } />
            <Route path="admin/pages/:id/edit" element={
              <StaffModuleRoute moduleId="admin_pages"><PageEditor /></StaffModuleRoute>
            } />
            <Route path="admin/users" element={
              <StaffModuleRoute moduleId="admin_users"><UsersWorkspace /></StaffModuleRoute>
            } />
            <Route path="admin/users/:id" element={
              <StaffModuleRoute moduleId="admin_users"><UserDetail /></StaffModuleRoute>
            } />
            <Route path="admin/creators" element={
              <StaffModuleRoute moduleId="admin_creators"><CreatorApplicationsWorkspace /></StaffModuleRoute>
            } />
            <Route path="admin/creators/:id" element={
              <StaffModuleRoute moduleId="admin_creators"><CreatorApplicationDetail /></StaffModuleRoute>
            } />
            <Route path="admin/payouts" element={
              <StaffModuleRoute moduleId="admin_payouts"><PayoutsWorkspace /></StaffModuleRoute>
            } />
            <Route path="admin/payouts/:id" element={
              <StaffModuleRoute moduleId="admin_payouts"><PayoutDetail /></StaffModuleRoute>
            } />
            <Route path="admin/discounts" element={
              <StaffModuleRoute moduleId="admin_discounts"><DiscountsWorkspace /></StaffModuleRoute>
            } />
            <Route path="sales" element={
              <StaffModuleRoute moduleId="sales">
                <SalesOverview />
              </StaffModuleRoute>
            } />
            <Route path="sales/expert-requests" element={
              <StaffModuleRoute moduleId="expert_requests">
                <ExpertRequestsWorkspace />
              </StaffModuleRoute>
            } />
            <Route path="sales/quotations" element={
              <StaffModuleRoute moduleId="quotations">
                <QuotationsWorkspace />
              </StaffModuleRoute>
            } />
            <Route path="sales/quotations/new" element={
              <StaffModuleRoute moduleId="quotations">
                <QuotationBuilderPage />
              </StaffModuleRoute>
            } />
            <Route path="sales/quotations/:id" element={
              <StaffModuleRoute moduleId="quotations">
                <QuotationDetailPage />
              </StaffModuleRoute>
            } />
            <Route path="sales/quotations/:id/edit" element={
              <StaffModuleRoute moduleId="quotations">
                <QuotationBuilderPage />
              </StaffModuleRoute>
            } />
            <Route path="sales/bookings" element={
              <StaffModuleRoute moduleId="bookings">
                <SalesBookingsWorkspace />
              </StaffModuleRoute>
            } />
            <Route path="sales/bookings/:id" element={
              <StaffModuleRoute moduleId="bookings">
                <SalesBookingDetail />
              </StaffModuleRoute>
            } />
            <Route path="management" element={
              <StaffModuleRoute moduleId="management">
                <ManagementOverview />
              </StaffModuleRoute>
            } />
            <Route path="management/campaigns" element={<StaffModuleRoute moduleId="management_campaigns"><CampaignsWorkspace /></StaffModuleRoute>} />
            <Route path="management/campaigns/new" element={<StaffModuleRoute moduleId="management_campaigns"><CampaignEditor /></StaffModuleRoute>} />
            <Route path="management/campaigns/:id/edit" element={<StaffModuleRoute moduleId="management_campaigns"><CampaignEditor /></StaffModuleRoute>} />
            <Route path="management/banners" element={<StaffModuleRoute moduleId="management_banners"><BannersWorkspace /></StaffModuleRoute>} />
            <Route path="management/banners/new" element={<StaffModuleRoute moduleId="management_banners"><BannerEditor /></StaffModuleRoute>} />
            <Route path="management/banners/:id/edit" element={<StaffModuleRoute moduleId="management_banners"><BannerEditor /></StaffModuleRoute>} />
          </Route>

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
            
            {/* Legacy deep Admin routes remain compatible until their modules are extracted. */}
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
