import mongoose from 'mongoose';
import Lead, { generateLeadReferenceId } from '../models/Lead.js';
import User from '../models/User.js';
import FollowUp from '../models/FollowUp.js';
import { resolveCustomerUserObjectId, isValidMongoObjectId, toObjectIdOrNull } from '../utils/mongoId.js';
import { sendErrorResponse } from '../utils/httpResponse.js';
import { compareLeadPriority, withLeadPriority } from '../utils/leadPriority.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// 1. CREATE LEAD / SUBMIT CALLBACK REQUEST
// ============================================================================
// @desc    Submit callback request / customized trip inquiry lead form
// @route   POST /api/leads
// @access  Public / Optional Auth
export const createLead = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'Lead service is temporarily unavailable.' });
    }
    const {
      name,
      email,
      phone,
      leadType,
      tripId,
      tripRef,
      tripSlug,
      tripTitle,
      tripPriceSnapshot,
      selectedBatch,
      destination,
      travelersCount,
      travelMonth,
      travelDate,
      budgetPerPerson,
      preferredCallDate,
      preferredCallWindow,
      topics,
      message,
      source
    } = req.body;

    // 1. Strict Server-Side Validations
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Please provide a valid full name (at least 2 characters).' });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = String(phone || '').replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit phone number.' });
    }

    if (preferredCallDate) {
      const parsedDate = new Date(preferredCallDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Please provide a valid callback date.' });
      }
    }

    const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`;
    const determinedLeadType = leadType || (preferredCallWindow ? 'callback_request' : 'trip_enquiry');
    const allowedSources = [
      'trip_page',
      'contact_page',
      'booking_page',
      'custom_inquiry',
      'Website Lead Form',
      'website_lead_form',
      'expert_inquiry',
      'callback_request',
      'expert_callback_modal'
    ];
    const determinedSource = (source && allowedSources.includes(source))
      ? source
      : (tripId ? 'trip_page' : 'custom_inquiry');
    const validCallWindows = ['Morning', 'Afternoon', 'Evening', 'Anytime', ''];
    const safeCallWindow = validCallWindows.includes(preferredCallWindow) ? preferredCallWindow : 'Anytime';

    // Securely resolve authenticated customer user ObjectId (Staff roles or synthetic IDs resolve to null)
    const authUserId = await resolveCustomerUserObjectId(req.user);

    // Calculate priority based on group size and intent
    const parsedPax = Number(travelersCount) || 1;
    let calculatedPriority = 'MEDIUM';
    if (parsedPax >= 4 || (Array.isArray(topics) && topics.some(t => /discount|custom|corporate/i.test(t)))) {
      calculatedPriority = 'HIGH';
    }

    // Parse structured topics
    let cleanTopics = [];
    if (Array.isArray(topics)) {
      cleanTopics = topics.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim());
    } else if (typeof topics === 'string' && topics.trim()) {
      cleanTopics = topics.split(',').map(t => t.trim()).filter(Boolean);
    }

    // 2. Duplicate / Spam Throttling (15-minute cool-down window per user/trip)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const queryFilter = {
      createdAt: { $gte: fifteenMinutesAgo },
      $or: [
        { email: cleanEmail },
        { phone: formattedPhone },
        { phone: cleanPhone }
      ]
    };

    if (tripId) queryFilter.tripId = String(tripId);

    const existingLead = await Lead.findOne(queryFilter).sort({ createdAt: -1 });
    if (existingLead) {
      return res.status(200).json({
        success: true,
        isDuplicateThrottled: true,
        message: 'We already received your inquiry for this journey! Our certified travel specialist is preparing your details and will connect with you shortly.',
        lead: existingLead
      });
    }

    // 3. Create and Persist Lead (With Reference ID retry)
    let referenceId = generateLeadReferenceId();

    // Safely resolve tripRef if candidate is a valid ObjectId
    let validTripRef = null;
    if (tripRef && isValidMongoObjectId(tripRef)) {
      validTripRef = toObjectIdOrNull(tripRef);
    } else if (!tripRef && tripId && isValidMongoObjectId(tripId)) {
      validTripRef = toObjectIdOrNull(tripId);
    }

    const leadPayload = {
      referenceId,
      name: name.trim(),
      email: cleanEmail,
      phone: formattedPhone,
      leadType: determinedLeadType,
      priority: calculatedPriority,
      tripId: tripId ? String(tripId) : '',
      tripRef: validTripRef,
      tripSlug: tripSlug ? String(tripSlug).trim() : '',
      tripTitle: tripTitle ? String(tripTitle).trim() : '',
      tripTitleSnapshot: tripTitle ? String(tripTitle).trim() : '',
      tripPriceSnapshot: Number(tripPriceSnapshot) || 0,
      selectedBatch: selectedBatch ? String(selectedBatch).trim() : '',
      destination: destination || (tripTitle ? String(tripTitle) : 'Expedition'),
      travelersCount: parsedPax,
      travelMonth: travelMonth || '',
      travelDate: travelDate || '',
      budgetPerPerson: budgetPerPerson || '',
      preferredCallDate: preferredCallDate || new Date().toISOString().split('T')[0],
      preferredCallWindow: safeCallWindow,
      topics: cleanTopics,
      userId: authUserId,
      message: message ? String(message).trim() : '',
      status: 'NEW',
      source: determinedSource,
      assignedTo: 'Sales Concierge Team',
      assignedToUser: null,
      assignedToUserName: '',
      whatsappNotification: {
        sent: false,
        status: 'NOT_CONFIGURED',
        sentAt: null
      }
    };

    let newLead = null;
    let retries = 3;
    while (retries > 0) {
      try {
        newLead = await Lead.create(leadPayload);
        break;
      } catch (dbErr) {
        if (dbErr.code === 11000 && retries > 1) {
          retries--;
          leadPayload.referenceId = generateLeadReferenceId();
          continue;
        }
        throw dbErr;
      }
    }

    if (!newLead || (!newLead._id && !newLead.referenceId)) {
      return res.status(500).json({
        success: false,
        message: 'Unable to schedule callback right now. Please try again.'
      });
    }

    const confirmationMsg = determinedLeadType === 'callback_request'
      ? `Thank you, ${newLead.name.split(' ')[0]}! Your callback request has been scheduled for ${newLead.preferredCallDate} (${newLead.preferredCallWindow} window). Our travel specialist will call you directly.`
      : 'Thank you! Your custom trip inquiry has been received. Our concierge team will contact you within 2 hours.';

    res.status(201).json({
      success: true,
      message: confirmationMsg,
      lead: newLead
    });
  } catch (error) {
    console.error('Lead submission error:', {
      name: error.name,
      message: error.message,
      errors: error.errors
        ? Object.keys(error.errors).map(k => ({
            path: k,
            kind: error.errors[k].kind,
            message: error.errors[k].message
          }))
        : null
    });
    res.status(500).json({
      success: false,
      message: 'Unable to schedule callback right now. Please try again or connect with us directly on WhatsApp.'
    });
  }
};

// ============================================================================
// 2. GET LEADS (Filtered with RBAC Scoping & Pagination)
// ============================================================================
// @desc    Get lead inquiries with RBAC Scoping, Search, Filtering & Privacy Masking
// @route   GET /api/leads
// @access  Private (Super Admin, Admin, Operations, Sales, Marketing)
export const getLeads = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Lead service is temporarily unavailable.' });
    const userRole = (req.user?.role || 'admin').toLowerCase();
    const userId = req.user?._id || req.user?.id;
    const userName = req.user?.name || '';
    const isSuperOrAdmin = ['admin', 'super_admin', 'operations'].includes(userRole);

    const {
      search,
      status,
      priority,
      leadType,
      destination,
      assignedToUser,
      quickFilter,
      page = 1,
      limit = 100,
      sortBy = 'newest',
      envelope
    } = req.query;

    const andConditions = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // RBAC Scoping for Sales:
    // Sales strictly operates on the Shared Sales Queue for Travel Expert Requests (leadType = 'callback_request').
    // Server-authoritative: Sales is forced to callback_request regardless of query parameters.
    // All Sales employees see ALL callback_request leads with NO ownership or assignedToUser restriction.
    if (userRole === 'sales' && !isSuperOrAdmin) {
      andConditions.push({ leadType: 'callback_request' });
    } else {
      // Non-sales roles (Admin/Operations) can filter by leadType if provided
      if (leadType && leadType !== 'all') {
        andConditions.push({ leadType });
      }
    }

    // Quick Filter support
    if (quickFilter) {
      if (quickFilter === 'due_today') {
        andConditions.push({
          status: { $nin: ['CONVERTED', 'LOST'] },
          $or: [
            { preferredCallDate: todayStr },
            { nextFollowUpAt: { $gte: todayStart, $lt: tomorrowStart } }
          ]
        });
      } else if (quickFilter === 'overdue') {
        andConditions.push({
          $or: [
            { preferredCallDate: { $ne: '', $lt: todayStr } },
            { nextFollowUpAt: { $lt: todayStart } }
          ],
          status: { $nin: ['CONVERTED', 'LOST'] }
        });
      } else if (quickFilter === 'new') {
        andConditions.push({ status: 'NEW' });
      } else if (quickFilter === 'in_progress') {
        andConditions.push({ status: { $in: ['IN_PROGRESS', 'CONTACTED'] } });
      } else if (quickFilter === 'qualified') {
        andConditions.push({ status: 'QUALIFIED' });
      } else if (quickFilter === 'unassigned' && isSuperOrAdmin) {
        andConditions.push({
          $and: [
            {
              $or: [
                { assignedToUser: null },
                { assignedToUser: { $exists: false } }
              ]
            },
            {
              $or: [
                { assignedTo: null },
                { assignedTo: '' },
                { assignedTo: 'Sales Concierge Team' },
                { assignedTo: 'Unassigned' },
                { assignedTo: { $exists: false } }
              ]
            }
          ]
        });
      } else if (quickFilter === 'mine' && userId && isSuperOrAdmin) {
        andConditions.push({
          $or: [
            ...(mongoose.Types.ObjectId.isValid(userId) ? [{ assignedToUser: userId }] : []),
            { assignedTo: userName }
          ]
        });
      }
    }

    // Specific user assignment filter (only for general CRM admin workflows, not restricting sales shared queue)
    if (assignedToUser && isSuperOrAdmin) {
      if (assignedToUser === 'unassigned') {
        andConditions.push({
          $or: [
            { assignedToUser: null },
            { assignedTo: 'Sales Concierge Team' },
            { assignedTo: '' }
          ]
        });
      } else if (assignedToUser === 'my' && userId) {
        andConditions.push({
          $or: [
            ...(mongoose.Types.ObjectId.isValid(userId) ? [{ assignedToUser: userId }] : []),
            { assignedTo: userName }
          ]
        });
      } else if (mongoose.Types.ObjectId.isValid(assignedToUser)) {
        andConditions.push({ assignedToUser: assignedToUser });
      }
    }

    // Status filter
    if (status && status !== 'all') {
      andConditions.push({ status });
    }

    // The shared Expert Requests queue filters by the derived, time-aware
    // priority after enrichment. Other CRM consumers retain the persisted
    // priority filter for backwards compatibility.
    if (priority && priority !== 'all' && userRole !== 'sales' && leadType !== 'callback_request') {
      andConditions.push({ priority: String(priority).toUpperCase() });
    }

    // Destination filter
    if (destination && destination !== 'all') {
      andConditions.push({ destination: { $regex: destination, $options: 'i' } });
    }

    // Search query
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      andConditions.push({
        $or: [
          { referenceId: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
          { tripTitle: { $regex: q, $options: 'i' } },
          { destination: { $regex: q, $options: 'i' } }
        ]
      });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(limit) || 100));
    const usesEffectivePriority = userRole === 'sales' || leadType === 'callback_request';
    let total;
    let leads;

    if (usesEffectivePriority) {
      const candidates = await Lead.find(filter)
        .populate('assignedToUser', 'name email role avatar phone')
        .populate('tripRef', 'title slug price destination location')
        .populate('quotations', 'quotationNumber status pricing createdAt')
        .populate('convertedBookingId', 'bookingId bookingStatus paymentStatus pricing')
        .lean();
      const leadIds = candidates.map((lead) => lead._id).filter(Boolean);
      const followUps = leadIds.length
        ? await FollowUp.find({ leadId: { $in: leadIds }, status: { $in: ['pending', 'missed'] } }).select('leadId scheduledAt status').lean()
        : [];
      const followUpsByLead = new Map();
      followUps.forEach((followUp) => {
        const key = String(followUp.leadId);
        const entries = followUpsByLead.get(key) || [];
        entries.push(followUp);
        followUpsByLead.set(key, entries);
      });
      let prioritized = candidates.map((lead) => withLeadPriority(lead, {
        followUps: followUpsByLead.get(String(lead._id)) || []
      }));
      if (priority && priority !== 'all') {
        prioritized = prioritized.filter((lead) => lead.effectivePriority === String(priority).toUpperCase());
      }
      if (sortBy === 'oldest') prioritized.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      else if (sortBy === 'newest') prioritized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      else if (sortBy === 'updated') prioritized.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      else prioritized.sort(compareLeadPriority);
      total = prioritized.length;
      leads = prioritized.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    } else {
      let sortObj = { createdAt: -1 };
      if (sortBy === 'updated') sortObj = { updatedAt: -1 };
      else if (sortBy === 'oldest') sortObj = { createdAt: 1 };
      total = await Lead.countDocuments(filter);
      leads = await Lead.find(filter)
        .sort(sortObj)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .populate('assignedToUser', 'name email role avatar phone')
        .populate('tripRef', 'title slug price destination location')
        .populate('quotations', 'quotationNumber status pricing createdAt')
        .populate('convertedBookingId', 'bookingId bookingStatus paymentStatus pricing')
        .lean();
      leads = leads.map((lead) => withLeadPriority(lead));
    }

    // Marketing role: Privacy masking on customer contact data
    if (userRole === 'marketing') {
      leads = leads.map(l => {
        const doc = l.toObject ? l.toObject() : { ...l };
        if (doc.phone) {
          doc.phone = doc.phone.replace(/(\+?\d{1,3}\s*\d{2})\d+(\d{2})/, '$1******$2');
        }
        if (doc.email) {
          doc.email = doc.email.replace(/(.{2}).+(@.+)/, '$1***$2');
        }
        return doc;
      });
    }

    if (envelope === 'true' || req.query.paginated === 'true') {
      return res.json({
        success: true,
        items: leads,
        leads,
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize)
      });
    }

    res.json(leads);
  } catch (error) {
    console.error('Get leads error:', error);
    return sendErrorResponse(res, error, 'Unable to fetch leads.');
  }
};

// ============================================================================
// 3. GET SINGLE LEAD BY ID / REFERENCE ID
// ============================================================================
// @desc    Get detailed lead dossier with populated history
// @route   GET /api/leads/:id
// @access  Private (Super Admin, Admin, Operations, Sales)
export const getLeadById = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Lead service is temporarily unavailable.' });
    const { id } = req.params;
    const userRole = (req.user?.role || 'admin').toLowerCase();
    const userId = req.user?._id || req.user?.id;
    const isSuperOrAdmin = ['admin', 'super_admin', 'operations'].includes(userRole);

    let lead = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      lead = await Lead.findById(id)
        .populate('assignedToUser', 'name email role avatar phone')
        .populate('tripRef', 'title slug price destination location image')
        .populate('quotations', 'quotationNumber status pricing createdAt bookingCode')
        .populate('convertedBookingId', 'bookingId bookingStatus paymentStatus pricing')
        .populate('userId', 'name email phone avatar');
    }
    if (!lead) {
      lead = await Lead.findOne({ referenceId: id })
        .populate('assignedToUser', 'name email role avatar phone')
        .populate('tripRef', 'title slug price destination location image')
        .populate('quotations', 'quotationNumber status pricing createdAt bookingCode')
        .populate('convertedBookingId', 'bookingId bookingStatus paymentStatus pricing')
        .populate('userId', 'name email phone avatar');
    }

    if (!lead) {
      return res.status(404).json({ message: 'Lead dossier not found.' });
    }

    // Role check:
    // For callback_request (Expert Requests), all sales specialists operate on a shared queue with full access.
    // Non-callback lead types remain restricted from unauthorized sales access.
    if (userRole === 'sales' && !isSuperOrAdmin) {
      if (lead.leadType !== 'callback_request') {
        return res.status(403).json({ message: 'Access denied: Sales portal is restricted to Travel Expert Requests.' });
      }
    }

    const followUps = await FollowUp.find({
      leadId: lead._id,
      status: { $in: ['pending', 'missed'] }
    }).select('leadId scheduledAt status').lean();

    res.json({
      success: true,
      lead: withLeadPriority(lead, { followUps })
    });
  } catch (error) {
    console.error('Get lead by ID error:', error);
    return sendErrorResponse(res, error, 'Unable to fetch lead details.');
  }
};

// ============================================================================
// 4. ATOMIC SALES CLAIM
// ============================================================================
// @desc    Atomic 1-click claim of unassigned lead by sales agent
// @route   POST /api/leads/:id/claim
// @access  Private (Sales, Operations, Admin)
export const claimLead = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Lead service is temporarily unavailable.' });
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;
    const userName = req.user?.name || 'Sales Specialist';

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required to claim lead.' });
    }

    let targetLead = mongoose.Types.ObjectId.isValid(id) ? await Lead.findById(id) : null;
    if (!targetLead) targetLead = await Lead.findOne({ referenceId: id });

    if (!targetLead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    if (targetLead.leadType === 'callback_request') {
      return res.status(400).json({
        success: false,
        message: 'Expert Requests use the shared Sales queue and cannot be claimed.'
      });
    }

    let lead = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Atomic find and update: only update if currently unassigned or assigned to generic team
      lead = await Lead.findOneAndUpdate(
        {
          _id: id,
          $or: [
            { assignedToUser: null },
            { assignedTo: 'Sales Concierge Team' },
            { assignedTo: '' },
            { assignedTo: null },
            ...(userId && mongoose.Types.ObjectId.isValid(userId) ? [{ assignedToUser: userId }] : []),
            { assignedTo: userName }
          ]
        },
        {
          $set: {
            assignedToUser: (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : null,
            assignedToUserName: userName,
            assignedTo: userName,
            assignedAt: new Date(),
            assignedBy: (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : null,
            assignedByName: userName,
            status: 'IN_PROGRESS'
          }
        },
        { new: true }
      ).populate('assignedToUser', 'name email role avatar phone');

      if (!lead) {
        // Check if lead exists but was already claimed by someone else
        const existing = await Lead.findById(id);
        if (existing) {
          return res.status(409).json({
            message: `Lead has already been claimed by ${existing.assignedToUserName || existing.assignedTo || 'another specialist'}.`,
            assignedTo: existing.assignedToUserName || existing.assignedTo
          });
        }
        return res.status(404).json({ message: 'Lead not found.' });
      }
    } else return res.status(400).json({ message: 'A valid database lead ID is required.' });

    res.json({
      success: true,
      message: `Lead ${lead.referenceId || lead._id} successfully claimed. You are now the primary specialist.`,
      lead
    });
  } catch (error) {
    console.error('Claim lead error:', error);
    return sendErrorResponse(res, error, 'Unable to claim the lead.');
  }
};

// ============================================================================
// 5. ASSIGN LEAD TO SALES SPECIALIST (NO WINDOW.PROMPT)
// ============================================================================
// @desc    Assign lead to specific sales specialist with audit
// @route   PUT /api/leads/:id/assign
// @access  Private (Super Admin, Admin, Operations)
export const assignLead = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Lead service is temporarily unavailable.' });
    const { id } = req.params;
    const assignedToName = req.body.assignedToName || req.body.assignedTo;
    const assignedToUserId = req.body.assignedToUserId || req.body.assignedToId || req.body.assignedToUser;
    const notes = req.body.notes;
    const assignerId = req.user?._id || req.user?.id;
    const assignerName = req.user?.name || 'Administrator';

    if (!assignedToUserId && !assignedToName) {
      return res.status(400).json({ message: 'Target specialist user ID or name is required.' });
    }

    let targetUser = null;
    if (assignedToUserId && mongoose.Types.ObjectId.isValid(assignedToUserId)) {
      try {
        targetUser = await User.findById(assignedToUserId).select('name email role avatar');
      } catch (e) {}
    }

    const finalUserId = targetUser ? targetUser._id : (assignedToUserId && mongoose.Types.ObjectId.isValid(assignedToUserId) ? assignedToUserId : null);
    const finalUserName = targetUser ? targetUser.name : (assignedToName || 'Sales Specialist');

    let lead = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      lead = await Lead.findById(id);
      if (!lead) return res.status(404).json({ message: 'Lead not found.' });

      if (lead.leadType === 'callback_request') {
        return res.status(400).json({
          success: false,
          message: 'Expert Requests use the shared Sales queue and cannot be assigned.'
        });
      }

      lead.assignedToUser = finalUserId;
      lead.assignedToUserName = finalUserName;
      lead.assignedTo = finalUserName;
      lead.assignedAt = new Date();
      lead.assignedBy = (assignerId && mongoose.Types.ObjectId.isValid(assignerId)) ? assignerId : null;
      lead.assignedByName = assignerName;
      if (notes !== undefined && notes !== '') lead.notes = notes;
      if (lead.status === 'NEW') lead.status = 'IN_PROGRESS';

      await lead.save();
      if (lead.assignedToUser) {
        await lead.populate('assignedToUser', 'name email role avatar phone');
      }
    } else return res.status(400).json({ message: 'A valid database lead ID is required.' });

    res.json({
      success: true,
      message: `Lead successfully assigned to ${finalUserName}.`,
      lead
    });
  } catch (error) {
    console.error('Assign lead error:', error);
    return sendErrorResponse(res, error, 'Unable to assign the lead.');
  }
};

// ============================================================================
// 6. LOG CONTACT OUTCOME & AUTO-SCHEDULE FOLLOW-UP
// ============================================================================
// @desc    Log a call or WhatsApp contact attempt, auto-transition status
// @route   POST /api/leads/:id/log-contact
// @access  Private (Sales, Operations, Admin)
export const logLeadContact = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Lead service is temporarily unavailable.' });
    const { id } = req.params;
    const {
      outcome,
      channel = 'call',
      notes = '',
      nextFollowUpDate,
      nextFollowUpWindow = 'Anytime',
      nextFollowUpNotes = ''
    } = req.body;

    const outcomeMap = {
      'spoke_interested': 'CONNECTED',
      'connected': 'CONNECTED',
      'no_answer': 'NO_ANSWER',
      'busy': 'BUSY',
      'call_later': 'CALL_LATER',
      'call_back_later': 'CALL_LATER',
      'wrong_number': 'WRONG_NUMBER',
      'whatsapp_sent': 'WHATSAPP_SENT',
      'whatsapp_shared': 'WHATSAPP_SENT',
      'email_sent': 'EMAIL_SENT',
      'budget_unfit': 'BUSY',
      'dates_not_final': 'CALL_LATER'
    };
    const normalizedOutcome = outcomeMap[outcome?.toLowerCase?.()] || outcome?.toUpperCase?.();
    const validOutcomes = ['CONNECTED', 'BUSY', 'CALL_LATER', 'WRONG_NUMBER', 'WHATSAPP_SENT', 'EMAIL_SENT', 'NO_ANSWER'];
    if (!normalizedOutcome || !validOutcomes.includes(normalizedOutcome)) {
      return res.status(400).json({ message: `Please provide a valid contact outcome (${validOutcomes.join(', ')}).` });
    }

    const userId = req.user?._id || req.user?.id;
    const userName = req.user?.name || 'Sales Specialist';
    const userRole = (req.user?.role || 'sales').toLowerCase();
    const isSuperOrAdmin = ['admin', 'super_admin', 'operations'].includes(userRole);

    const lead = mongoose.Types.ObjectId.isValid(id) ? await Lead.findById(id) : null;

    if (!lead) return res.status(404).json({ message: 'Lead record not found.' });

    // IDOR protection:
    // For callback_request (Expert Requests), all sales specialists operate on a shared queue and can log contacts.
    // For other lead types, sales cannot log contact on a lead assigned to another specialist.
    if (userRole === 'sales' && !isSuperOrAdmin) {
      if (lead.leadType !== 'callback_request') {
        const assignedId = lead.assignedToUser ? String(lead.assignedToUser._id || lead.assignedToUser) : null;
        const isUnassigned = (!assignedId && (!lead.assignedTo || lead.assignedTo === 'Sales Concierge Team' || lead.assignedTo === 'Unassigned' || lead.assignedTo === ''));
        const isAssignedToMe = (assignedId && assignedId === String(userId)) || (lead.assignedTo && lead.assignedTo === userName);
        const isOwner = isUnassigned || isAssignedToMe;
        if (!isOwner) {
          return res.status(403).json({ message: 'Access denied: You cannot log contact for a lead assigned to another specialist.' });
        }
      }
    }

    // 1. Append Call Outcome
    const outcomeEntry = {
      outcome: normalizedOutcome,
      channel,
      notes: notes.trim(),
      loggedAt: new Date(),
      loggedBy: (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : null,
      loggedByName: userName
    };

    if (!Array.isArray(lead.callOutcomes)) {
      lead.callOutcomes = [];
    }
    lead.callOutcomes.unshift(outcomeEntry);

    // 2. Update contact metrics
    lead.contactCount = (lead.contactCount || 0) + 1;
    lead.lastContactAt = new Date();
    if (!lead.firstContactAt) {
      lead.firstContactAt = new Date();
    }

    // Auto-advance status if currently NEW or IN_PROGRESS
    if (lead.status === 'NEW' || lead.status === 'IN_PROGRESS') {
      if (normalizedOutcome === 'CONNECTED') {
        lead.status = 'CONTACTED';
      } else if (lead.status === 'NEW') {
        lead.status = 'IN_PROGRESS';
      }
    }

    // 3. Handle Next Follow-Up if requested
    let createdFollowUp = null;
    if (nextFollowUpDate) {
      const scheduledDate = new Date(nextFollowUpDate);
      if (!isNaN(scheduledDate.getTime())) {
        lead.nextFollowUpAt = scheduledDate;

        try {
          createdFollowUp = await FollowUp.create({
              leadId: lead._id,
              customerId: (lead.userId && mongoose.Types.ObjectId.isValid(lead.userId)) ? lead.userId : null,
              salesUserId: (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : null,
              salesUserName: userName,
              title: `Follow-up on ${lead.tripTitle || lead.destination} (${normalizedOutcome})`,
              notes: nextFollowUpNotes || notes || `Follow-up after ${normalizedOutcome.toLowerCase()}`,
              scheduledAt: scheduledDate,
              callWindow: nextFollowUpWindow,
              channel: channel === 'whatsapp' ? 'whatsapp' : 'call',
              priority: lead.priority === 'HIGH' || lead.priority === 'URGENT' ? 'high' : 'medium',
              status: 'pending'
          });
        } catch (fuErr) {
          console.warn('FollowUp DB create notice:', fuErr.message);
        }
      }
    }

    await lead.save();
    await lead.populate('assignedToUser', 'name email role avatar phone');

    res.json({
      success: true,
      message: `Contact outcome "${outcome}" logged successfully.`,
      lead: withLeadPriority(lead, { followUps: createdFollowUp ? [createdFollowUp] : [] }),
      followUp: createdFollowUp
    });
  } catch (error) {
    console.error('Log contact error:', error);
    return sendErrorResponse(res, error, 'Unable to log the contact.');
  }
};

// ============================================================================
// 7. UPDATE LEAD STATUS & NOTES
// ============================================================================
// @desc    Update lead status, priority, and notes
// @route   PUT /api/leads/:id/status
// @access  Private (Sales, Operations, Admin)
export const updateLeadStatus = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Lead service is temporarily unavailable.' });
    const { id } = req.params;
    const { status, priority, notes, lostReason, lostReasonDetail } = req.body;
    const userId = req.user?._id || req.user?.id;
    const userName = req.user?.name || 'Sales Specialist';
    const userRole = (req.user?.role || 'sales').toLowerCase();
    const isSuperOrAdmin = ['admin', 'super_admin', 'operations'].includes(userRole);

    const validStatuses = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'QUALIFIED', 'CONVERTED', 'LOST'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Choose from: ${validStatuses.join(', ')}` });
    }

    if (status === 'LOST' && !lostReason) {
      return res.status(400).json({ message: 'A reason is required when marking a lead as LOST (e.g. Budget Mismatch, Date Unavailable, Booked Elsewhere).' });
    }

    const lead = mongoose.Types.ObjectId.isValid(id) ? await Lead.findById(id) : null;

    if (!lead) return res.status(404).json({ message: 'Lead record not found.' });

    // IDOR protection:
    // For callback_request (Expert Requests), all sales specialists operate on a shared queue and can update status.
    // For other lead types, sales cannot update a lead assigned to another specialist.
    if (userRole === 'sales' && !isSuperOrAdmin) {
      if (lead.leadType !== 'callback_request') {
        const assignedId = lead.assignedToUser ? String(lead.assignedToUser._id || lead.assignedToUser) : null;
        const isUnassigned = (!assignedId && (!lead.assignedTo || lead.assignedTo === 'Sales Concierge Team' || lead.assignedTo === 'Unassigned' || lead.assignedTo === ''));
        const isAssignedToMe = (assignedId && assignedId === String(userId)) || (lead.assignedTo && lead.assignedTo === userName);
        const isOwner = isUnassigned || isAssignedToMe;
        if (!isOwner) {
          return res.status(403).json({ message: 'Access denied: You cannot update a lead assigned to another specialist.' });
        }
      }
    }

    if (status) lead.status = status;
    if (priority) lead.priority = priority;
    if (notes !== undefined) lead.notes = notes;
    if (lostReason) lead.lostReason = lostReason;
    if (lostReasonDetail) lead.lostReasonDetail = lostReasonDetail;

    await lead.save();
    await lead.populate('assignedToUser', 'name email role avatar phone');

    res.json({
      success: true,
      message: `Lead updated to status ${lead.status}.`,
      lead: withLeadPriority(lead)
    });
  } catch (error) {
    console.error('Update lead status error:', error);
    return sendErrorResponse(res, error, 'Unable to update the lead status.');
  }
};

