import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import influencerRoutes from './routes/influencerRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import seoRoutes from './routes/seoRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import aiItineraryRoutes from './routes/aiItineraryRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import pricingRuleRoutes from './routes/pricingRuleRoutes.js';
import followUpRoutes from './routes/followUpRoutes.js';
import marketingRoutes from './routes/marketingRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import operationsRoutes from './routes/operationsRoutes.js';
import { razorpayWebhookHandler } from './controllers/webhookController.js';
import { getAllowedOrigins, validateRuntimeConfig } from './config/environment.js';

const environment = process.env.NODE_ENV || 'development';

try {
  validateRuntimeConfig();
  if (environment === 'production') await connectDB();
} catch (error) {
  console.error(`Startup validation failed: ${error.message}`);
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
const allowedOrigins = getAllowedOrigins();
const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === 'true';

// Dynamic CORS Middleware: Supports Localhost, Vercel Production/Preview, and Custom Domains
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    // Localhost is a development convenience, never a production CORS origin.
    if (environment !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (allowVercelPreviews && /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin is not allowed by CORS policy.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Razorpay Webhook (must receive unparsed raw Buffer for HMAC-SHA256 signature verification)
app.post(
  '/api/payments/razorpay/webhook',
  express.raw({ type: 'application/json' }),
  razorpayWebhookHandler
);

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Dedicated Production Health Check Endpoints (For Render / Monitoring)
const healthPayload = () => ({
  status: 'ok',
  environment,
  databaseConnected: mongoose.connection.readyState === 1,
  timestamp: new Date().toISOString()
});

app.get(['/health', '/api/health'], (req, res) => res.status(200).json(healthPayload()));
app.get('/api/readiness', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ...healthPayload(), status: ready ? 'ready' : 'not_ready' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/influencer', influencerRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiItineraryRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/pricing-rules', pricingRuleRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/operations', operationsRoutes);


// Public Sitemap & Robots.txt Direct Access
app.use('/sitemap.xml', seoRoutes);
app.use('/robots.txt', seoRoutes);

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'WanderLuxe REST API Server is Active 🚀',
    docs: '/api/trips',
    health: '/health'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message === 'Origin is not allowed by CORS policy.') {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error('Unhandled Server Error:', environment === 'production' ? err.message : err.stack);
  res.status(500).json({
    success: false,
    message: environment === 'production' ? 'Internal Server Error' : (err.message || 'Internal Server Error')
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 WanderLuxe Backend Server running on port ${PORT} in ${environment} mode`);
  if (environment !== 'production') {
    void connectDB().catch((error) => console.error(`Development database connection failed: ${error.message}`));
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another running process.`);
    console.error(`💡 Tip: Close existing node processes or change PORT in backend/.env`);
  } else {
    console.error('Server Listener Error:', error);
  }
});
