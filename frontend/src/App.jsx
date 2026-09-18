import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import InfluencerRoute from './components/InfluencerRoute';
import RouteLoader from './components/RouteLoader';
import ScrollToTop from './components/ScrollToTop';
import StaffShell from './staff/StaffShell';
import StaffModuleRoute from './staff/components/StaffModuleRoute';

const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const Signup = lazy(() => import('./pages/Signup'));
const TripDetails = lazy(() => import('./pages/TripDetails'));
const BookingDates = lazy(() => import('./pages/BookingDates'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Profile = lazy(() => import('./pages/Profile'));
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation'));
const BookingVerify = lazy(() => import('./pages/BookingVerify'));
const Destinations = lazy(() => import('./pages/Destinations'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const About = lazy(() => import('./pages/About'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const InfluencerDashboard = lazy(() => import('./pages/InfluencerDashboard'));
const InfluencerLanding = lazy(() => import('./pages/InfluencerLanding'));
const InfluencerSignup = lazy(() => import('./pages/InfluencerSignup'));
const InfluencerLogin = lazy(() => import('./pages/InfluencerLogin'));
const CreatorTrip = lazy(() => import('./pages/CreatorTrip'));
const CreatorStorefront = lazy(() => import('./pages/CreatorStorefront'));
const SharedItinerary = lazy(() => import('./pages/SharedItinerary'));
const DynamicPage = lazy(() => import('./pages/DynamicPage'));
const PublicQuotationView = lazy(() => import('./pages/PublicQuotationGateway'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'));
const AIPlannerPage = lazy(() => import('./pages/AIPlannerPage'));

const StaffOverview = lazy(() => import('./staff/StaffOverview'));
const AdminWorkspace = lazy(() => import('./staff/workspaces/AdminWorkspace'));
const MarketingOverview = lazy(() => import('./staff/modules/marketing/MarketingOverview'));
const CampaignsWorkspace = lazy(() => import('./staff/modules/marketing/campaigns/CampaignsWorkspace'));
const CampaignEditor = lazy(() => import('./staff/modules/marketing/campaigns/CampaignEditor'));
const BannersWorkspace = lazy(() => import('./staff/modules/marketing/banners/BannersWorkspace'));
const BannerEditor = lazy(() => import('./staff/modules/marketing/banners/BannerEditor'));
const SalesOverview = lazy(() => import('./staff/modules/sales/SalesOverview'));
const ExpertRequestsWorkspace = lazy(() => import('./staff/modules/sales/ExpertRequestsWorkspace'));
const QuotationsWorkspace = lazy(() => import('./staff/modules/sales/quotations/QuotationsWorkspace'));
const QuotationBuilderPage = lazy(() => import('./staff/modules/sales/quotations/QuotationBuilderPage'));
const QuotationDetailPage = lazy(() => import('./staff/modules/sales/quotations/QuotationDetailPage'));
const SalesBookingsWorkspace = lazy(() => import('./staff/modules/sales/bookings/SalesBookingsWorkspace'));
const SalesBookingDetail = lazy(() => import('./staff/modules/sales/bookings/SalesBookingDetail'));
const TripsWorkspace = lazy(() => import('./staff/modules/admin/trips/TripsWorkspace'));
const TripEditor = lazy(() => import('./staff/modules/admin/trips/TripEditor'));
const AdminBookingsWorkspace = lazy(() => import('./staff/modules/admin/bookings/AdminBookingsWorkspace'));
const AdminBookingDetail = lazy(() => import('./staff/modules/admin/bookings/AdminBookingDetail'));
const MediaWorkspace = lazy(() => import('./staff/modules/admin/media/MediaWorkspace'));
const PagesWorkspace = lazy(() => import('./staff/modules/admin/pages/PagesWorkspace'));
const PageEditor = lazy(() => import('./staff/modules/admin/pages/PageEditor'));
const UsersWorkspace = lazy(() => import('./staff/modules/admin/users/UsersWorkspace'));
const UserDetail = lazy(() => import('./staff/modules/admin/users/UserDetail'));
const CreatorApplicationsWorkspace = lazy(() => import('./staff/modules/admin/creators/CreatorApplicationsWorkspace'));
const CreatorApplicationDetail = lazy(() => import('./staff/modules/admin/creators/CreatorApplicationDetail'));
const PayoutsWorkspace = lazy(() => import('./staff/modules/admin/payouts/PayoutsWorkspace'));
const PayoutDetail = lazy(() => import('./staff/modules/admin/payouts/PayoutDetail'));
const DiscountsWorkspace = lazy(() => import('./staff/modules/admin/discounts/DiscountsWorkspace'));
const TeamAnalyticsWorkspace = lazy(() => import('./staff/modules/admin/teamAnalytics/TeamAnalyticsWorkspace'));

const LegacyQuotationRedirect = ({ edit = false }) => {
  const { id, quoteId } = useParams();
  const quotationId = id || quoteId;
  return <Navigate to={`/staff/sales/quotations/${quotationId}${edit ? '/edit' : ''}`} replace />;
};

const LegacyAdminBookingRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/staff/admin/bookings/${encodeURIComponent(id)}`} replace />;
};

const LegacyMarketingEditorRedirect = ({ entity }) => {
  const { id } = useParams();
  return <Navigate to={`/staff/marketing/${entity}/${encodeURIComponent(id)}/edit`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<RouteLoader />}>
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
            <Route path="admin/team-analytics" element={
              <StaffModuleRoute moduleId="admin_team_analytics"><TeamAnalyticsWorkspace /></StaffModuleRoute>
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
            <Route path="marketing" element={
              <StaffModuleRoute moduleId="marketing">
                <MarketingOverview />
              </StaffModuleRoute>
            } />
            <Route path="marketing/campaigns" element={<StaffModuleRoute moduleId="marketing_campaigns"><CampaignsWorkspace /></StaffModuleRoute>} />
            <Route path="marketing/campaigns/new" element={<StaffModuleRoute moduleId="marketing_campaigns"><CampaignEditor /></StaffModuleRoute>} />
            <Route path="marketing/campaigns/:id/edit" element={<StaffModuleRoute moduleId="marketing_campaigns"><CampaignEditor /></StaffModuleRoute>} />
            <Route path="marketing/banners" element={<StaffModuleRoute moduleId="marketing_banners"><BannersWorkspace /></StaffModuleRoute>} />
            <Route path="marketing/banners/new" element={<StaffModuleRoute moduleId="marketing_banners"><BannerEditor /></StaffModuleRoute>} />
            <Route path="marketing/banners/:id/edit" element={<StaffModuleRoute moduleId="marketing_banners"><BannerEditor /></StaffModuleRoute>} />
            <Route path="management" element={<Navigate to="/staff/marketing" replace />} />
            <Route path="management/campaigns" element={<Navigate to="/staff/marketing/campaigns" replace />} />
            <Route path="management/campaigns/new" element={<Navigate to="/staff/marketing/campaigns/new" replace />} />
            <Route path="management/campaigns/:id/edit" element={<LegacyMarketingEditorRedirect entity="campaigns" />} />
            <Route path="management/banners" element={<Navigate to="/staff/marketing/banners" replace />} />
            <Route path="management/banners/new" element={<Navigate to="/staff/marketing/banners/new" replace />} />
            <Route path="management/banners/:id/edit" element={<LegacyMarketingEditorRedirect entity="banners" />} />
            <Route path="*" element={<Navigate to="/staff" replace />} />
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
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
