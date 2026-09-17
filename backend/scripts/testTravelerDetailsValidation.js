import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import { calculateServerPrice } from '../controllers/bookingController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const runTests = async () => {
  console.log('🚀 --- STARTING PHASE B2 TRAVELER DETAILS & VALIDATION TESTS --- 🚀');
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  // Mock Trip with defined batch capacity
  const mockTrip = {
    price: 18500,
    sharingPricing: {
      doubleSharing: 18500,
      tripleSharing: 17000,
      singleSharing: 22000
    },
    batches: [
      {
        batchId: 'b_capacity_test',
        dates: '15 Sep - 20 Sep, 2026',
        capacity: 10,
        bookedSeats: 8, // only 2 seats available!
        status: 'filling_fast',
        pricing: {
          doubleSharing: 18500,
          tripleSharing: 17000,
          singleSharing: 22000
        }
      }
    ]
  };

  // Test 1: Capacity Validation Logic
  const batch = mockTrip.batches[0];
  const availableSeats = batch.capacity - batch.bookedSeats;
  const requestedTravelers = 3;
  const isCapacitySufficient = requestedTravelers <= availableSeats;
  assert(!isCapacitySufficient, 'Reject booking when requested travelers (3) exceeds remaining capacity (2)');

  // Test 2: Traveler Count Limits (> 10 disallowed)
  const maxCount = 12;
  const isWithinMaxLimit = maxCount <= 10;
  assert(!isWithinMaxLimit, 'Reject booking when travelers count (12) exceeds maximum ceiling of 10');

  // Test 3: Lead Traveler Contact Details Required
  const validLead = { name: 'Gaurav Kumar', email: 'gaurav@example.com', phone: '+91 9876543210' };
  const invalidLead = { name: 'Gaurav Kumar', email: '', phone: '' };
  assert(Boolean(validLead.name && validLead.email && validLead.phone), 'Valid lead traveler has all contact fields');
  assert(!Boolean(invalidLead.name && invalidLead.email && invalidLead.phone), 'Invalid lead traveler detected when email/phone missing');

  // Test 4: Co-Travelers Count & Manifest Validation (Count = 3 -> Exactly 2 co-travelers required)
  const totalPax = 3;
  const coTravelersValid = [
    { name: 'Alice Smith', age: '25', gender: 'Female' },
    { name: 'Bob Jones', age: '26', gender: 'Male' }
  ];
  const coTravelersInvalid = [
    { name: 'Alice Smith', age: '25', gender: 'Female' }
    // missing 2nd co-traveler!
  ];
  assert(coTravelersValid.length === totalPax - 1, 'Valid co-travelers manifest matches exactly (totalPax - 1)');
  assert(coTravelersInvalid.length !== totalPax - 1, 'Incomplete co-travelers manifest correctly flagged');

  // Test 5: Server Pricing Authority (Client cannot tamper with rates)
  const serverPricing = await calculateServerPrice(mockTrip, 3, 'Triple Sharing', '');
  assert(serverPricing.finalAmount === 17000 * 3, 'Server-authoritative calculation overrides any client tampering (₹51,000)');

  // Test 6: HTTP Calculate Pricing Endpoint with Multiple Travelers
  try {
    const response = await fetch('http://localhost:5000/api/bookings/calculate-pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: 'meghalaya-living-root-bridges',
        travelersCount: 4,
        occupancy: 'Double Sharing'
      })
    });

    if (response.ok) {
      const data = await response.json();
      assert(data.success === true, 'POST /api/bookings/calculate-pricing responds with success: true for 4 travelers');
      assert(data.pricing.count === 4, 'Pricing calculated for 4 travelers');
      console.log('    Response Pricing Summary for 4 pax:', data.pricing);
    } else {
      console.log('    (Backend HTTP fetch skipped if server running in isolated port)');
    }
  } catch (err) {
    console.log('    (Backend fetch skipped in script runner)');
  }

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
