import mongoose from 'mongoose';
import crypto from 'crypto';
import Quotation from '../models/Quotation.js';
import Lead from '../models/Lead.js';
import Trip from '../models/Trip.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { calculateQuotationPrice } from '../services/quotationPricingService.js';
import { sendWhatsAppTicketAndReceipt } from '../utils/whatsappService.js';
import { isValidMongoObjectId, toObjectIdOrNull } from '../utils/mongoId.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// In-Memory fallback store for quotations during offline tests
export let memoryQuotations = [];

// Helper: State Transition State Machine
const ALLOWED_STATE_TRANSITIONS = {
  DRAFT: ['SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED'],
  SENT: ['VIEWED', 'APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED'],
  VIEWED: ['APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED'],
  APPROVED: ['CONVERTED', 'REJECTED', 'ARCHIVED'],
  REJECTED: ['DRAFT', 'ARCHIVED'],
  EXPIRED: ['DRAFT', 'ARCHIVED'],
  CONVERTED: ['ARCHIVED'],
  ARCHIVED: ['DRAFT']
};

export const isValidStateTransition = (currentStatus, targetStatus) => {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_STATE_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
};

// Helper: Sequence Number Generator (WL-Q-YYYY-XXXXX)
export const generateUniqueQuotationNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `WL-Q-${currentYear}-`;
  
  if (isDbConnected()) {
    try {
      const count = await Quotation.countDocuments({
        quotationNumber: new RegExp(`^${prefix}`)
      });
      const seq = String(count + 1).padStart(5, '0');
      const candidate = `${prefix}${seq}`;
      
      const exists = await Quotation.findOne({ quotationNumber: candidate });
      if (!exists) return candidate;

      // Entropy fallback if race condition
      return `${prefix}${String(count + 1).padStart(4, '0')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    } catch (e) {
      console.warn('Quotation sequence count fallback:', e.message);
    }
  }

  const memCount = memoryQuotations.filter(q => q.quotationNumber?.startsWith(prefix)).length;
  return `${prefix}${String(memCount + 1).padStart(5, '0')}`;
};

// Helper: Sanitize Quotation for Public Customer View (Zero Internal Costs / Profit Margins)
export const sanitizeForCustomer = (quotation) => {
  if (!quotation) return null;
  const doc = quotation.toObject ? quotation.toObject() : JSON.parse(JSON.stringify(quotation));

  // 1. Remove internal margin & cost fields from pricing breakdown
  if (doc.pricing) {
    delete doc.pricing.internalBaseCost;
    delete doc.pricing.internalHotelCost;
    delete doc.pricing.internalTransportCost;
    delete doc.pricing.internalActivityCost;
    delete doc.pricing.internalAddOnCost;
    delete doc.pricing.totalInternalCost;
    delete doc.pricing.markupPercent;
    delete doc.pricing.markupAmount;
    delete doc.pricing.projectedMargin;
    delete doc.pricing.projectedMarginPercent;
  }

  // 2. Strip internal costs from hotel alternatives
  if (Array.isArray(doc.hotelOptions)) {
    doc.hotelOptions = doc.hotelOptions.map(h => {
      const { costPerNight, totalCost, ...safeHotel } = h;
      return safeHotel;
    });
  }

  // 3. Strip internal costs, driver details, and non-customer documents from transport options
  if (Array.isArray(doc.transportOptions)) {
    doc.transportOptions = doc.transportOptions.map(t => {
      const { unitCost, totalCost, provider, driverDetails, ...safeTransport } = t;

      if (Array.isArray(safeTransport.documents)) {
        // ONLY allow documents with visibility === 'CUSTOMER_VISIBLE'
        safeTransport.documents = safeTransport.documents
          .filter(d => d && d.visibility === 'CUSTOMER_VISIBLE')
          .map(d => {
            const { uploadedBy, uploadedByName, ...safeDoc } = d;
            return safeDoc;
          });
      }

      return safeTransport;
    });
  }

  // 4. Strip internal costs from activities & add-ons
  if (Array.isArray(doc.activities)) {
    doc.activities = doc.activities.map(a => {
      const { unitCost, totalCost, ...safeAct } = a;
      return safeAct;
    });
  }
  if (Array.isArray(doc.addOns)) {
    doc.addOns = doc.addOns.map(a => {
      const { unitCost, totalCost, ...safeAddon } = a;
      return safeAddon;
    });
  }

  // 4b. Sanitize itinerary day media for customer view (project safe fields only)
  if (Array.isArray(doc.itinerary)) {
    doc.itinerary = doc.itinerary.map(day => {
      const safeDay = { ...day };
      if (safeDay.coverMedia) {
        safeDay.coverMedia = {
          url: safeDay.coverMedia.url || '',
          altText: safeDay.coverMedia.altText || '',
          caption: safeDay.coverMedia.caption || '',
          width: safeDay.coverMedia.width || 1200,
          height: safeDay.coverMedia.height || 800
        };
      }
      return safeDay;
    });
  }

  // 5. Remove internal audit logs, revisions & administrative notes
  delete doc.auditTrail;
  delete doc.revisions;
  delete doc.pricingRules;
  delete doc.priceSnapshot;
  if (doc.customerSnapshot) delete doc.customerSnapshot.notes;
  if (doc.assignedToSnapshot) delete doc.assignedToSnapshot.phone;
  return doc;
};

// ============================================================================
// RBAC COMMERCIAL CONCESSION VALIDATION (PART 9 & 10)
// ============================================================================
export const validateCommercialConcessions = (user, pricing = {}) => {
  const userRole = (user?.role || 'sales').toLowerCase();
  const isAdmin = ['admin', 'super_admin', 'operations'].includes(userRole);

  if (isAdmin) return null; // Admins & Operations are unrestricted

  const discountType = pricing.discountType || 'none';
  const discountVal = Number(pricing.discountValue || 0);
  const markupPercent = Number(pricing.markupPercent || pricing.markupValue || 0);

  // Sales Role Thresholds
  if (discountType === 'percentage' && discountVal > 10) {
    return 'Sales role is restricted to a maximum 10% discount concession. Higher discounts require Manager / Admin Approval.';
  }
  if (discountType === 'flat' && discountVal > 10000) {
    return 'Sales role is restricted to a maximum ₹10,000 flat discount concession. Higher concessions require Manager / Admin Approval.';
  }
  if (markupPercent > 30) {
    return 'Sales role markup is restricted to a maximum of 30%. Higher adjustments require Manager / Admin Approval.';
  }

  return null;
};

// ============================================================================
// 1. CALCULATE PRICING PREVIEW (API Endpoint)
// ============================================================================
// @desc    Calculate authoritative quotation pricing breakdown
// @route   POST /api/quotations/calculate-preview
// @access  Private (Sales/Admin)
export const calculateQuotationPricingPreview = async (req, res) => {
  try {
    const calculated = calculateQuotationPrice(req.body);
    res.json({
      success: true,
      pricing: calculated.pricing,
      pricingRules: calculated.pricingRules,
      hotelOptions: calculated.hotelOptions,
      transportOptions: calculated.transportOptions,
      activities: calculated.activities,
      addOns: calculated.addOns,
      paymentTerms: calculated.paymentTerms,
      tripRequirements: calculated.tripRequirements
    });
  } catch (error) {
    console.error('Pricing Calculation Error:', error);
    res.status(400).json({ message: error.message || 'Error calculating quotation price' });
  }
};

// ============================================================================
// 2. CREATE QUOTATION (Draft)
// ============================================================================
// @desc    Create a new customized quotation draft
// @route   POST /api/quotations
// @access  Private (Sales/Admin)
export const createQuotation = async (req, res) => {
  try {
    const {
      leadId,
      customerId,
      pricingRules,
      itinerary,
      hotelOptions,
      transportOptions,
      activities,
      addOns,
      inclusions,
      exclusions,
      termsAndConditions,
      cancellationPolicy,
      paymentTerms,
      pricing,
      sourceTripId,
      notes
    } = req.body;

    const customerSnapshot = req.body.customerSnapshot || req.body.customer || {};
    const tripRequirements = req.body.tripRequirements || {
      title: req.body.tripTitle || req.body.title || 'Custom Curated Expedition',
      destination: req.body.destination || 'Custom Destination',
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      durationDays: req.body.durationDays || 5,
      durationNights: req.body.durationNights || 4,
      travelers: req.body.travelers || customerSnapshot.numberOfTravelers || 2
    };

    if (!customerSnapshot.name || !customerSnapshot.email || !customerSnapshot.phone) {
      return res.status(400).json({ message: 'Customer name, email, and phone number are required.' });
    }

    if (!tripRequirements.title || !tripRequirements.destination) {
      return res.status(400).json({ message: 'Trip title and destination are required.' });
    }

    // 0. RBAC Commercial Concession Validation
    const concessionError = validateCommercialConcessions(req.user, pricing);
    if (concessionError) {
      return res.status(403).json({ message: concessionError });
    }

    // 1. Compute Authoritative Server-Side Pricing
    const computed = calculateQuotationPrice({
      tripRequirements,
      pricingRules,
      hotelOptions,
      transportOptions,
      activities,
      addOns,
      paymentTerms,
      pricing
    });

    const quotationNumber = await generateUniqueQuotationNumber();
    const shareToken = crypto.randomBytes(24).toString('hex');
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days validity

    const userId = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user?.name || 'Sales Specialist';
    const actorObjectId = toObjectIdOrNull(userId);

    if (isDbConnected() && !actorObjectId) {
      return res.status(400).json({ message: 'A valid authenticated staff identity is required to create a quotation.' });
    }

    const quotationPayload = {
      quotationNumber,
      version: 1,
      leadId: toObjectIdOrNull(leadId),
      customerId: toObjectIdOrNull(customerId),
      assignedTo: toObjectIdOrNull(req.body.assignedTo) || actorObjectId,
      assignedToSnapshot: {
        name: userName,
        email: req.user?.email || '',
        phone: req.user?.phone || ''
      },
      createdBy: actorObjectId,
      updatedBy: actorObjectId,
      customerSnapshot: {
        name: customerSnapshot.name.trim(),
        email: customerSnapshot.email.trim().toLowerCase(),
        phone: customerSnapshot.phone.trim(),
        city: customerSnapshot.city || '',
        notes: customerSnapshot.notes || notes || ''
      },
      tripRequirements: computed.tripRequirements,
      pricingRules: computed.pricingRules,
      itinerary: itinerary || [],
      hotelOptions: computed.hotelOptions,
      transportOptions: computed.transportOptions,
      activities: computed.activities,
      addOns: computed.addOns,
      inclusions: inclusions || undefined,
      exclusions: exclusions || undefined,
      termsAndConditions: termsAndConditions || undefined,
      cancellationPolicy: cancellationPolicy || undefined,
      paymentTerms: computed.paymentTerms,
      pricing: computed.pricing,
      status: 'DRAFT',
      statusHistory: [
        {
          status: 'DRAFT',
          changedBy: actorObjectId,
          changedByName: userName,
          changedAt: new Date(),
          reason: 'Initial quotation created'
        }
      ],
      validUntil,
      publicShare: {
        token: shareToken,
        isPublic: true,
        viewCount: 0
      },
      sourceTripId: sourceTripId || null,
      auditTrail: [
        {
          action: 'QUOTATION_CREATED',
          performedBy: actorObjectId,
          performedByName: userName,
          details: { quotationNumber, finalTotal: computed.pricing.finalTotal },
          timestamp: new Date()
        }
      ]
    };

    let newQuotation = null;
    if (isDbConnected()) {
      try {
        newQuotation = await Quotation.create(quotationPayload);

        // If linked to a CRM Lead, update Lead status and push to lead.quotations
        if (leadId && mongoose.Types.ObjectId.isValid(leadId)) {
          await Lead.findByIdAndUpdate(leadId, {
            status: 'IN_PROGRESS',
            $addToSet: { quotations: newQuotation._id }
          });
        }
      } catch (dbErr) {
        console.warn('Quotation DB Create warning:', dbErr.message);
        throw dbErr;
      }
    }

    if (!newQuotation) {
      if (process.env.NODE_ENV === 'production' || process.env.ALLOW_IN_MEMORY_FALLBACK !== 'true') {
        return res.status(503).json({ message: 'Quotation storage is unavailable while the database is disconnected.' });
      }
      newQuotation = {
        _id: 'quot_' + Date.now(),
        ...quotationPayload,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryQuotations.unshift(newQuotation);
    }

    res.status(201).json({
      success: true,
      message: `Quotation ${quotationNumber} drafted successfully.`,
      quotation: newQuotation
    });
  } catch (error) {
    console.error('Create Quotation Error:', error);
    res.status(500).json({ message: error.message || 'Server Error creating quotation' });
  }
};

// ============================================================================
// 3. GET QUOTATIONS (Pipeline list with filtering, search & pagination)
// ============================================================================
// @desc    Get all quotations with comprehensive status/sales filters
// @route   GET /api/quotations
// @access  Private (Sales/Admin/Operations/Marketing)
export const getQuotations = async (req, res) => {
  try {
    const { status, leadId, assignedTo, destination, search, dateFrom, dateTo, sortBy = 'updated', page = 1, limit = 50 } = req.query;

    const andConditions = [];

    if (status && typeof status === 'string' && status !== 'all') {
      andConditions.push({ status: String(status).trim() });
    }
    if (leadId && typeof leadId === 'string') {
      andConditions.push({ leadId: String(leadId).trim() });
    }
    if (destination && typeof destination === 'string' && destination !== 'all') {
      andConditions.push({ 'tripRequirements.destination': { $regex: String(destination).trim(), $options: 'i' } });
    }
    if (dateFrom || dateTo) {
      const createdAt = {};
      if (dateFrom) createdAt.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo) createdAt.$lte = new Date(`${dateTo}T23:59:59.999Z`);
      andConditions.push({ createdAt });
    }

    // Role-based filtering: Sales users only see quotations assigned to them, created by them, or unassigned
    const userRole = (req.user?.role || 'admin').toLowerCase();
    const userId = req.user?._id || req.user?.id;
    const isSuperOrAdmin = ['admin', 'super_admin', 'operations'].includes(userRole);

    if (userRole === 'sales' && !isSuperOrAdmin) {
      andConditions.push({
        $or: [
          { assignedTo: userId },
          { createdBy: userId },
          { assignedTo: null }
        ]
      });
    } else if (assignedTo && typeof assignedTo === 'string' && assignedTo !== 'all') {
      andConditions.push({ assignedTo: String(assignedTo).trim() });
    }

    if (search && typeof search === 'string') {
      const q = String(search).trim();
      andConditions.push({
        $or: [
          { quotationNumber: { $regex: q, $options: 'i' } },
          { bookingCode: { $regex: q, $options: 'i' } },
          { 'customerSnapshot.name': { $regex: q, $options: 'i' } },
          { 'customerSnapshot.email': { $regex: q, $options: 'i' } },
          { 'customerSnapshot.phone': { $regex: q, $options: 'i' } },
          { 'tripRequirements.destination': { $regex: q, $options: 'i' } },
          { 'tripRequirements.title': { $regex: q, $options: 'i' } }
        ]
      });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    let sortObj = { updatedAt: -1 };
    if (sortBy === 'newest') {
      sortObj = { createdAt: -1 };
    } else if (sortBy === 'value') {
      sortObj = { 'pricing.finalTotal': -1 };
    } else if (sortBy === 'updated') {
      sortObj = { updatedAt: -1 };
    }

    let quotations = [];
    let totalCount = 0;
    if (isDbConnected()) {
      try {
        totalCount = await Quotation.countDocuments(filter);
        quotations = await Quotation.find(filter)
          .select('-itinerary -hotelOptions -transportOptions -activities -addOns -auditTrail -revisions -termsAndConditions -cancellationPolicy')
          .sort(sortObj)
          .limit(Number(limit))
          .skip((Number(page) - 1) * Number(limit))
          .populate('leadId', 'name email phone status')
          .populate('assignedTo', 'name email')
          .lean();
      } catch (dbErr) {
        console.warn('Quotation find warning:', dbErr.message);
        throw dbErr;
      }
    }

    if (!isDbConnected()) {
      if (process.env.NODE_ENV === 'production' || process.env.ALLOW_IN_MEMORY_FALLBACK !== 'true') {
        return res.status(503).json({ message: 'Quotation data is unavailable while the database is disconnected.' });
      }
      quotations = memoryQuotations.filter(q => {
        if (userRole === 'sales' && !isSuperOrAdmin) {
          const isAssigned = String(q.assignedTo) === String(userId) || String(q.createdBy) === String(userId) || !q.assignedTo;
          if (!isAssigned) return false;
        }
        if (status && status !== 'all' && q.status !== status) return false;
        if (leadId && String(q.leadId) !== String(leadId)) return false;
        if (destination && destination !== 'all') {
          if (!((q.tripRequirements?.destination || '').toLowerCase().includes(destination.toLowerCase()))) return false;
        }
        if (search) {
          const s = String(search).toLowerCase();
          const matches = (q.quotationNumber || '').toLowerCase().includes(s) ||
                          (q.bookingCode || '').toLowerCase().includes(s) ||
                          (q.customerSnapshot?.name || '').toLowerCase().includes(s) ||
                          (q.customerSnapshot?.email || '').toLowerCase().includes(s) ||
                          (q.tripRequirements?.destination || '').toLowerCase().includes(s);
          if (!matches) return false;
        }
        if (dateFrom && new Date(q.createdAt) < new Date(`${dateFrom}T00:00:00.000Z`)) return false;
        if (dateTo && new Date(q.createdAt) > new Date(`${dateTo}T23:59:59.999Z`)) return false;
        return true;
      });

      if (sortBy === 'value') {
        quotations.sort((a, b) => (b.pricing?.finalTotal || 0) - (a.pricing?.finalTotal || 0));
      } else if (sortBy === 'newest') {
        quotations.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } else {
        quotations.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
      }
    }

    res.json({
      success: true,
      count: quotations.length,
      total: totalCount || quotations.length,
      page: Number(page),
      pages: Math.ceil((totalCount || quotations.length) / Number(limit)),
      quotations
    });
  } catch (error) {
    console.error('Get Quotations Error:', error);
    res.status(500).json({ message: error.message || 'Server Error fetching quotations' });
  }
};

// Helper: Check if user is authorized to view/manage a quotation (Sales isolation / RBAC)
export const isUserAuthorizedForQuotation = (user, quotation) => {
  if (!user) return false;
  const userRole = (user.role || 'admin').toLowerCase();
  const isSuperOrAdmin = ['admin', 'super_admin', 'operations'].includes(userRole);
  if (isSuperOrAdmin) return true;

  if (userRole === 'sales') {
    const userId = String(user._id || user.id);
    const assigned = quotation.assignedTo ? String(quotation.assignedTo._id || quotation.assignedTo) : null;
    const created = quotation.createdBy ? String(quotation.createdBy._id || quotation.createdBy) : null;
    // Authorized if assigned to this agent, created by this agent, or unassigned (open pool)
    if (!assigned || assigned === userId || created === userId) {
      return true;
    }
    return false;
  }

  return false;
};

// ============================================================================
// 4. GET QUOTATION BY ID
// ============================================================================
// @desc    Get single full quotation by ID (Includes Internal Costs for authorized roles, sanitized for Marketing)
// @route   GET /api/quotations/:id
// @access  Private (Sales/Admin/Operations/Marketing)
export const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = (req.user?.role || 'admin').toLowerCase();

    let quotation = null;
    if (isDbConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          quotation = await Quotation.findById(id)
            .populate('leadId')
            .populate('assignedTo', 'name email phone')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .populate('convertedTripId', 'title slug price')
            .populate('bookingId', 'bookingId bookingStatus paymentStatus');
        }
        if (!quotation) {
          quotation = await Quotation.findOne({ quotationNumber: id });
        }
      } catch (e) {}
    }

    if (!quotation) {
      quotation = memoryQuotations.find(q => String(q._id) === String(id) || q.quotationNumber === id);
    }

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation record not found.' });
    }

    // Role-based Access Isolation: Sales agent cannot view another sales agent's restricted quotation
    if (!isUserAuthorizedForQuotation(req.user, quotation)) {
      return res.status(403).json({ message: 'Access denied. You do not have permission to view this quotation.' });
    }

    let responseQuotation = quotation;
    if (userRole === 'marketing') {
      responseQuotation = sanitizeForCustomer(quotation);
    }

    res.json({
      success: true,
      quotation: responseQuotation
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error fetching quotation' });
  }
};

// ============================================================================
// 5. UPDATE QUOTATION (Draft Edit & Recalculation)
// ============================================================================
// @desc    Update quotation details & recalculate price
// @route   PATCH /api/quotations/:id
// @access  Private (Sales/Admin)
export const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    let quotation = null;
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      quotation = await Quotation.findById(id);
    }
    if (!quotation) {
      quotation = memoryQuotations.find(q => String(q._id) === String(id) || q.quotationNumber === id);
    }

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation record not found.' });
    }

    // Role-based Access Isolation: Sales agent cannot edit another sales agent's quotation
    if (!isUserAuthorizedForQuotation(req.user, quotation) || req.user?.role?.toLowerCase() === 'marketing') {
      return res.status(403).json({ message: 'Access denied. You do not have permission to modify this quotation.' });
    }

    // IMMUTABILITY GUARDS (Sections 11, 12, 109, 110)
    if (quotation.status === 'APPROVED') {
      return res.status(409).json({
        message: 'Approved quotations cannot be modified directly as they represent an agreed commercial contract. Please create a revision.'
      });
    }

    if (['SENT', 'VIEWED'].includes(quotation.status)) {
      return res.status(409).json({
        message: 'Sent quotations cannot be modified directly while under customer review. Please create a revision to modify commercial proposal details.'
      });
    }

    if (['CONVERTED', 'ARCHIVED'].includes(quotation.status)) {
      return res.status(409).json({
        message: `Quotations in "${quotation.status}" status cannot be modified directly.`
      });
    }

    // 0. RBAC Commercial Concession Validation
    const concessionError = validateCommercialConcessions(req.user, req.body.pricing || quotation.pricing);
    if (concessionError) {
      return res.status(403).json({ message: concessionError });
    }

    const userId = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user?.name || 'Sales Specialist';
    const isSuperOrAdmin = ['admin', 'super_admin', 'operations'].includes((req.user?.role || 'admin').toLowerCase());

    // Merge & recalculate pricing
    const mergedData = {
      tripRequirements: req.body.tripRequirements || quotation.tripRequirements,
      pricingRules: req.body.pricingRules || quotation.pricingRules,
      hotelOptions: req.body.hotelOptions || quotation.hotelOptions,
      transportOptions: req.body.transportOptions || quotation.transportOptions,
      activities: req.body.activities || quotation.activities,
      addOns: req.body.addOns || quotation.addOns,
      paymentTerms: req.body.paymentTerms || quotation.paymentTerms,
      pricing: req.body.pricing || quotation.pricing
    };

    const computed = calculateQuotationPrice(mergedData);

    // Apply updates
    if (req.body.customerSnapshot) {
      quotation.customerSnapshot = { ...quotation.customerSnapshot, ...req.body.customerSnapshot };
    }
    if (req.body.itinerary) quotation.itinerary = req.body.itinerary;
    if (req.body.inclusions) quotation.inclusions = req.body.inclusions;
    if (req.body.exclusions) quotation.exclusions = req.body.exclusions;
    if (req.body.termsAndConditions) quotation.termsAndConditions = req.body.termsAndConditions;
    if (req.body.cancellationPolicy) quotation.cancellationPolicy = req.body.cancellationPolicy;
    if (req.body.assignedTo && isSuperOrAdmin) quotation.assignedTo = req.body.assignedTo;

    quotation.tripRequirements = computed.tripRequirements;
    quotation.pricingRules = computed.pricingRules;
    quotation.hotelOptions = computed.hotelOptions;
    quotation.transportOptions = computed.transportOptions;
    quotation.activities = computed.activities;
    quotation.addOns = computed.addOns;
    quotation.paymentTerms = computed.paymentTerms;
    quotation.pricing = computed.pricing;
    quotation.updatedBy = userId;

    if (Array.isArray(quotation.auditTrail)) {
      quotation.auditTrail.push({
        action: 'QUOTATION_UPDATED',
        performedBy: userId,
        performedByName: userName,
        details: { finalTotal: computed.pricing.finalTotal },
        timestamp: new Date()
      });
    }

    if (isDbConnected() && typeof quotation.save === 'function') {
      await quotation.save();
    }

    res.json({
      success: true,
      message: 'Quotation updated and recalculated successfully.',
      quotation
    });
  } catch (error) {
    console.error('Update Quotation Error:', error);
    res.status(500).json({ message: error.message || 'Server Error updating quotation' });
  }
};

// ============================================================================
// 6. DELETE QUOTATION
// ============================================================================
// @desc    Delete draft/rejected quotation (Admin Only)
// @route   DELETE /api/quotations/:id
// @access  Private (Admin Only)
export const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    let quotation = null;
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      quotation = await Quotation.findById(id);
    }
    if (!quotation) {
      quotation = memoryQuotations.find(q => String(q._id) === String(id) || q.quotationNumber === id);
    }

    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

    // Sales Isolation & Role Check
    if (!isUserAuthorizedForQuotation(req.user, quotation) || req.user?.role?.toLowerCase() === 'marketing') {
      return res.status(403).json({ message: 'Access denied. You do not have permission to delete this quotation.' });
    }

    // Section 32: DRAFT, REJECTED, or ARCHIVED can be deleted. SENT, APPROVED, CONVERTED cannot be deleted.
    if (['SENT', 'VIEWED', 'APPROVED', 'CONVERTED'].includes(quotation.status)) {
      return res.status(400).json({
        message: `Quotations in "${quotation.status}" status cannot be permanently deleted as they contain active commercial/financial history. Please archive this quotation instead.`
      });
    }

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      await Quotation.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Quotation deleted successfully.' });
    }

    const index = memoryQuotations.findIndex(q => String(q._id) === String(id) || q.quotationNumber === id);
    if (index !== -1) memoryQuotations.splice(index, 1);

    res.json({ success: true, message: 'Quotation deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error deleting quotation' });
  }
};

// ============================================================================
// 6B. ARCHIVE QUOTATION
// ============================================================================
// @desc    Archive a quotation (Status -> ARCHIVED)
// @route   POST /api/quotations/:id/archive
// @access  Private (Sales/Admin)
export const archiveQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Archived by sales/admin' } = req.body;

    let quotation = null;
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      quotation = await Quotation.findById(id);
    }
    if (!quotation) {
      quotation = memoryQuotations.find(q => String(q._id) === String(id) || q.quotationNumber === id);
    }

    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

    // Sales Isolation & Role Check
    if (!isUserAuthorizedForQuotation(req.user, quotation) || req.user?.role?.toLowerCase() === 'marketing') {
      return res.status(403).json({ message: 'Access denied. You do not have permission to archive this quotation.' });
    }

    const userId = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user?.name || 'Sales Concierge';

    quotation.status = 'ARCHIVED';
    quotation.statusHistory.push({
      status: 'ARCHIVED',
      changedBy: userId,
      changedByName: userName,
      changedAt: new Date(),
      reason
    });

    if (Array.isArray(quotation.auditTrail)) {
      quotation.auditTrail.push({
        action: 'QUOTATION_ARCHIVED',
        performedBy: userId,
        performedByName: userName,
        details: { reason },
        timestamp: new Date()
      });
    }

    if (isDbConnected() && typeof quotation.save === 'function') {
      await quotation.save();
    }

    res.json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} archived successfully.`,
      quotation
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error archiving quotation' });
  }
};

