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

    // Shared Sales Queue for Travel Expert Requests (leadType = 'callback_request')
    const expertLeadFilter = { leadType: 'callback_request' };
    let quotationFilter = {};
    let followUpFilter = {};
    const todayStr = new Date().toISOString().split('T')[0];

    if (userRole === 'sales' && userId) {
      quotationFilter = {
        $or: [
          ...(mongoose.Types.ObjectId.isValid(userId) ? [{ assignedTo: userId }] : []),
          { createdBy: userId }
        ]
      };
      followUpFilter = { salesUserId: userId };
    }

    let totalExpertRequests = 0;
    let newRequests = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;
    let inProgressCount = 0;
    let qualifiedCount = 0;
    let leadsByStage = { NEW: 0, CONTACTED: 0, IN_PROGRESS: 0, QUALIFIED: 0, CONVERTED: 0, LOST: 0 };
    let totalQuotations = 0;
    let quotationsByStatus = { DRAFT: 0, SENT: 0, VIEWED: 0, APPROVED: 0, REJECTED: 0, CONVERTED: 0 };
    let pendingFollowUpsCount = 0;
    let totalClosedRevenue = 0;
    let totalConverted = 0;

    if (isDbConnected()) {
      try {
        // 1. Shared Expert Request Leads Metrics
        totalExpertRequests = await Lead.countDocuments(expertLeadFilter);
        const leadStages = await Lead.aggregate([
          { $match: expertLeadFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        for (const s of leadStages) {
          if (s._id && leadsByStage[s._id] !== undefined) {
            leadsByStage[s._id] = s.count;
          }
        }
        newRequests = leadsByStage.NEW || 0;
        inProgressCount = (leadsByStage.IN_PROGRESS || 0) + (leadsByStage.CONTACTED || 0);
        qualifiedCount = leadsByStage.QUALIFIED || 0;
        totalConverted = leadsByStage.CONVERTED || 0;

        // Due today for shared queue
        dueTodayCount = await Lead.countDocuments({
          ...expertLeadFilter,
          preferredCallDate: todayStr,
          status: { $nin: ['CONVERTED', 'LOST'] }
        });

        // Overdue for shared queue
        overdueCount = await Lead.countDocuments({
          ...expertLeadFilter,
          preferredCallDate: { $ne: '', $lt: todayStr },
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
      if (totalExpertRequests === 0 && totalQuotations === 0) {
        totalExpertRequests = 12;
        newRequests = 4;
        dueTodayCount = 2;
        overdueCount = 1;
        inProgressCount = 5;
        qualifiedCount = 1;
        leadsByStage = { NEW: 4, CONTACTED: 3, IN_PROGRESS: 2, QUALIFIED: 1, CONVERTED: 2, LOST: 0 };
        totalConverted = 2;
        totalQuotations = memoryQuotations.length || 5;
        quotationsByStatus = { DRAFT: 1, SENT: 2, VIEWED: 1, APPROVED: 1, REJECTED: 0, CONVERTED: 1 };
        pendingFollowUpsCount = memoryFollowUps.filter(f => f.status === 'pending').length || 2;
        totalClosedRevenue = 145000;
      }
    }

    const conversionRate = totalExpertRequests > 0 
      ? Number(((totalConverted / totalExpertRequests) * 100).toFixed(1)) 
      : 0;

    res.json({
      success: true,
      salesRep: {
        id: userId,
        name: userName,
        role: userRole
      },
      metrics: {
        totalExpertRequests,
        totalAssignedLeads: totalExpertRequests, // Backwards compatibility
        newRequests,
        openRequestsCount: newRequests, // Backwards compatibility
        dueTodayCount,
        overdueCount,
        inProgressCount,
        qualifiedCount,
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
