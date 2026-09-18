import 'dotenv/config';
import mongoose from 'mongoose';
import { getMongoUri } from '../config/environment.js';
import Quotation from '../models/Quotation.js';
import QuotationRevision from '../models/QuotationRevision.js';
import QuotationShare from '../models/QuotationShare.js';
import QuotationEvent from '../models/QuotationEvent.js';
import QuotationApprovalVerification from '../models/QuotationApprovalVerification.js';
import Booking from '../models/Booking.js';

const uri = getMongoUri();
if (!uri) throw new Error('MONGODB_URI (or MONGO_URI) is required.');

try {
  await mongoose.connect(uri);
  const result = await Quotation.updateMany(
    { $or: [{ schemaVersion: { $exists: false } }, { schemaVersion: null }] },
    { $set: { schemaVersion: 1 } }
  );
  for (const model of [Quotation, QuotationRevision, QuotationShare, QuotationEvent, QuotationApprovalVerification, Booking]) {
    await model.createIndexes();
  }
  console.log(`Quotation V2 migration complete. Marked ${result.modifiedCount} legacy quotation(s) as schemaVersion 1 and ensured additive indexes.`);
} finally {
  await mongoose.disconnect();
}
