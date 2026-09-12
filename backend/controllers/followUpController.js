import mongoose from 'mongoose';
import FollowUp from '../models/FollowUp.js';
import Lead from '../models/Lead.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

export let memoryFollowUps = [
  {
    _id: 'fu_1',
    leadId: 'lead_1',
    salesUserId: 'usr_sales_1',
    salesUserName: 'Gaurav Concierge',
    title: 'Follow-up regarding Spiti Valley quad sharing and pickup timings',
    notes: 'Customer inquired about 4-person group pricing and requested an afternoon callback.',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    callWindow: 'Afternoon',
    channel: 'call',
    priority: 'high',
    status: 'pending',
    outcomeNotes: '',
    createdAt: new Date()
  },
  {
    _id: 'fu_2',
    leadId: 'lead_2',
    salesUserId: 'usr_sales_1',
    salesUserName: 'Gaurav Concierge',
    title: 'Discuss Meghalaya Living Root Bridges custom dates',
    notes: 'Requested private cab upgrade information.',
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    callWindow: 'Evening',
    channel: 'whatsapp',
    priority: 'medium',
    status: 'pending',
    outcomeNotes: '',
    createdAt: new Date()
  }
];

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

    let followUps = [];
    if (isDbConnected()) {
      try {
        followUps = await FollowUp.find(filter).populate('leadId', 'name email phone destination tripTitle').sort({ scheduledAt: 1 });
      } catch (dbErr) {
        console.warn('FollowUp DB query warning:', dbErr.message);
      }
    }

    if (followUps.length === 0) {
      followUps = memoryFollowUps.filter(f => {
        if (userRole === 'sales' && userId && String(f.salesUserId) !== String(userId) && String(f.salesUserId) !== 'usr_sales_1') return false;
        if (status && status !== 'All' && f.status !== status) return false;
        if (priority && priority !== 'All' && f.priority !== priority) return false;
        if (leadId && String(f.leadId) !== String(leadId)) return false;
        return true;
      });
    }

    res.json({
      success: true,
      count: followUps.length,
      followUps
    });
  } catch (error) {
    console.error('getFollowUps Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error fetching follow-ups' });
  }
};

// @desc    Get single follow-up by ID
// @route   GET /api/follow-ups/:id
// @access  Private (Sales, Admin)
export const getFollowUpById = async (req, res) => {
  try {
    const { id } = req.params;
    let followUp = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        followUp = await FollowUp.findById(id).populate('leadId');
      } catch (e) {}
    }

    if (!followUp) {
      followUp = memoryFollowUps.find(f => String(f._id) === String(id));
    }

    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    res.json({ success: true, followUp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error fetching follow-up' });
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

    const assignedSalesId = salesUserId || req.user?._id || new mongoose.Types.ObjectId('64f000000000000000000001');
    const assignedSalesName = salesUserName || req.user?.name || 'Sales Concierge';

    const followUpData = {
      leadId: mongoose.Types.ObjectId.isValid(leadId) ? leadId : new mongoose.Types.ObjectId('64f000000000000000000002'),
      customerId: customerId || null,
      salesUserId: assignedSalesId,
      salesUserName: assignedSalesName,
      title: title.trim(),
      notes: notes || '',
      scheduledAt: new Date(scheduledAt),
      callWindow: callWindow || 'Anytime',
      channel: channel || 'call',
      priority: priority || 'medium',
      status: 'pending',
      createdBy: req.user?._id
    };

    let newFollowUp = null;
    if (isDbConnected()) {
      try {
        newFollowUp = await FollowUp.create(followUpData);
        // Sync Lead document
        if (mongoose.Types.ObjectId.isValid(leadId)) {
          const lead = await Lead.findById(leadId);
          if (lead) {
            lead.nextFollowUpAt = newFollowUp.scheduledAt;
            if (lead.status === 'NEW') lead.status = 'IN_PROGRESS';
            await lead.save();
          }
        }
      } catch (dbErr) {
        console.warn('FollowUp DB save warning:', dbErr.message);
      }
    }

    if (!newFollowUp) {
      newFollowUp = {
        _id: 'fu_' + Date.now(),
        ...followUpData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryFollowUps.unshift(newFollowUp);
    }

    res.status(201).json({
      success: true,
      message: `Follow-up scheduled for ${newFollowUp.scheduledAt.toLocaleDateString('en-IN')}.`,
      followUp: newFollowUp
    });
  } catch (error) {
    console.error('createFollowUp Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error creating follow-up' });
  }
};

// @desc    Update / Reschedule follow-up
// @route   PUT /api/follow-ups/:id
// @access  Private (Sales, Admin)
export const updateFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, notes, scheduledAt, callWindow, channel, priority, status } = req.body;

    let followUp = null;
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        followUp = await FollowUp.findById(id);
      } catch (e) {}
    }

    if (!followUp) {
      const memIndex = memoryFollowUps.findIndex(f => String(f._id) === String(id));
      if (memIndex !== -1) {
        followUp = memoryFollowUps[memIndex];
      }
    }

    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    if (title) followUp.title = title.trim();
    if (notes !== undefined) followUp.notes = notes;
    if (scheduledAt) followUp.scheduledAt = new Date(scheduledAt);
    if (callWindow) followUp.callWindow = callWindow;
    if (channel) followUp.channel = channel;
    if (priority) followUp.priority = priority;
    if (status) followUp.status = status;

    if (isDbConnected() && typeof followUp.save === 'function') {
      await followUp.save();
    }

    res.json({
      success: true,
      message: 'Follow-up updated successfully.',
      followUp
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error updating follow-up' });
  }
};

// @desc    Mark follow-up completed with outcome notes
// @route   PUT /api/follow-ups/:id/complete
// @access  Private (Sales, Admin)
export const completeFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { outcomeNotes, leadStatusUpdate } = req.body;

    let followUp = null;
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        followUp = await FollowUp.findById(id);
      } catch (e) {}
    }

    if (!followUp) {
      const memIndex = memoryFollowUps.findIndex(f => String(f._id) === String(id));
      if (memIndex !== -1) {
        followUp = memoryFollowUps[memIndex];
      }
    }

    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    followUp.status = 'completed';
    followUp.outcomeNotes = outcomeNotes || 'Follow-up completed successfully.';
    followUp.completedAt = new Date();
    followUp.completedBy = req.user?._id;

    if (isDbConnected() && typeof followUp.save === 'function') {
      await followUp.save();
    }

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
    res.status(500).json({ success: false, message: error.message || 'Server Error completing follow-up' });
  }
};

// @desc    Delete / Cancel follow-up
// @route   DELETE /api/follow-ups/:id
// @access  Private (Sales, Admin)
export const deleteFollowUp = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await FollowUp.findByIdAndDelete(id);
      } catch (e) {}
    }

    memoryFollowUps = memoryFollowUps.filter(f => String(f._id) !== String(id));

    res.json({
      success: true,
      message: 'Follow-up deleted successfully.',
      id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error deleting follow-up' });
  }
};