// ============================================================================
// 7. SEND QUOTATION TO CUSTOMER (Status -> SENT) (PART 14)
// ============================================================================
// @desc    Mark quotation as SENT, capture price snapshot & notify traveler
// @route   POST /api/quotations/:id/send
// @access  Private (Sales/Admin)
export const sendQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    let quotation = null;
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      quotation = await Quotation.findById(id);
    }
    if (!quotation) {
      quotation = memoryQuotations.find(q => String(q._id) === String(id) || q.quotationNumber === id);
    }

    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

    // Sales Isolation & Role Check
    if (!isUserAuthorizedForQuotation(req.user, quotation) || req.user?.role?.toLowerCase() === 'marketing') {
      return res.status(403).json({ message: 'Access denied. You do not have permission to send this quotation.' });
    }

    if (!isValidStateTransition(quotation.status, 'SENT')) {
      return res.status(400).json({ message: `Cannot send quotation from status "${quotation.status}".` });
    }

    // PART 12: Validate quotation completeness before sending
    if (!quotation.customerSnapshot?.name?.trim() || !quotation.customerSnapshot?.email?.trim() || !quotation.customerSnapshot?.phone?.trim()) {
      return res.status(400).json({ message: 'Cannot dispatch incomplete quotation: Customer name, email, and phone are required.' });
    }
    if (!quotation.tripRequirements?.title?.trim() || !quotation.tripRequirements?.destination?.trim()) {
      return res.status(400).json({ message: 'Cannot dispatch incomplete quotation: Trip title and destination are required.' });
    }
    if (!Array.isArray(quotation.itinerary) || quotation.itinerary.length === 0) {
      return res.status(400).json({ message: 'Cannot dispatch incomplete quotation: At least 1 day itinerary is required.' });
    }
    if (!Array.isArray(quotation.hotelOptions) || quotation.hotelOptions.length === 0) {
      return res.status(400).json({ message: 'Cannot dispatch incomplete quotation: At least 1 accommodation option is required.' });
    }

    const userId = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user?.name || 'Sales Concierge';

    quotation.status = 'SENT';
    quotation.sentAt = new Date();
    if (!quotation.publicShare?.token) {
      quotation.publicShare = {
        token: crypto.randomBytes(24).toString('hex'),
        isPublic: true,
        viewCount: 0
      };
    }

    // Capture immutable price snapshot at the moment of sending (PART 14)
    quotation.priceSnapshot = {
      capturedAt: new Date(),
      version: quotation.version || 1,
      pricing: quotation.pricing,
      hotelOptions: quotation.hotelOptions,
      transportOptions: quotation.transportOptions,
      activities: quotation.activities,
      addOns: quotation.addOns,
      tripRequirements: quotation.tripRequirements
    };

    quotation.statusHistory.push({
      status: 'SENT',
      changedBy: userId,
      changedByName: userName,
      changedAt: new Date(),
      reason: 'Quotation dispatched to customer with immutable price snapshot'
    });

    quotation.auditTrail.push({
      action: 'QUOTATION_SENT',
      performedBy: userId,
      performedByName: userName,
      details: { token: quotation.publicShare.token, snapshotVersion: quotation.version || 1 },
      timestamp: new Date()
    });

    if (isDbConnected() && typeof quotation.save === 'function') {
      await quotation.save();
    }

    res.json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} sent to ${quotation.customerSnapshot?.email}.`,
      token: quotation.publicShare.token,
      publicUrl: `/quotation/${quotation.publicShare.token}`,
      quotation
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error sending quotation' });
  }
};

// ============================================================================
// 7B. CREATE QUOTATION REVISION (PART 15)
// ============================================================================
// @desc    Unlock a sent/viewed quotation, increment version & archive historical snapshot
// @route   POST /api/quotations/:id/create-revision
// @access  Private (Sales/Admin)
export const createQuotationRevision = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Client requested modifications to itinerary / stay' } = req.body;

    let quotation = null;
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      quotation = await Quotation.findById(id);
    }
    if (!quotation) {
      quotation = memoryQuotations.find(q => String(q._id) === String(id) || q.quotationNumber === id);
    }

    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

    // Sales Isolation & Role Check
    if (!isUserAuthorizedForQuotation(req.user, quotation) || req.user?.role?.toLowerCase() === 'marketing') {
      return res.status(403).json({ message: 'Access denied. You do not have permission to revise this quotation.' });
    }

    if (quotation.status === 'CONVERTED') {
      return res.status(400).json({ message: 'Cannot revise a quotation that has already been converted to a Booking.' });
    }

    const userId = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user?.name || 'Sales Concierge';

    // 1. Archive current snapshot in revisions history
    if (!Array.isArray(quotation.revisions)) quotation.revisions = [];
    quotation.revisions.push({
      version: quotation.version || 1,
      revisedAt: new Date(),
      revisedBy: userId,
      revisedByName: userName,
      reason: reason,
      priceSnapshot: quotation.priceSnapshot || quotation.pricing,
      itinerarySnapshot: quotation.itinerary
    });

    // 2. Increment version and reset status to DRAFT for editing
    const oldVersion = quotation.version || 1;
    quotation.version = oldVersion + 1;
    quotation.status = 'DRAFT';
    quotation.priceSnapshot = null; // Unfreeze for newly active draft

    quotation.statusHistory.push({
      status: 'DRAFT',
      changedBy: userId,
      changedByName: userName,
      changedAt: new Date(),
      reason: `Created Revision v${quotation.version}: ${reason}`
    });

    if (Array.isArray(quotation.auditTrail)) {
      quotation.auditTrail.push({
        action: 'REVISION_CREATED',
        performedBy: userId,
        performedByName: userName,
        details: { previousVersion: oldVersion, newVersion: quotation.version, reason },
        timestamp: new Date()
      });
    }

    if (isDbConnected() && typeof quotation.save === 'function') {
      await quotation.save();
    }

    res.json({
      success: true,
      message: `Quotation unlocked for Revision v${quotation.version}.`,
      quotation
    });
  } catch (error) {
    console.error('Create Revision Error:', error);
    res.status(500).json({ message: error.message || 'Server Error creating quotation revision' });
  }
};

// ============================================================================
// 8. APPROVE QUOTATION (Status -> APPROVED)
// ============================================================================
// @desc    Record quotation approval
// @route   POST /api/quotations/:id/approve
// @access  Private (Sales/Admin)
export const approveQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Approved by customer / sales' } = req.body;

    let quotation = null;
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      quotation = await Quotation.findById(id);
    }
    if (!quotation) {
      quotation = memoryQuotations.find(q => String(q._id) === String(id) || q.quotationNumber === id);
    }

    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

    // Sales Isolation & Role Check
    if (!isUserAuthorizedForQuotation(req.user, quotation) || req.user?.role?.toLowerCase() === 'marketing') {
      return res.status(403).json({ message: 'Access denied. You do not have permission to approve this quotation.' });
    }

    // Idempotent approval check (Section 108)
    if (quotation.status === 'APPROVED') {
      return res.status(200).json({
        success: true,
        message: `Quotation ${quotation.quotationNumber} is already APPROVED. Ready for booking conversion.`,
        quotation
      });
    }

    if (!isValidStateTransition(quotation.status, 'APPROVED')) {
      return res.status(400).json({ message: `Cannot approve quotation from current status "${quotation.status}".` });
    }

    const userId = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user?.name || 'Sales Concierge';

    quotation.status = 'APPROVED';
    quotation.approvedAt = new Date();

    // Store immutable snapshot of agreed commercial contract (Section 26)
    quotation.approvedSnapshot = {
      approvedAt: new Date(),
      approvedBy: userId,
      approvedByName: userName,
      version: quotation.version || 1,
      customerSnapshot: quotation.customerSnapshot,
      tripRequirements: quotation.tripRequirements,
      hotelOptions: quotation.hotelOptions,
      transportOptions: quotation.transportOptions,
      activities: quotation.activities,
      addOns: quotation.addOns,
      pricing: quotation.pricing,
      paymentTerms: quotation.paymentTerms,
      inclusions: quotation.inclusions,
      exclusions: quotation.exclusions,
      itinerary: quotation.itinerary
    };

    quotation.statusHistory.push({
      status: 'APPROVED',
      changedBy: userId,
      changedByName: userName,
      changedAt: new Date(),
      reason
    });

    quotation.auditTrail.push({
      action: 'QUOTATION_APPROVED',
      performedBy: userId,
      performedByName: userName,
      details: { reason, totalAmount: quotation.pricing?.finalTotal },
      timestamp: new Date()
    });

    if (isDbConnected() && typeof quotation.save === 'function') {
      await quotation.save();
    }

    res.json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} approved. Ready for booking conversion.`,
      quotation
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error approving quotation' });
  }
};

