import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
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

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// Dynamic CORS Middleware: Supports Localhost, Vercel Production/Preview, and Custom Domains
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    // Allow any localhost / 127.0.0.1 port
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow any Vercel deployment (*.vercel.app)
    if (/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // Allow configured production frontend URLs
    if (origin === process.env.FRONTEND_URL || origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }

    return callback(null, true); // Permissive fallback to prevent CORS blocks
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Dedicated Production Health Check Endpoints (For Render / Monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'WanderLuxe REST Backend API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'WanderLuxe REST Backend API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString() 
  });
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
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 WanderLuxe Backend Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another running process.`);
    console.error(`💡 Tip: Close existing node processes or change PORT in backend/.env`);
  } else {
    console.error('Server Listener Error:', error);
  }
});
