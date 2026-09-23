import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getRazorpayConfig } from '../config/environment.js';

let cachedClient = null;
let cachedKeyId = null;

export const getRazorpayClient = () => {
  const config = getRazorpayConfig();
  if (!config.isConfigured) {
    const error = new Error('Razorpay payment gateway is not configured on this server.');
    error.status = 503;
    throw error;
  }

  if (!cachedClient || cachedKeyId !== config.keyId) {
    cachedClient = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret
    });
    cachedKeyId = config.keyId;
  }

  return cachedClient;
};

export const createRazorpayOrder = async ({ amountPaise, currency = 'INR', receipt, notes = {} }) => {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error(`Invalid order amount in paise: ${amountPaise}. Expected positive integer.`);
  }

  const client = getRazorpayClient();
  const orderPayload = {
    amount: amountPaise,
    currency,
    receipt: String(receipt || '').slice(0, 40),
    notes
  };

  return client.orders.create(orderPayload);
};

export const fetchRazorpayPayment = async (paymentId) => {
  if (!paymentId) throw new Error('paymentId is required to fetch Razorpay payment.');
  const client = getRazorpayClient();
  return client.payments.fetch(paymentId);
};

export const fetchRazorpayOrder = async (orderId) => {
  if (!orderId) throw new Error('orderId is required to fetch Razorpay order.');
  const client = getRazorpayClient();
  return client.orders.fetch(orderId);
};

export const fetchOrderPayments = async (orderId) => {
  if (!orderId) throw new Error('orderId is required to fetch Razorpay order payments.');
  const client = getRazorpayClient();
  return client.orders.fetchPayments(orderId);
};

export const verifyCheckoutSignature = (params = {}) => {
  const { orderId, paymentId, signature } = params || {};
  const config = getRazorpayConfig();
  if (!config.keySecret) {
    const error = new Error('Razorpay secret is not configured on server.');
    error.status = 503;
    throw error;
  }
  if (!orderId || !paymentId || !signature) return false;

  try {
    const expected = crypto
      .createHmac('sha256', config.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest();
    const received = Buffer.from(String(signature), 'hex');
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  } catch (err) {
    return false;
  }
};

export const verifyWebhookSignature = (params = {}) => {
  const { rawBody, signature, secret } = params || {};
  const config = getRazorpayConfig();
  const webhookSecret = String(secret || config.webhookSecret || '').trim();
  if (!webhookSecret) {
    const error = new Error('Razorpay webhook secret is not configured.');
    error.status = 503;
    throw error;
  }
  if (!rawBody || !signature) return false;

  try {
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody))
      .digest();
    const received = Buffer.from(String(signature), 'hex');
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  } catch (err) {
    return false;
  }
};

export const testCredentialConnectivity = async () => {
  const config = getRazorpayConfig();
  if (!config.isConfigured) {
    return {
      authenticated: false,
      configured: false,
      mode: 'unconfigured',
      message: 'Razorpay keys are missing from environment.'
    };
  }

  if (config.mode !== 'test') {
    throw new Error('Credential automated test is restricted to TEST mode only.');
  }

  const client = getRazorpayClient();
  // Safe read-only authenticated API call
  const orders = await client.orders.all({ count: 1 });
  return {
    authenticated: true,
    configured: true,
    mode: 'test',
    keyIdPrefix: `${config.keyId.substring(0, 12)}...`,
    ordersEntity: orders?.entity || 'collection'
  };
};
