import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import Coupon from '../models/Coupon.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const printUsage = () => {
  console.log(`
Usage:
  node scripts/inspectBookingPayment.js <bookingId> [--expect=full|deposit|balance]

Options:
  <bookingId>              WanderLuxe booking identifier (e.g. WLX-20260919-ABCD) or Mongo ObjectId
  --expect=<state>         Assert state: 'full', 'deposit', or 'balance'

Examples:
  node scripts/inspectBookingPayment.js WLX-20260919-4821
  node scripts/inspectBookingPayment.js WLX-20260919-4821 --expect=deposit
  node scripts/inspectBookingPayment.js WLX-20260919-4821 --expect=full
`);
};

const run = async () => {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(1);
  }

  let bookingIdArg = null;
  let expectArg = null;

  for (const arg of args) {
    if (arg.startsWith('--expect=')) {
      expectArg = arg.split('=')[1]?.toLowerCase().trim();
    } else if (!arg.startsWith('--')) {
      bookingIdArg = arg.trim();
    }
  }

  if (!bookingIdArg) {
    console.error('❌ Error: Missing bookingId argument.');
    printUsage();
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ Error: MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
  } catch (dbErr) {
    console.error('❌ MongoDB Connection Error:', dbErr.message);
    process.exit(1);
  }

  try {
    const lookup = mongoose.Types.ObjectId.isValid(bookingIdArg)
      ? { $or: [{ _id: bookingIdArg }, { bookingId: bookingIdArg }] }
      : { bookingId: bookingIdArg };

    const booking = await Booking.findOne(lookup).lean();
    if (!booking) {
      console.error(`❌ Booking not found: "${bookingIdArg}"`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('\n======================================================');
    console.log(`🔍 WANDERLUXE BOOKING PAYMENT INSPECTION: ${booking.bookingId}`);
    console.log('======================================================');
    console.log(`• Document ID:        ${booking._id}`);
    console.log(`• Customer:           ${booking.customer?.name} (${booking.customer?.email}, ${booking.customer?.phone})`);
    console.log(`• Trip:               ${booking.tripSnapshot?.title || booking.tripId}`);
    console.log(`• Departure Batch:    ${booking.tripSnapshot?.batchDate || 'N/A'}`);
    console.log(`• Travelers:          ${booking.numberOfTravelers || 1}`);
    console.log(`• Booking Status:     ${booking.bookingStatus}`);
    console.log(`• Payment Status:     ${booking.paymentStatus}`);
    console.log(`• Payment Plan:       ${booking.paymentPlan?.type || 'FULL'} (${booking.paymentPlan?.depositPercent || 10}%)`);
    console.log(`• Balance Due Date:   ${booking.paymentPlan?.balanceDueDate || 'N/A'}`);

    console.log('\n--- PRICING BREAKDOWN ---');
    console.log(`• Base Amount:        ₹${booking.pricing?.baseAmount || 0}`);
    console.log(`• Discount:           ₹${booking.pricing?.discountAmount || 0}`);
    console.log(`• Final Amount:       ₹${booking.pricing?.finalAmount || 0}`);
    console.log(`• Amount Paid:        ₹${booking.pricing?.amountPaid || 0}`);
    console.log(`• Outstanding:        ₹${booking.pricing?.amountOutstanding || 0}`);

    console.log('\n--- PRIMARY GATEWAY REFERENCES ---');
    console.log(`• Razorpay Order ID:  ${booking.payment?.razorpayOrderId || 'N/A'}`);
    console.log(`• Razorpay Payment:   ${booking.payment?.razorpayPaymentId || 'N/A'}`);
    console.log(`• Paid At:            ${booking.payment?.paidAt || 'N/A'}`);
    console.log(`• Pending Bal Order:  ${booking.payment?.pendingBalanceOrderId || 'N/A'}`);

    console.log('\n--- PAYMENTS LEDGER (payments[]) ---');
    const payments = Array.isArray(booking.payments) ? booking.payments : [];
    if (!payments.length) {
      console.log('• (No payment events recorded in ledger)');
    } else {
      payments.forEach((p, idx) => {
        console.log(`  [${idx + 1}] Type: ${p.type} | Amount: ₹${p.amount} | Order: ${p.orderId} | Payment: ${p.paymentId} | VerifiedAt: ${p.verifiedAt}`);
      });
    }

    console.log('\n--- INVENTORY COMMITMENT ---');
    console.log(`• Inventory Committed: ${booking.inventoryCommittedAt ? `YES (${booking.inventoryCommittedAt})` : 'NO / PENDING'}`);
    if (booking.inventoryReleasedAt) {
      console.log(`• Inventory Released:  YES (${booking.inventoryReleasedAt})`);
    }

    // Check batch capacity in DB if trip is linked
    if (booking.tripId) {
      try {
        const trip = await Trip.findOne({
          $or: [
            { _id: mongoose.Types.ObjectId.isValid(booking.tripId) ? booking.tripId : null },
            { slug: String(booking.tripId).toLowerCase() }
          ]
        }).lean();
        if (trip && Array.isArray(trip.batches)) {
          const batch = trip.batches.find(
            (b) =>
              (booking.tripSnapshot?.batchDate && b.dates === booking.tripSnapshot.batchDate) ||
              (booking.batchId && (b.batchId === booking.batchId || String(b._id) === String(booking.batchId)))
          );
          if (batch) {
            console.log(`• Trip Batch Seats:    Booked: ${batch.bookedSeats || 0} / Capacity: ${batch.capacity || 0} (Status: ${batch.status})`);
          }
        }
      } catch (tErr) {
        // ignore
      }
    }

    console.log('\n--- COUPON & COMMISSION ---');
    if (booking.couponRedemption?.code) {
      console.log(`• Coupon Code:        ${booking.couponRedemption.code}`);
      console.log(`• Coupon RecordedAt:  ${booking.couponRedemption.recordedAt || 'PENDING'}`);
    } else {
      console.log('• No coupon applied.');
    }

    console.log('\n--- DOCUMENTS & TOKENS ---');
    console.log(`• Verification Token: ${booking.verificationToken ? 'GENERATED' : 'MISSING'}`);
    console.log(`• QR Code Data URL:   ${booking.qrCode?.dataUrl ? 'ACTIVE' : 'LOCKED / NONE'}`);
    console.log('======================================================\n');

    // Assertions if --expect is set
    if (expectArg) {
      let passed = true;
      const failures = [];

      if (expectArg === 'deposit') {
        if (booking.bookingStatus !== 'PROVISIONALLY_CONFIRMED') {
          passed = false;
          failures.push(`Expected bookingStatus === 'PROVISIONALLY_CONFIRMED', got '${booking.bookingStatus}'`);
        }
        if (booking.paymentStatus !== 'PARTIALLY_PAID') {
          passed = false;
          failures.push(`Expected paymentStatus === 'PARTIALLY_PAID', got '${booking.paymentStatus}'`);
        }
        if (!booking.inventoryCommittedAt) {
          passed = false;
          failures.push('Expected inventoryCommittedAt to be set.');
        }
        const hasDeposit = payments.some((p) => p.type === 'DEPOSIT');
        if (!hasDeposit) {
          passed = false;
          failures.push('Expected payments[] to contain a DEPOSIT event.');
        }
      } else if (expectArg === 'full') {
        if (booking.bookingStatus !== 'CONFIRMED') {
          passed = false;
          failures.push(`Expected bookingStatus === 'CONFIRMED', got '${booking.bookingStatus}'`);
        }
        if (booking.paymentStatus !== 'PAID') {
          passed = false;
          failures.push(`Expected paymentStatus === 'PAID', got '${booking.paymentStatus}'`);
        }
        if (booking.pricing?.amountOutstanding !== 0) {
          passed = false;
          failures.push(`Expected amountOutstanding === 0, got ${booking.pricing?.amountOutstanding}`);
        }
        if (!booking.inventoryCommittedAt) {
          passed = false;
          failures.push('Expected inventoryCommittedAt to be set.');
        }
        if (!booking.qrCode?.dataUrl) {
          passed = false;
          failures.push('Expected qrCode.dataUrl to be populated for full confirmation.');
        }
      } else if (expectArg === 'balance') {
        if (booking.bookingStatus !== 'CONFIRMED') {
          passed = false;
          failures.push(`Expected bookingStatus === 'CONFIRMED', got '${booking.bookingStatus}'`);
        }
        if (booking.paymentStatus !== 'PAID') {
          passed = false;
          failures.push(`Expected paymentStatus === 'PAID', got '${booking.paymentStatus}'`);
        }
        const hasBalance = payments.some((p) => p.type === 'BALANCE');
        if (!hasBalance) {
          passed = false;
          failures.push('Expected payments[] to contain a BALANCE event.');
        }
      } else {
        console.warn(`⚠️ Warning: Unknown expect option '${expectArg}'. Valid: 'deposit', 'full', 'balance'.`);
      }

      if (passed) {
        console.log(`✅ ASSERTION PASSED: Booking matches expected state '${expectArg}'.\n`);
      } else {
        console.error(`❌ ASSERTION FAILED for expected state '${expectArg}':`);
        failures.forEach((f) => console.error(`   - ${f}`));
        console.error('');
        await mongoose.disconnect();
        process.exit(2);
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during booking inspection:', err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

run();
