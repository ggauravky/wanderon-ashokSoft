import mongoose from 'mongoose';
import Vendor from '../models/Vendor.js';
import OperationalService from '../models/OperationalService.js';
import { createVendorWithUniqueCode, OperationsDomainError } from '../services/operationsExecutionService.js';
import { isValidMongoObjectId } from '../utils/mongoId.js';

const isDbConnected = () => mongoose.connection?.readyState === 1;
const fail = (res, status, message) => res.status(status).json({ success: false, message });
const ensureDatabase = (res) => {
  if (isDbConnected()) return true;
  fail(res, 503, 'Database temporarily unavailable.');
  return false;
};
const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const handleError = (res, error, fallback) => {
  if (!isDbConnected()) return fail(res, 503, 'Database temporarily unavailable.');
  if (error instanceof OperationsDomainError) return fail(res, error.status, error.message);
  if (error?.name === 'ValidationError') return fail(res, 400, Object.values(error.errors || {})[0]?.message || 'Invalid Vendor data.');
  if (error?.name === 'VersionError') return fail(res, 409, 'This Vendor changed while you were editing it. Refresh and try again.');
  if (error?.code === 11000) return fail(res, 409, 'A Vendor with the same identifier already exists.');
  console.error('Vendor request error:', error?.message || error);
  return fail(res, 500, fallback);
};

const vendorPayload = (body, req) => {
  const allowed = ['name', 'types', 'contact', 'location', 'serviceAreas', 'commercialReference', 'notes'];
  const payload = Object.fromEntries(allowed.filter((key) => Object.hasOwn(body, key)).map((key) => [key, body[key]]));
  if (Object.hasOwn(body, 'documents')) payload.documents = (body.documents || []).map((document) => ({ ...document, uploadedBy: document.uploadedBy || req.user._id }));
  if (payload.types) payload.types = [...new Set(payload.types.map((type) => String(type).toUpperCase()))];
  return payload;
};

const vendorDto = (vendor) => {
  const value = vendor?.toObject ? vendor.toObject() : vendor;
  return {
    _id: value._id,
    vendorCode: value.vendorCode,
    name: value.name,
    types: value.types,
    status: value.status,
    contact: value.contact,
    location: value.location,
    serviceAreas: value.serviceAreas,
    commercialReference: value.commercialReference,
    documents: value.documents,
    notes: value.notes,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
};

export const listVendors = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(5, Number.parseInt(req.query.limit, 10) || 20));
    const query = {};
    const type = String(req.query.type || 'all').toUpperCase();
    const status = String(req.query.status || 'all').toUpperCase();
    if (type !== 'ALL') query.types = type;
    if (status !== 'ALL') query.status = status;
    if (req.query.city) query['location.city'] = { $regex: `^${escapeRegex(req.query.city)}$`, $options: 'i' };
    if (req.query.serviceArea) query.serviceAreas = { $regex: `^${escapeRegex(req.query.serviceArea)}$`, $options: 'i' };
    const search = String(req.query.search || '').trim();
    if (search) {
      const regex = { $regex: escapeRegex(search), $options: 'i' };
      query.$or = [
        { vendorCode: regex }, { name: regex }, { 'contact.personName': regex }, { 'contact.phone': regex },
        { 'contact.email': regex }, { 'location.city': regex }
      ];
    }
    const sortOptions = {
      name: { name: 1 },
      recent: { updatedAt: -1 },
      code: { vendorCode: 1 }
    };
    const sort = sortOptions[String(req.query.sort || 'recent')] || sortOptions.recent;
    const [vendors, total, statusRows, typeRows] = await Promise.all([
      Vendor.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Vendor.countDocuments(query),
      Vendor.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Vendor.aggregate([{ $unwind: '$types' }, { $group: { _id: '$types', count: { $sum: 1 } } }])
    ]);
    const counts = (rows) => Object.fromEntries(rows.map((row) => [row._id, row.count]));
    const statuses = counts(statusRows);
    const types = counts(typeRows);
    return res.json({
      success: true,
      data: vendors.map(vendorDto),
      summary: {
        active: statuses.ACTIVE || 0,
        inactive: statuses.INACTIVE || 0,
        hotels: types.HOTEL || 0,
        transport: types.TRANSPORT || 0,
        activitiesAndGuides: (types.ACTIVITY || 0) + (types.GUIDE || 0)
      },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return handleError(res, error, 'Vendor directory could not be loaded.');
  }
};