// ============================================================================
// 9. REJECT QUOTATION (Status -> REJECTED)
// ============================================================================
// @desc    Record quotation rejection / decline
// @route   POST /api/quotations/:id/reject
// @access  Private (Sales/Admin)
export const rejectQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Customer declined quotation' } = req.body;

    let quotation = null;
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      quotation = await Quotation.findById(id);
    }
    if (!quotation) {
      quotation = memoryQuotations.find(q => String(q._id) === String(id) || q.quotationNumber === id);
    }

    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

    if (!isValidStateTransition(quotation.status, 'REJECTED')) {
      return res.status(400).json({ message: `Cannot reject quotation from current status "${quotation.status}".` });
    }

    const userId = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user?.name || 'Sales Concierge';

    quotation.status = 'REJECTED';
    quotation.statusHistory.push({
      status: 'REJECTED',
      changedBy: userId,
      changedByName: userName,
      changedAt: new Date(),
      reason
    });

    quotation.auditTrail.push({
      action: 'QUOTATION_REJECTED',
      performedBy: userId,
      performedByName: userName,
      details: { reason },
      timestamp: new Date()
    });

    if (isDbConnected() && typeof quotation.save === 'function') {
      await quotation.save();
    }

    res.json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} marked as REJECTED.`,
      quotation
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error rejecting quotation' });
  }
};

// ============================================================================
// 10. CONVERT TO CATALOG TRIP (PATH A)
// ============================================================================
// @desc    Convert an approved customized quotation into a public Trip catalog package (Draft)
// @route   POST /api/quotations/:id/convert-to-trip
// @access  Private (Admin/Operations)
export const convertToTrip = async (req, res) => {
  try {
    const { id } = req.params;

    let quotation = null;
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      quotation = await Quotation.findById(id);
    }
    if (!quotation) {
      quotation = memoryQuotations.find(q => String(q._id) === String(id) || q.quotationNumber === id);
    }

    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

    // Role check: Only Admin and Operations can convert quotations into catalog trips
    const userRole = (req.user?.role || '').toLowerCase();
    const isSuperOrAdmin = ['admin', 'super_admin', 'operations'].includes(userRole);
    if (!isSuperOrAdmin) {
      return res.status(403).json({ message: 'Only Admins and Operations can convert quotations into catalog trips.' });
    }

    // Idempotency Check: Prevent duplicate conversions
    if (quotation.status === 'CONVERTED' && quotation.convertedTripId) {
      let existingTrip = null;
      if (isDbConnected() && mongoose.Types.ObjectId.isValid(quotation.convertedTripId)) {
        try {
          existingTrip = await Trip.findById(quotation.convertedTripId);
        } catch (e) {}
      }
      return res.status(200).json({
        success: true,
        message: 'Quotation has already been converted to a Catalog Trip.',
        trip: existingTrip || { _id: quotation.convertedTripId, title: quotation.tripRequirements?.title, status: 'draft' },
        quotation,
        isExisting: true
      });
    }

    // Only APPROVED quotations can be converted
    if (quotation.status !== 'APPROVED') {
      return res.status(400).json({ message: `Cannot convert quotation in "${quotation.status}" status. Only APPROVED quotations can be converted to a Catalog Trip.` });
    }

    const userId = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user?.name || 'Admin Operations';

    const slug = (quotation.tripRequirements.title || 'custom-trip')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const perPaxPrice = quotation.pricing?.perPersonPrice || Math.round((quotation.pricing?.finalTotal || 35000) / (quotation.tripRequirements.totalTravelers || 2));
    const selectedHotel = quotation.hotelOptions?.find(h => h.selected) || quotation.hotelOptions?.[0];
    const selectedTransport = quotation.transportOptions?.find(t => t.selected) || quotation.transportOptions?.[0];

    const tripData = {
      title: quotation.tripRequirements.title,
      slug,
      location: quotation.tripRequirements.destination,
      destination: quotation.tripRequirements.destination,
      duration: quotation.tripRequirements.duration || `${quotation.tripRequirements.days || 5}D/${quotation.tripRequirements.nights || 4}N`,
      days: quotation.tripRequirements.days || 5,
      nights: quotation.tripRequirements.nights || 4,
      price: perPaxPrice,
      originalPrice: Math.round(perPaxPrice * 1.15),
      discount: 15,
      currency: 'INR',
      image: selectedHotel?.imageUrl || quotation.itinerary?.find(d => d.coverMedia?.url)?.coverMedia?.url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      heroImage: selectedHotel?.imageUrl || quotation.itinerary?.find(d => d.coverMedia?.url)?.coverMedia?.url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      gallery: quotation.hotelOptions?.map(h => h.imageUrl).filter(Boolean) || [],
      category: quotation.tripRequirements.travelStyle || 'Backpacking',
      mood: quotation.tripRequirements.travelStyle || 'Adventure',
      tags: [quotation.tripRequirements.destination, quotation.tripRequirements.travelStyle || 'Adventure', 'Curated Expedition'],
      itinerary: Array.isArray(quotation.itinerary) ? quotation.itinerary : [],
      inclusions: Array.isArray(quotation.inclusions) ? quotation.inclusions : [],
      exclusions: Array.isArray(quotation.exclusions) ? quotation.exclusions : [],
      sourceQuotationId: quotation._id,
      isCustom: false,
      status: 'draft', // DRAFT ONLY - Admin completes photography, SEO, batches before publishing
      isActive: true,
      pickupPoints: selectedTransport ? [`${selectedTransport.vehicle || 'Dedicated Vehicle'} Arrival Point`] : ['Airport / Railway Station Terminal'],
      seo: {
        seoTitle: `${quotation.tripRequirements.title} | WanderLuxe Journeys`,
        metaDescription: `Experience ${quotation.tripRequirements.title} in ${quotation.tripRequirements.destination}. ${quotation.tripRequirements.duration} curated luxury itinerary.`,
        indexingDirective: 'index, follow'
      }
    };

    let createdTrip = null;
    if (isDbConnected()) {
      try {
        createdTrip = await Trip.create(tripData);
        quotation.convertedTripId = createdTrip._id;
        quotation.status = 'CONVERTED';
        quotation.statusHistory.push({
          status: 'CONVERTED',
          changedBy: userId,
          changedByName: userName,
          changedAt: new Date(),
          reason: `Converted to Draft Catalog Trip "${createdTrip.title}" (${createdTrip.slug})`
        });
        quotation.auditTrail.push({
          action: 'CONVERT_TO_TRIP',
          performedBy: userId,
          performedByName: userName,
          details: { tripId: createdTrip._id, tripSlug: createdTrip.slug },
          timestamp: new Date()
        });
        await quotation.save();
      } catch (dbErr) {
        console.warn('Trip Create DB error:', dbErr.message);
      }
    }

    if (!createdTrip) {
      createdTrip = {
        _id: 'trip_' + Date.now(),
        ...tripData,
        createdAt: new Date()
      };
      quotation.convertedTripId = createdTrip._id;
      quotation.status = 'CONVERTED';
    }

    res.status(201).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} successfully converted to Draft Catalog Trip. Complete SEO & batches in Trip CMS to publish.`,
      trip: createdTrip,
      quotation
    });
  } catch (error) {
    console.error('Convert to Trip Error:', error);
    res.status(500).json({ message: error.message || 'Server Error converting quotation to trip' });
  }
};