// ============================================================================
// 8. GET SALES SPECIALISTS LIST
// ============================================================================
// @desc    Get active sales specialists & admins available for lead assignment with workload
// @route   GET /api/leads/sales-users
// @access  Private (Admin, Operations, Sales)
export const getSalesUsers = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Lead service is temporarily unavailable.' });
    let salesUsers = [];
      const queryRole = req.query.role;
      const roleFilter = queryRole 
        ? { role: queryRole } 
        : { role: { $in: ['sales', 'admin', 'super_admin', 'operations'] } };

      const rawUsers = await User.find({
        ...roleFilter,
        isActive: { $ne: false }
      }).select('name email role avatar phone').lean();

      // Aggregate active assigned leads count per user
      const activeLeadCounts = await Lead.aggregate([
        {
          $match: {
            status: { $in: ['NEW', 'CONTACTED', 'IN_PROGRESS', 'QUALIFIED'] },
            assignedToUser: { $ne: null }
          }
        },
        {
          $group: {
            _id: '$assignedToUser',
            activeCount: { $sum: 1 }
          }
        }
      ]);

      const countMap = {};
      activeLeadCounts.forEach(c => {
        countMap[String(c._id)] = c.activeCount;
      });

      salesUsers = rawUsers.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        phone: u.phone,
        activeLeadsCount: countMap[String(u._id)] || 0
      }));
    res.json({
      success: true,
      count: salesUsers.length,
      users: salesUsers
    });
  } catch (error) {
    console.error('Get sales users error:', error);
    return sendErrorResponse(res, error, 'Unable to fetch sales users.');
  }
};