export const createVendor = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const payload = vendorPayload(req.body, req);
    const hasContact = payload.contact && [payload.contact.phone, payload.contact.whatsapp, payload.contact.email].some((value) => String(value || '').trim());
    if (!hasContact) return fail(res, 400, 'Provide at least one Vendor phone, WhatsApp number, or email address.');
    const vendor = await createVendorWithUniqueCode(payload, req.user._id);
    return res.status(201).json({ success: true, data: vendorDto(vendor) });
  } catch (error) {
    return handleError(res, error, 'Unable to create the Vendor.');
  }
};

export const getVendor = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    if (!isValidMongoObjectId(req.params.vendorId)) return fail(res, 400, 'Invalid Vendor identifier.');
    const vendor = await Vendor.findById(req.params.vendorId).lean();
    if (!vendor) return fail(res, 404, 'Vendor could not be loaded.');
    const [serviceCount, recentServices] = await Promise.all([
      OperationalService.countDocuments({ vendorId: vendor._id }),
      OperationalService.find({ vendorId: vendor._id })
        .select('_id operationalTripId title serviceType confirmationStatus updatedAt')
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean()
    ]);
    return res.json({ success: true, data: { ...vendorDto(vendor), serviceCount, recentServices } });
  } catch (error) {
    return handleError(res, error, 'Vendor could not be loaded.');
  }
};

export const updateVendor = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    if (!isValidMongoObjectId(req.params.vendorId)) return fail(res, 400, 'Invalid Vendor identifier.');
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) return fail(res, 404, 'Vendor could not be loaded.');
    if (req.body.updatedAt && new Date(req.body.updatedAt).getTime() !== new Date(vendor.updatedAt).getTime()) return fail(res, 409, 'This Vendor changed while you were editing it. Refresh and try again.');
    const payload = vendorPayload(req.body, req);
    for (const key of ['contact', 'location', 'commercialReference']) {
      if (!Object.hasOwn(payload, key)) continue;
      vendor.set(key, { ...(vendor[key]?.toObject?.() || vendor[key] || {}), ...payload[key] });
      delete payload[key];
    }
    Object.assign(vendor, payload);
    const hasContact = [vendor.contact?.phone, vendor.contact?.whatsapp, vendor.contact?.email].some((value) => String(value || '').trim());
    if (!hasContact) return fail(res, 400, 'Provide at least one Vendor phone, WhatsApp number, or email address.');
    vendor.updatedBy = req.user._id;
    await vendor.save();
    return res.json({ success: true, data: vendorDto(vendor) });
  } catch (error) {
    return handleError(res, error, 'Unable to update the Vendor.');
  }
};

export const updateVendorStatus = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    if (!isValidMongoObjectId(req.params.vendorId)) return fail(res, 400, 'Invalid Vendor identifier.');
    const status = String(req.body.status || '').toUpperCase();
    if (!['ACTIVE', 'INACTIVE'].includes(status)) return fail(res, 400, 'Vendor status must be ACTIVE or INACTIVE.');
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) return fail(res, 404, 'Vendor could not be loaded.');
    vendor.status = status;
    vendor.updatedBy = req.user._id;
    await vendor.save();
    return res.json({ success: true, data: vendorDto(vendor) });
  } catch (error) {
    return handleError(res, error, 'Unable to update Vendor status.');
  }
};