// ============================================================================
// 11. CONVERT TO PRIVATE BOOKING (PATH B)
// ============================================================================
// @desc    Convert an approved quotation into a live Booking order ready for payment
// @route   POST /api/quotations/:id/create-booking
// @access  Private (Sales/Admin)
export const createBookingFromQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Booking creation is unavailable while the database is disconnected.' });
    }

    let quotation = mongoose.Types.ObjectId.isValid(id)
      ? await Quotation.findById(id)
      : await Quotation.findOne({ quotationNumber: id });

    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

    // Sales Isolation & Role Check
    if (!isUserAuthorizedForQuotation(req.user, quotation) || req.user?.role?.toLowerCase() === 'marketing') {
      return res.status(403).json({ message: 'Access denied. You do not have permission to convert this quotation to a booking.' });
    }

    const userId = req.user ? (req.user._id || req.user.id) : null;
    const actorObjectId = toObjectIdOrNull(userId);
    const userName = req.user?.name || 'Sales Concierge';

    const repairConversionLinks = async (booking, addHistory = false) => {
      quotation.bookingId = booking._id;
      quotation.bookingCode = booking.bookingId;
      quotation.status = 'CONVERTED';
      quotation.updatedBy = actorObjectId;
      if (addHistory) {
        quotation.statusHistory.push({
          status: 'CONVERTED',
          changedBy: actorObjectId,
          changedByName: userName,
          changedAt: new Date(),
          reason: `Converted to Booking ${booking.bookingId}`
        });
        quotation.auditTrail.push({
          action: 'CONVERT_TO_BOOKING',
          performedBy: actorObjectId,
          performedByName: userName,
          details: { bookingId: booking._id, bookingCode: booking.bookingId },
          timestamp: new Date()
        });
      }
      await quotation.save();

      if (quotation.leadId) {
        await Lead.findByIdAndUpdate(quotation.leadId, {
          status: 'CONVERTED',
          convertedBookingId: booking._id,
          convertedBookingCode: booking.bookingId
        });
      }
    };

    // Recover either side of a previously interrupted conversion before creating anything new.
    let existingBooking = await Booking.findOne({ sourceQuotationId: quotation._id });
    if (!existingBooking && quotation.bookingId) {
      existingBooking = await Booking.findById(quotation.bookingId);
    }
    if (existingBooking) {
      const needsRepair = quotation.status !== 'CONVERTED' ||
        String(quotation.bookingId || '') !== String(existingBooking._id) ||
        quotation.bookingCode !== existingBooking.bookingId;
      if (needsRepair) await repairConversionLinks(existingBooking, quotation.status !== 'CONVERTED');
      return res.status(200).json({
        success: true,
        message: `Quotation is already linked to Booking ${existingBooking.bookingId}.`,
        booking: existingBooking,
        checkoutUrl: `/checkout?bookingId=${existingBooking.bookingId}`,
        quotation,
        isExisting: true
      });
    }

    // Only APPROVED quotations can be converted
    if (quotation.status !== 'APPROVED') {
      return res.status(400).json({ message: `Cannot create booking for quotation in "${quotation.status}" status. Only APPROVED quotations can be converted to a Booking order.` });
    }

    const bookingId = `WLX-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const verificationToken = crypto.randomBytes(16).toString('hex');
    const isPartial = quotation.paymentTerms?.paymentMode === 'PARTIAL';
    const depositAmount = quotation.pricing?.depositRequired || Math.round((quotation.pricing?.finalTotal || 0) * 0.10);
    const safeQuotation = sanitizeForCustomer(quotation);
    const selectedHotel = safeQuotation.hotelOptions?.find(h => h.selected) || null;
    const selectedTransport = (safeQuotation.transportOptions || []).filter(option => option.selected);
    const safeBookingUserId = isValidMongoObjectId(quotation.customerId)
      ? toObjectIdOrNull(quotation.customerId)
      : null;
    const finalAmount = Number(quotation.pricing?.finalTotal || 0);

    const bookingData = {
      bookingId,
      userId: safeBookingUserId,
      tripId: String(quotation.sourceTripId || `custom-quotation-${quotation.quotationNumber}`),
      tripSnapshot: {
        title: quotation.tripRequirements.title,
        location: quotation.tripRequirements.destination,
        destination: quotation.tripRequirements.destination,
        image: quotation.itinerary?.find(d => d.coverMedia?.url)?.coverMedia?.url || selectedHotel?.imageUrl || '',
        duration: quotation.tripRequirements.duration || `${quotation.tripRequirements.days}D/${quotation.tripRequirements.nights}N`,
        batchDate: quotation.tripRequirements.startDate 
          ? new Date(quotation.tripRequirements.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : ''
      },
      customer: {
        name: quotation.customerSnapshot.name,
        email: quotation.customerSnapshot.email,
        phone: quotation.customerSnapshot.phone,
        city: quotation.customerSnapshot.city || ''
      },
      travelers: [
        {
          name: quotation.customerSnapshot.name,
          phone: quotation.customerSnapshot.phone,
          email: quotation.customerSnapshot.email
        }
      ],
      numberOfTravelers: quotation.tripRequirements.totalTravelers || 1,
      occupancy: selectedHotel?.roomType || selectedHotel?.tier || 'Not specified',
      paymentPlan: {
        type: isPartial ? 'PARTIAL' : 'FULL',
        depositPercent: quotation.paymentTerms?.depositPercent || 10,
        balanceDueDays: quotation.paymentTerms?.balanceDueDays || 6
      },
      pricing: {
        basePricePerPerson: quotation.pricing?.perPersonPrice || Math.round(finalAmount / (quotation.tripRequirements.totalTravelers || 1)),
        subtotal: quotation.pricing?.subtotal || 0,
        discount: quotation.pricing?.discountAmount || 0,
        taxes: quotation.pricing?.gstAmount || 0,
        finalAmount,
        amountPaid: 0,
        amountOutstanding: finalAmount,
        balanceDueDate: new Date(Date.now() + (quotation.paymentTerms?.balanceDueDays || 6) * 24 * 60 * 60 * 1000),
        currency: 'INR'
      },
      bookingStatus: 'PENDING_PAYMENT',
      paymentStatus: 'UNPAID',
      payment: { provider: 'razorpay', status: 'PENDING' },
      sourceQuotationId: quotation._id,
      leadId: quotation.leadId || null,
      isCustomQuotationBooking: true,
      quotationSnapshot: {
        quotationNumber: quotation.quotationNumber,
        statusAtConversion: quotation.status,
        selectedHotel,
        selectedTransport,
        activities: (safeQuotation.activities || []).filter(item => item.selected !== false),
        addOns: (safeQuotation.addOns || []).filter(item => item.selected !== false),
        paymentTerms: safeQuotation.paymentTerms || null,
        depositRequired: depositAmount,
        convertedAt: new Date()
      },
      createdBy: actorObjectId,
      updatedBy: actorObjectId,
      qrCode: {
        verificationToken,
        verificationUrl: `https://wanderluxe.in/booking/verify/${verificationToken}`
      }
    };

    let createdBooking;
    let isExisting = false;
    try {
      createdBooking = await Booking.create(bookingData);
    } catch (dbErr) {
      if (dbErr?.code !== 11000) throw dbErr;
      createdBooking = await Booking.findOne({ sourceQuotationId: quotation._id });
      if (!createdBooking) throw dbErr;
      isExisting = true;
    }

    await repairConversionLinks(createdBooking, !isExisting);

    res.status(isExisting ? 200 : 201).json({
      success: true,
      message: isExisting
        ? `Quotation is already linked to Booking ${createdBooking.bookingId}.`
        : `Booking ${createdBooking.bookingId} created from Quotation ${quotation.quotationNumber}.`,
      booking: createdBooking,
      checkoutUrl: `/checkout?bookingId=${createdBooking.bookingId}`,
      quotation,
      isExisting
    });
  } catch (error) {
    console.error('Convert to Booking Error:', error);
    res.status(500).json({ message: error.message || 'Server Error creating booking from quotation' });
  }
};

