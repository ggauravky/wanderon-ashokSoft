import mongoose from 'mongoose';
import FollowUp from '../models/FollowUp.js';
import Lead from '../models/Lead.js';
import { isValidMongoObjectId, toObjectIdOrNull } from '../utils/mongoId.js';
import { sendErrorResponse } from '../utils/httpResponse.js';
import { recordStaffActivity } from '../services/staffActivityService.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

const syncLeadNextFollowUp = async (leadId) => {
  if (!leadId || !mongoose.Types.ObjectId.isValid(leadId)) return;
  const next = await FollowUp.findOne({
    leadId,
    status: { $in: ['pending', 'missed'] }
  }).sort({ scheduledAt: 1 }).select('scheduledAt').lean();
  await Lead.findByIdAndUpdate(leadId, { nextFollowUpAt: next?.scheduledAt || null });
};

// @desc    Get follow-ups (RBAC scoped to sales agent or all for admin)
// @route   GET /api/follow-ups
// @access  Private (Sales, Operations, Admin)
export const getFollowUps = async (req, res) => {
  try {
    const userRole = (req.user?.role || 'sales').toLowerCase();
    const userId = req.user?._id || req.user?.id;
    const { status, priority, leadId, upcoming } = req.query;

    const filter = {};

    // Sales role scoped to their own follow-ups
    if (userRole === 'sales' && userId) {
      filter.salesUserId = userId;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (priority && priority !== 'All') {
      filter.priority = priority;
    }

    if (leadId) {
      filter.leadId = leadId;
    }

    if (upcoming === 'true') {
      filter.status = 'pending';
      filter.scheduledAt = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
    }

    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Follow-up storage is unavailable.' });
    const followUps = await FollowUp.find(filter).populate('leadId', 'name email phone destination tripTitle').sort({ scheduledAt: 1 });

    res.json({
      success: true,
      count: followUps.length,
      followUps
    });
  } catch (error) {
    console.error('getFollowUps Error:', error);
    return sendErrorResponse(res, error, 'Unable to fetch follow-ups.');
  }
};

// @desc    Get single follow-up by ID
// @route   GET /api/follow-ups/:id
// @access  Private (Sales, Admin)
export const getFollowUpById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Follow-up storage is unavailable.' });
    const followUp = mongoose.Types.ObjectId.isValid(id) ? await FollowUp.findById(id).populate('leadId') : null;

    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    res.json({ success: true, followUp });
  } catch (error) {
    return sendErrorResponse(res, error, 'Unable to fetch the follow-up.');
  }
};

// @desc    Schedule a new CRM follow-up for a lead
// @route   POST /api/follow-ups
// @access  Private (Sales, Admin)
export const createFollowUp = async (req, res) => {
  try {
    const {
      leadId,
      customerId,
      title,
      notes,
      scheduledAt,
      callWindow,
      channel,
      priority,
      salesUserId,
      salesUserName
    } = req.body;

    if (!leadId || !title || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID, title, and scheduled date/time are required.'
      });
    }

    const candidateSalesId = salesUserId || req.user?._id;
    const assignedSalesId = (candidateSalesId && isValidMongoObjectId(candidateSalesId))
      ? toObjectIdOrNull(candidateSalesId)
      : null;
    const assignedSalesName = salesUserName || req.user?.name || 'Sales Concierge';

    const safeCustomerId = (customerId && isValidMongoObjectId(customerId))
      ? toObjectIdOrNull(customerId)
      : null;

    const safeCreatorId = (req.user?._id && isValidMongoObjectId(req.user._id))
      ? toObjectIdOrNull(req.user._id)
      : null;

    const safeLeadId = (leadId && isValidMongoObjectId(leadId))
      ? toObjectIdOrNull(leadId)
      : null;
    if (!safeLeadId) return res.status(400).json({ success: false, message: 'A valid database lead is required.' });
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Follow-up storage is unavailable.' });

    const followUpData = {
      leadId: safeLeadId,
      customerId: safeCustomerId,
      salesUserId: assignedSalesId,
      salesUserName: assignedSalesName,
      title: title.trim(),
      notes: notes || '',
      scheduledAt: new Date(scheduledAt),
      callWindow: callWindow || 'Anytime',
      channel: channel || 'call',
      priority: priority || 'medium',
      status: 'pending',
      createdBy: safeCreatorId
    };

    const newFollowUp = await FollowUp.create(followUpData);

    // Sync the Lead so the derived priority reflects this persisted action.
    if (mongoose.Types.ObjectId.isValid(leadId)) {
      const lead = await Lead.findById(leadId);
      if (lead) {
        if (lead.status === 'NEW') lead.status = 'IN_PROGRESS';
        await lead.save();
        await syncLeadNextFollowUp(lead._id);
      }
    }
    await recordStaffActivity({ req, department: 'sales', action: 'FOLLOW_UP_CREATED', entityType: 'FollowUp', entityId: newFollowUp._id, entityKey: String(newFollowUp.leadId), entityLabel: newFollowUp.title, metadata: { leadId: String(newFollowUp.leadId), scheduledAt: newFollowUp.scheduledAt } });

    res.status(201).json({
      success: true,
      message: `Follow-up scheduled for ${newFollowUp.scheduledAt.toLocaleDateString('en-IN')}.`,
      followUp: newFollowUp
    });
  } catch (error) {
    console.error('createFollowUp Error:', error);
    return sendErrorResponse(res, error, 'Unable to create the follow-up.');
  }
};

