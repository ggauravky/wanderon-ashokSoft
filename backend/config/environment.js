const INSECURE_JWT_SECRETS = new Set([
  'secret',
  'jwt-secret',
  'dev-secret',
  'your-secret-key',
  'wanderluxe-secret',
  'wanderluxe_secure_jwt_secret_key_2026'
]);
let warnedAboutDevelopmentSecret = false;

export const getJwtSecret = () => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret) throw new Error('JWT_SECRET is required. Refusing to start with unsigned or fallback authentication.');
  const insecure = secret.length < 32 || INSECURE_JWT_SECRETS.has(secret.toLowerCase());
  if (insecure && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be a non-default secret containing at least 32 characters.');
  }
  if (insecure && !warnedAboutDevelopmentSecret) {
    console.warn('Development is using a weak JWT_SECRET. Production startup will reject this value.');
    warnedAboutDevelopmentSecret = true;
  }
  return secret;
};

export const getMongoUri = () => String(process.env.MONGODB_URI || process.env.MONGO_URI || '').trim();

export const getRazorpayConfig = () => {
  const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
  const webhookSecret = String(process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();

  const mode = keyId.startsWith('rzp_test_')
    ? 'test'
    : keyId.startsWith('rzp_live_')
      ? 'live'
      : 'unknown';

  return {
    keyId,
    keySecret,
    webhookSecret,
    mode,
    isConfigured: Boolean(keyId && keySecret)
  };
};

export const validateRuntimeConfig = () => {
  getJwtSecret();
  if (process.env.NODE_ENV === 'production' && !getMongoUri()) {
    throw new Error('MONGODB_URI (or MONGO_URI) is required in production.');
  }

  const rzp = getRazorpayConfig();
  if (process.env.NODE_ENV === 'production' || rzp.keyId || rzp.keySecret) {
    if (!rzp.keyId || !rzp.keySecret) {
      const msg = 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required for payment processing.';
      if (process.env.NODE_ENV === 'production') throw new Error(msg);
      else console.warn(`[Razorpay] Warning: ${msg}`);
    } else {
      const isPlaceholder = rzp.keyId.includes('your_public_key') || rzp.keyId.includes('placeholder');
      if (isPlaceholder) {
        throw new Error('RAZORPAY_KEY_ID contains an invalid placeholder value.');
      }
      if (rzp.mode === 'unknown') {
        throw new Error('RAZORPAY_KEY_ID must begin with rzp_test_ or rzp_live_.');
      }
      console.log(`[Razorpay] Configured: ${rzp.mode} mode`);
      console.log(`[Razorpay] Webhook verification: ${rzp.webhookSecret ? 'configured' : 'not configured'}`);
    }
  }
};

export const getAllowedOrigins = () => new Set([
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  ...String(process.env.ALLOWED_ORIGINS || '').split(',')
].map((value) => String(value || '').trim()).filter(Boolean));