// ============================================================================
// 12. PUBLIC CUSTOMER ENDPOINTS (Sanitized View & Direct Selection)
// ============================================================================
// @desc    Fetch sanitized proposal by public share token
// @route   GET /api/quotations/public/:token
// @access  Public
export const getPublicQuotationByToken = async (req, res) => {
  try {
    const { token } = req.params;

    let quotation = null;
    if (isDbConnected()) {
      try {
        quotation = await Quotation.findOne({ 'publicShare.token': token });
      } catch (e) {}
    }

    if (!quotation) {
      quotation = memoryQuotations.find(q => q.publicShare?.token === token);
    }

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation proposal not found or link has expired.' });
    }

    // Auto-advance status from SENT -> VIEWED
    if (quotation.status === 'SENT') {
      quotation.status = 'VIEWED';
      if (!quotation.publicShare.firstViewedAt) {
        quotation.publicShare.firstViewedAt = new Date();
      }
    }
    quotation.publicShare.viewCount = (quotation.publicShare.viewCount || 0) + 1;
    quotation.publicShare.lastViewedAt = new Date();

    if (isDbConnected() && typeof quotation.save === 'function') {
      await quotation.save();
    }

    const sanitized = sanitizeForCustomer(quotation);

    res.json({
      success: true,
      quotation: sanitized
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error retrieving public quotation' });
  }
};

// @desc    Customer updates selected hotel / transport options via public interactive preview
// @route   POST /api/quotations/public/:token/select-options
// @access  Public
export const updatePublicSelectedOptions = async (req, res) => {
  try {
    const { token } = req.params;
    const { selectedHotelId, selectedHotelIds, selectedTransportId, selectedAddOnIds } = req.body;

    let quotation = null;
    if (isDbConnected()) {
      try {
        quotation = await Quotation.findOne({ 'publicShare.token': token });
      } catch (e) {}
    }

    if (!quotation) {
      quotation = memoryQuotations.find(q => q.publicShare?.token === token);
    }

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation proposal not found.' });
    }

    if (['APPROVED', 'CONVERTED', 'REJECTED', 'EXPIRED'].includes(quotation.status)) {
      return res.status(400).json({ message: `Options cannot be modified while quotation status is "${quotation.status}".` });
    }

    // Update selection flags

    if (selectedHotelId && Array.isArray(quotation.hotelOptions)) {
      const targetHotel = quotation.hotelOptions.find(h => h.optionId === selectedHotelId);
      const targetSeg = targetHotel?.segmentId || 'seg_default';
      quotation.hotelOptions.forEach(h => {
        if ((h.segmentId || 'seg_default') === targetSeg) {
          h.selected = (h.optionId === selectedHotelId);
        }
      });
    } else if (Array.isArray(selectedHotelIds) && Array.isArray(quotation.hotelOptions)) {
      quotation.hotelOptions.forEach(h => {
        h.selected = selectedHotelIds.includes(h.optionId);
      });
    }

    if (selectedTransportId && Array.isArray(quotation.transportOptions)) {
      quotation.transportOptions.forEach(t => {
        t.selected = (t.optionId === selectedTransportId);
      });
    }

    if (Array.isArray(selectedAddOnIds) && Array.isArray(quotation.addOns)) {
      quotation.addOns.forEach(a => {
        a.selected = selectedAddOnIds.includes(a.addonId);
      });
    }

    // Recalculate authoritative pricing
    const computed = calculateQuotationPrice(quotation);
    quotation.hotelOptions = computed.hotelOptions;
    quotation.transportOptions = computed.transportOptions;
    quotation.activities = computed.activities;
    quotation.addOns = computed.addOns;
    quotation.pricing = computed.pricing;

    if (isDbConnected() && typeof quotation.save === 'function') {
      await quotation.save();
    }

    const sanitized = sanitizeForCustomer(quotation);

    res.json({
      success: true,
      message: 'Selections updated and pricing recalculated.',
      quotation: sanitized
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error updating quotation options' });
  }
};

// @desc    Customer records Accept / Decline decision directly on public proposal
// @route   POST /api/quotations/public/:token/decision
// @access  Public
export const customerQuotationDecision = async (req, res) => {
  try {
    const { token } = req.params;
    const { decision, customerNotes } = req.body; // decision: 'APPROVE' | 'REJECT'

    if (!decision || !['APPROVE', 'REJECT'].includes(decision.toUpperCase())) {
      return res.status(400).json({ message: 'Valid decision ("APPROVE" or "REJECT") is required.' });
    }

    let quotation = null;
    if (isDbConnected()) {
      try {
        quotation = await Quotation.findOne({ 'publicShare.token': token });
      } catch (e) {}
    }

    if (!quotation) {
      quotation = memoryQuotations.find(q => q.publicShare?.token === token);
    }

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation proposal not found.' });
    }

    const targetStatus = decision.toUpperCase() === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // Idempotent approval check for customer
    if (quotation.status === 'APPROVED' && targetStatus === 'APPROVED') {
      const sanitized = sanitizeForCustomer(quotation);
      return res.status(200).json({
        success: true,
        message: 'Thank you! Your quotation has already been approved. Our concierge team is preparing your confirmed booking order.',
        quotation: sanitized
      });
    }

    // PART 15: Expiry Guard Check
    const isExpired = quotation.validUntil && new Date(quotation.validUntil).getTime() < Date.now();
    if (isExpired && targetStatus === 'APPROVED') {
      return res.status(400).json({
        message: 'This quotation proposal has expired. Please contact your concierge specialist for a revised proposal.'
      });
    }

    if (!isValidStateTransition(quotation.status, targetStatus)) {
      return res.status(400).json({ message: `Quotation cannot be transitioned to "${targetStatus}" from current status "${quotation.status}".` });
    }

    quotation.status = targetStatus;
    quotation.publicShare.customerDecisionAt = new Date();
    if (targetStatus === 'APPROVED') {
      quotation.approvedAt = new Date();

      // Store immutable snapshot of agreed commercial terms
      quotation.approvedSnapshot = {
        approvedAt: new Date(),
        approvedBy: 'CUSTOMER',
        approvedByName: quotation.customerSnapshot?.name || 'Customer',
        version: quotation.version || 1,
        customerSnapshot: quotation.customerSnapshot,
        tripRequirements: quotation.tripRequirements,
        hotelOptions: quotation.hotelOptions,
        transportOptions: quotation.transportOptions,
        activities: quotation.activities,
        addOns: quotation.addOns,
        pricing: quotation.pricing,
        paymentTerms: quotation.paymentTerms,
        inclusions: quotation.inclusions,
        exclusions: quotation.exclusions
      };
    }
    if (customerNotes) quotation.publicShare.customerNotes = customerNotes;

    quotation.statusHistory.push({
      status: targetStatus,
      changedByName: quotation.customerSnapshot?.name || 'Customer',
      changedAt: new Date(),
      reason: customerNotes || `Decision recorded directly by traveler (${targetStatus})`
    });

    if (isDbConnected() && typeof quotation.save === 'function') {
      await quotation.save();
    }

    const sanitized = sanitizeForCustomer(quotation);

    res.json({
      success: true,
      message: targetStatus === 'APPROVED' 
        ? 'Thank you! Your quotation has been approved. Our concierge team is preparing your booking order.' 
        : 'Thank you for your feedback. Our specialist will contact you with a revised proposal.',
      quotation: sanitized
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error processing customer decision' });
  }
};

// ============================================================================
// TRANSPORT DOCUMENT ATTACH & REMOVE HELPERS
// ============================================================================
export const attachTransportDocument = async (req, res) => {
  try {
    const { id, optionId } = req.params;
    let quotation = null;
    if (isDbConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          quotation = await Quotation.findById(id);
        }
        if (!quotation) {
          quotation = await Quotation.findOne({ quotationNumber: id });
        }
      } catch (e) {}
    }
    if (!quotation) {
      quotation = memoryQuotations.find(q => String(q._id) === String(id) || q.quotationNumber === id);
    }
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    if (!isUserAuthorizedForQuotation(req.user, quotation)) {
      return res.status(403).json({ message: 'Access forbidden: You do not have permission to modify this quotation.' });
    }

    if (['APPROVED', 'CONVERTED', 'ARCHIVED'].includes(quotation.status)) {
      return res.status(409).json({ 
        message: `Quotation is in "${quotation.status}" state and cannot be directly modified. Create a revision to update travel documents.` 
      });
    }

    const transport = (quotation.transportOptions || []).find(t => t.optionId === optionId);
    if (!transport) {
      return res.status(404).json({ message: `Transport option "${optionId}" not found in quotation.` });
    }

    if (!transport.documents) transport.documents = [];

    const newDoc = {
      id: `tdoc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: req.body.type || 'TRANSPORT_VOUCHER',
      title: req.body.title || req.body.fileName || 'Travel Document',
      fileName: req.body.fileName || 'document.pdf',
      mimeType: req.body.mimeType || 'application/pdf',
      size: Number(req.body.size || 0),
      storageProvider: req.body.storageProvider || 'cloudinary',
      publicId: req.body.publicId || '',
      secureUrl: req.body.secureUrl,
      visibility: req.body.visibility || 'CUSTOMER_VISIBLE',
      passengerName: req.body.passengerName || '',
      bookingReference: req.body.bookingReference || '',
      uploadedBy: req.user?._id,
      uploadedByName: req.user?.name || req.user?.email || 'Staff',
      uploadedAt: new Date()
    };

    if (!newDoc.secureUrl) {
      return res.status(400).json({ message: 'secureUrl is required for document attachment.' });
    }

    transport.documents.push(newDoc);

    if (!quotation.auditTrail) quotation.auditTrail = [];
    quotation.auditTrail.push({
      action: 'DOCUMENT_UPLOADED',
      performedBy: req.user?._id,
      performedByName: req.user?.name || req.user?.email,
      details: `Attached ${newDoc.type} (${newDoc.fileName}) to transport ${optionId}`
    });

    if (typeof quotation.save === 'function') {
      await quotation.save();
    } else {
      quotation.updatedAt = new Date();
    }

    res.status(201).json({
      success: true,
      message: 'Transport document attached successfully',
      data: newDoc,
      quotation
    });
  } catch (error) {
    console.error('Attach Transport Document Error:', error);
    res.status(500).json({ message: error.message || 'Failed to attach transport document' });
  }
};

export const deleteTransportDocument = async (req, res) => {
  try {
    const { id, optionId, docId } = req.params;
    let quotation = null;
    if (isDbConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          quotation = await Quotation.findById(id);
        }
        if (!quotation) {
          quotation = await Quotation.findOne({ quotationNumber: id });
        }
      } catch (e) {}
    }
    if (!quotation) {
      quotation = memoryQuotations.find(q => String(q._id) === String(id) || q.quotationNumber === id);
    }
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    if (!isUserAuthorizedForQuotation(req.user, quotation)) {
      return res.status(403).json({ message: 'Access forbidden: You do not have permission to modify this quotation.' });
    }

    if (['APPROVED', 'CONVERTED', 'ARCHIVED'].includes(quotation.status)) {
      return res.status(409).json({ 
        message: `Quotation is in "${quotation.status}" state and cannot be directly modified. Create a revision to update travel documents.` 
      });
    }

    const transport = (quotation.transportOptions || []).find(t => t.optionId === optionId);
    if (!transport) {
      return res.status(404).json({ message: `Transport option "${optionId}" not found in quotation.` });
    }

    const initialLength = (transport.documents || []).length;
    transport.documents = (transport.documents || []).filter(d => d.id !== docId);

    if (transport.documents.length === initialLength) {
      return res.status(404).json({ message: `Document "${docId}" not found in transport option.` });
    }

    if (!quotation.auditTrail) quotation.auditTrail = [];
    quotation.auditTrail.push({
      action: 'DOCUMENT_REMOVED',
      performedBy: req.user?._id,
      performedByName: req.user?.name || req.user?.email,
      details: `Removed document ${docId} from transport ${optionId}`
    });

    if (typeof quotation.save === 'function') {
      await quotation.save();
    } else {
      quotation.updatedAt = new Date();
    }

    res.json({
      success: true,
      message: 'Transport document removed successfully',
      quotation
    });
  } catch (error) {
    console.error('Delete Transport Document Error:', error);
    res.status(500).json({ message: error.message || 'Failed to remove transport document' });
  }
};