// @desc    Update / Reschedule follow-up
// @route   PUT /api/follow-ups/:id
// @access  Private (Sales, Admin)
export const updateFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, notes, scheduledAt, callWindow, channel, priority, status } = req.body;

    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Follow-up storage is unavailable.' });
    const followUp = mongoose.Types.ObjectId.isValid(id) ? await FollowUp.findById(id) : null;

    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    const previousStatus = followUp.status;
    const previousScheduledAt = followUp.scheduledAt;

    if (title) followUp.title = title.trim();
    if (notes !== undefined) followUp.notes = notes;
    if (scheduledAt) followUp.scheduledAt = new Date(scheduledAt);
    if (callWindow) followUp.callWindow = callWindow;
    if (channel) followUp.channel = channel;
    if (priority) followUp.priority = priority;
    if (status) followUp.status = status;

    await followUp.save();
    await syncLeadNextFollowUp(followUp.leadId);
    const wasRescheduled = scheduledAt && new Date(previousScheduledAt).getTime() !== new Date(followUp.scheduledAt).getTime();
    const activityAction = status === 'cancelled' ? 'FOLLOW_UP_CANCELLED' : (wasRescheduled || status === 'rescheduled') ? 'FOLLOW_UP_RESCHEDULED' : 'FOLLOW_UP_UPDATED';
    await recordStaffActivity({ req, department: 'sales', action: activityAction, entityType: 'FollowUp', entityId: followUp._id, entityKey: String(followUp.leadId), entityLabel: followUp.title, metadata: { fromStatus: previousStatus, toStatus: followUp.status, scheduledAt: followUp.scheduledAt } });

    res.json({
      success: true,
      message: 'Follow-up updated successfully.',
      followUp
    });
  } catch (error) {
    return sendErrorResponse(res, error, 'Unable to update the follow-up.');
  }
};

// @desc    Mark follow-up completed with outcome notes
// @route   PUT /api/follow-ups/:id/complete
// @access  Private (Sales, Admin)
export const completeFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { outcomeNotes, leadStatusUpdate } = req.body;

    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Follow-up storage is unavailable.' });
    const followUp = mongoose.Types.ObjectId.isValid(id) ? await FollowUp.findById(id) : null;

    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    followUp.status = 'completed';
    followUp.outcomeNotes = outcomeNotes || 'Follow-up completed successfully.';
    followUp.completedAt = new Date();
    followUp.completedBy = (req.user?._id && isValidMongoObjectId(req.user._id)) ? toObjectIdOrNull(req.user._id) : null;

    await followUp.save();
    await syncLeadNextFollowUp(followUp.leadId);
    await recordStaffActivity({ req, department: 'sales', action: 'FOLLOW_UP_COMPLETED', entityType: 'FollowUp', entityId: followUp._id, entityKey: String(followUp.leadId), entityLabel: followUp.title, metadata: { leadId: String(followUp.leadId) } });

    // Optional: update parent lead status if provided
    if (leadStatusUpdate && followUp.leadId && isDbConnected()) {
      try {
        await Lead.findByIdAndUpdate(followUp.leadId, { status: leadStatusUpdate });
      } catch (e) {}
    }

    res.json({
      success: true,
      message: 'Follow-up marked as completed.',
      followUp
    });
  } catch (error) {
    return sendErrorResponse(res, error, 'Unable to complete the follow-up.');
  }
};

// @desc    Delete / Cancel follow-up
// @route   DELETE /api/follow-ups/:id
// @access  Private (Sales, Admin)
export const deleteFollowUp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Follow-up storage is unavailable.' });
    const deleted = mongoose.Types.ObjectId.isValid(id) ? await FollowUp.findByIdAndDelete(id) : null;
    if (!deleted) return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    await syncLeadNextFollowUp(deleted.leadId);
    await recordStaffActivity({ req, department: 'sales', action: 'FOLLOW_UP_CANCELLED', entityType: 'FollowUp', entityId: deleted._id, entityKey: String(deleted.leadId), entityLabel: deleted.title, metadata: { deleted: true, scheduledAt: deleted.scheduledAt } });

    res.json({
      success: true,
      message: 'Follow-up deleted successfully.',
      id
    });
  } catch (error) {
    return sendErrorResponse(res, error, 'Unable to delete the follow-up.');
  }
};
