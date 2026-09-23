import assert from 'node:assert';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  verifyCheckoutSignature, 
  verifyWebhookSignature 
} from './services/razorpayService.js';
import { getRazorpayConfig, validateRuntimeConfig } from './config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('\n======================================================');
console.log('🧪 RUNNING WANDERLUXE PAYMENT RELIABILITY TEST SUITE');
console.log('======================================================\n');

let passedTests = 0;
let failedTests = 0;

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
};

// 1. Config Validation Tests
await test('Razorpay Config extracts valid credentials and detects mode', () => {
  const config = getRazorpayConfig();
  assert.ok(config.keyId, 'Expected keyId to exist');
  assert.ok(config.keySecret, 'Expected keySecret to exist');
  assert.strictEqual(config.mode, 'test', 'Expected mode to be "test"');
  assert.ok(config.isConfigured, 'Expected isConfigured to be true');
});

await test('validateRuntimeConfig enforces Razorpay keys without throwing on valid setup', () => {
  assert.doesNotThrow(() => validateRuntimeConfig());
});

// 2. Checkout HMAC Signature Verification Tests
await test('verifyCheckoutSignature validates correct HMAC-SHA256 signature', () => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const orderId = 'order_test_123456';
  const paymentId = 'pay_test_789012';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const isValid = verifyCheckoutSignature({
    orderId,
    paymentId,
    signature: expectedSignature
  });
  assert.strictEqual(isValid, true, 'Valid checkout signature must verify true');
});

await test('verifyCheckoutSignature rejects tampered or forged signature', () => {
  const orderId = 'order_test_123456';
  const paymentId = 'pay_test_789012';
  const forgedSignature = '0000000000000000000000000000000000000000000000000000000000000000';

  const isValid = verifyCheckoutSignature({
    orderId,
    paymentId,
    signature: forgedSignature
  });
  assert.strictEqual(isValid, false, 'Forged checkout signature must verify false');
});

await test('verifyCheckoutSignature safely rejects missing or malformed inputs', () => {
  assert.strictEqual(verifyCheckoutSignature(null), false);
  assert.strictEqual(verifyCheckoutSignature({ orderId: '123' }), false);
  assert.strictEqual(verifyCheckoutSignature({ orderId: '123', paymentId: '456', signature: '' }), false);
});

// 3. Webhook HMAC Signature Verification Tests
await test('verifyWebhookSignature validates genuine webhook payload with raw buffer', () => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret_key_123';
  const payloadBody = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_999888',
          order_id: 'order_test_777666',
          amount: 500000,
          currency: 'INR',
          status: 'captured'
        }
      }
    }
  });
  const rawBodyBuffer = Buffer.from(payloadBody, 'utf8');
  const validSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBodyBuffer)
    .digest('hex');

  const isValid = verifyWebhookSignature({
    rawBody: rawBodyBuffer,
    signature: validSignature,
    webhookSecret
  });
  assert.strictEqual(isValid, true, 'Valid webhook raw body must verify true');
});

await test('verifyWebhookSignature rejects tampered webhook payload body', () => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret_key_123';
  const rawBodyBuffer = Buffer.from('{"tampered":true}', 'utf8');
  const forgedSignature = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  const isValid = verifyWebhookSignature({
    rawBody: rawBodyBuffer,
    signature: forgedSignature,
    webhookSecret
  });
  assert.strictEqual(isValid, false, 'Tampered webhook payload must verify false');
});

// 4. Payment Finalizer In-Memory Logic Tests
await test('finalizeBookingPayment prevents duplicate entries for same paymentId', async () => {
  // Mock booking object
  const mockBooking = {
    bookingId: 'WLX-TEST-001',
    pricing: {
      finalAmount: 10000,
      amountPaid: 0,
      amountOutstanding: 10000
    },
    paymentPlan: { type: 'FULL' },
    payment: { status: 'PENDING' },
    qrCode: { dataUrl: '' },
    payments: [],
    save: async function() { return this; }
  };

  // Dynamically import finalizeBookingPayment
  const { finalizeBookingPayment } = await import('./services/bookingPaymentService.js');

  const result1 = await finalizeBookingPayment({
    booking: mockBooking,
    orderId: 'order_111',
    paymentId: 'pay_111',
    amount: 10000,
    type: 'FULL',
    verifiedAt: new Date(),
    source: 'unit_test'
  });

  assert.strictEqual(result1.success, true);
  assert.strictEqual(result1.alreadyFinalized, false);
  assert.strictEqual(mockBooking.payments.length, 1);
  assert.strictEqual(mockBooking.bookingStatus, 'CONFIRMED');
  assert.strictEqual(mockBooking.paymentStatus, 'PAID');
  assert.strictEqual(mockBooking.pricing.amountOutstanding, 0);

  // Second call with identical paymentId
  const result2 = await finalizeBookingPayment({
    booking: mockBooking,
    orderId: 'order_111',
    paymentId: 'pay_111',
    amount: 10000,
    type: 'FULL',
    verifiedAt: new Date(),
    source: 'unit_test_replay'
  });

  assert.strictEqual(result2.success, true);
  assert.strictEqual(result2.alreadyFinalized, true);
  assert.strictEqual(mockBooking.payments.length, 1, 'Payments ledger must not duplicate event');
});

await test('finalizeBookingPayment handles deposit followed by balance payment', async () => {
  const mockBooking = {
    bookingId: 'WLX-TEST-002',
    pricing: {
      finalAmount: 20000,
      amountPaid: 0,
      amountOutstanding: 20000
    },
    paymentPlan: { type: 'PARTIAL', depositPercent: 10 },
    payment: { status: 'PENDING' },
    qrCode: { dataUrl: '' },
    payments: [],
    save: async function() { return this; }
  };

  const { finalizeBookingPayment } = await import('./services/bookingPaymentService.js');

  // 1. Deposit Payment (₹2,000)
  const depositResult = await finalizeBookingPayment({
    booking: mockBooking,
    orderId: 'order_dep_1',
    paymentId: 'pay_dep_1',
    amount: 2000,
    type: 'DEPOSIT',
    source: 'test'
  });

  assert.strictEqual(depositResult.success, true);
  assert.strictEqual(mockBooking.bookingStatus, 'PROVISIONALLY_CONFIRMED');
  assert.strictEqual(mockBooking.paymentStatus, 'PARTIALLY_PAID');
  assert.strictEqual(mockBooking.pricing.amountPaid, 2000);
  assert.strictEqual(mockBooking.pricing.amountOutstanding, 18000);
  assert.strictEqual(mockBooking.payments.length, 1);

  // 2. Balance Payment (₹18,000)
  const balanceResult = await finalizeBookingPayment({
    booking: mockBooking,
    orderId: 'order_bal_1',
    paymentId: 'pay_bal_1',
    amount: 18000,
    type: 'BALANCE',
    source: 'test'
  });

  assert.strictEqual(balanceResult.success, true);
  assert.strictEqual(mockBooking.bookingStatus, 'CONFIRMED');
  assert.strictEqual(mockBooking.paymentStatus, 'PAID');
  assert.strictEqual(mockBooking.pricing.amountPaid, 20000);
  assert.strictEqual(mockBooking.pricing.amountOutstanding, 0);
  assert.strictEqual(mockBooking.payments.length, 2);
  assert.ok(mockBooking.qrCode.dataUrl.length > 0, 'Boarding QR code should be generated on full balance payment');
});

console.log('\n======================================================');
console.log(`TEST RESULTS: ${passedTests} passed, ${failedTests} failed`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
