import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import Quotation from '../models/Quotation.js';
import FollowUp from '../models/FollowUp.js';
import Booking from '../models/Booking.js';
import { memoryQuotations } from './quotationController.js';
import { memoryFollowUps } from './followUpController.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// @desc    Get Sales Rep Dashboard metrics, assigned leads, quotations, follow-ups
// @route   GET /api/sales/dashboard
// @access  Private (Sales, Operations, Admin)
export const getSalesDashboard = async (req, res) => {
  try {
    const userRole = (req.user?.role || 'sales').toLowerCase();
    const userId = req.user?._id || req.user?.id;
    const userName = req.user?.name || 'Sales Rep';

    let leadFilter = {};
    let quotationFilter = {};
    let followUpFilter = {};
    const todayStr = new Date().toISOString().split('T')[0];

    if (userRole === 'sales' && userId) {
      leadFilter = {
        $or: [
          ...(mongoose.Types.ObjectId.isValid(userId) ? [{ assignedToUser: userId }] : []),
          { assignedTo: userName }
        ]
      };
      quotationFilter = {
        $or: [
          ...(mongoose.Types.ObjectId.isValid(userId) ? [{ assignedTo: userId }] : []),
          { createdBy: userId }
        ]
      };
      followUpFilter = { salesUserId: userId };
    }

    let totalLeads = 0;
    let openRequestsCount = 0;
    let dueTodayCount = 0;
    let leadsByStage = { NEW: 0, CONTACTED: 0, IN_PROGRESS: 0, QUALIFIED: 0, CONVERTED: 0, LOST: 0 };
    let totalQuotations = 0;
    let quotationsByStatus = { DRAFT: 0, SENT: 0, VIEWED: 0, APPROVED: 0, REJECTED: 0, CONVERTED: 0 };
    let pendingFollowUpsCount = 0;
    let totalClosedRevenue = 0;
    let totalConverted = 0;

    if (isDbConnected()) {
      try {
        // 1. Leads
        totalLeads = await Lead.countDocuments(leadFilter);
        const leadStages = await Lead.aggregate([
          { $match: leadFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        for (const s of leadStages) {
          if (s._id && leadsByStage[s._id] !== undefined) {
            leadsByStage[s._id] = s.count;
          }
        }
        totalConverted = leadsByStage.CONVERTED || 0;

        // Open requests in unassigned pool
        openRequestsCount = await Lead.countDocuments({
          $and: [
            { $or: [{ assignedToUser: null }, { assignedToUser: { $exists: false } }] },
            { $or: [{ assignedTo: 'Sales Concierge Team' }, { assignedTo: '' }, { assignedTo: null }, { assignedTo: { $exists: false } }] }
          ]
        });

        // Due today for current user
        dueTodayCount = await Lead.countDocuments({
          ...leadFilter,
          preferredCallDate: todayStr,
          status: { $nin: ['CONVERTED', 'LOST'] }
        });

        // 2. Quotations
        totalQuotations = await Quotation.countDocuments(quotationFilter);
        const quoteStatuses = await Quotation.aggregate([
          { $match: quotationFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        for (const qs of quoteStatuses) {
          if (qs._id && quotationsByStatus[qs._id] !== undefined) {
            quotationsByStatus[qs._id] = qs.count;
          }
        }

        // 3. Follow-ups
        pendingFollowUpsCount = await FollowUp.countDocuments({
          ...followUpFilter,
          status: 'pending'
        });

        // 4. Closed Revenue
        const revAgg = await Booking.aggregate([
          {
            $match: {
              $or: [
                { bookingStatus: { $in: ['CONFIRMED', 'PROVISIONALLY_CONFIRMED'] } },
                { paymentStatus: { $in: ['PAID', 'PARTIALLY_PAID'] } }
              ]
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $ifNull: ['$pricing.amountPaid', '$pricing.finalAmount'] } }
            }
          }
        ]);
        totalClosedRevenue = revAgg[0]?.total || 0;
      } catch (dbErr) {
        console.warn('Sales dashboard DB aggregate warning:', dbErr.message);
      }
    }

    // Fallback counts ONLY for offline local development when database is disconnected
    if (!isDbConnected() && process.env.NODE_ENV !== 'production' && process.env.ALLOW_IN_MEMORY_FALLBACK === 'true') {
      if (totalLeads === 0 && totalQuotations === 0) {
        totalLeads = 12;
        openRequestsCount = 3;
        dueTodayCount = 2;
        leadsByStage = { NEW: 4, CONTACTED: 3, IN_PROGRESS: 2, QUALIFIED: 1, CONVERTED: 2, LOST: 0 };
        totalConverted = 2;
        totalQuotations = memoryQuotations.length || 5;
        quotationsByStatus = { DRAFT: 1, SENT: 2, VIEWED: 1, APPROVED: 1, REJECTED: 0, CONVERTED: 1 };
        pendingFollowUpsCount = memoryFollowUps.filter(f => f.status === 'pending').length || 2;
        totalClosedRevenue = 145000;
      }
    }

    const conversionRate = totalLeads > 0 
      ? Number(((totalConverted / totalLeads) * 100).toFixed(1)) 
      : 0;

    res.json({
      success: true,
      salesRep: {
        id: userId,
        name: userName,
        role: userRole
      },
      metrics: {
        totalAssignedLeads: totalLeads,
        openRequestsCount,
        dueTodayCount,
        leadsByStage,
        totalQuotations,
        quotationsByStatus,
        pendingFollowUpsCount,
        totalClosedRevenue,
        conversionRate: `${conversionRate}%`
      }
    });
  } catch (error) {
    console.error('getSalesDashboard Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error generating sales dashboard' });
  }
};
