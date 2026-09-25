import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import Itinerary from '../models/Itinerary.js';
import { canStaffAccessLead } from './leadAccessService.js';

export const SALES_LEAD_QUEUES = Object.freeze({
  EXPERT_REQUESTS: 'expert_requests',
  AI_PLANNER: 'ai_planner',
  ALL_SALES: 'all_sales'
});

const AI_PLANNER_FILTER = Object.freeze({ leadType: 'trip_enquiry', source: 'ai_planner' });
const EXPERT_REQUEST_FILTER = Object.freeze({ leadType: 'callback_request' });

export const buildSalesLeadScope = ({ user, queue }) => {
  const role = String(user?.role || '').toLowerCase();
  const requestedQueue = queue || (role === 'sales' ? SALES_LEAD_QUEUES.ALL_SALES : '');
  if (requestedQueue && !Object.values(SALES_LEAD_QUEUES).includes(requestedQueue)) {
    throw Object.assign(new Error('Unknown Sales queue.'), { status: 400 });
  }
  if (
    [SALES_LEAD_QUEUES.AI_PLANNER, SALES_LEAD_QUEUES.ALL_SALES].includes(requestedQueue)
    && !['sales', 'admin', 'super_admin'].includes(role)
  ) {
    throw Object.assign(new Error('Access denied for the AI Planner Sales queue.'), { status: 403 });
  }
  if (requestedQueue === SALES_LEAD_QUEUES.EXPERT_REQUESTS) return { ...EXPERT_REQUEST_FILTER };
  if (requestedQueue === SALES_LEAD_QUEUES.AI_PLANNER) return { ...AI_PLANNER_FILTER };
  if (requestedQueue === SALES_LEAD_QUEUES.ALL_SALES || role === 'sales') {
    return { $or: [{ ...EXPERT_REQUEST_FILTER }, { ...AI_PLANNER_FILTER }] };
  }
  return null;
};

export const deriveAiPlannerLeadSummary = (itinerary = {}, submitted = {}) => {
  const planner = itinerary.plannerContext || {};
  const flexible = planner.datesFlexible !== false;
  const budget = Number(planner.budgetAmount);
  return {
    tripTitle: itinerary.title || submitted.tripTitle || '',
    tripTitleSnapshot: itinerary.title || submitted.tripTitle || '',
    destination: itinerary.destination || submitted.destination || 'Expedition',
    travelersCount: Number(itinerary.travelers) || Number(submitted.travelersCount) || 1,
    travelMonth: flexible ? planner.flexibleMonth || submitted.travelMonth || '' : submitted.travelMonth || '',
    travelDate: !flexible && planner.startDate ? new Date(planner.startDate).toISOString().slice(0, 10) : submitted.travelDate || '',
    budgetPerPerson: Number.isFinite(budget) && budget > 0
      ? `₹${Math.round(budget).toLocaleString('en-IN')}`
      : submitted.budgetPerPerson || '',
    topics: Array.isArray(planner.interests) && planner.interests.length
      ? planner.interests.slice(0, 12)
      : submitted.topics || []
  };
};

const leadDto = (lead) => ({
  id: String(lead._id),
  _id: String(lead._id),
  referenceId: lead.referenceId,
  name: lead.name,
  email: lead.email,
  phone: lead.phone,
  status: lead.status,
  priority: lead.priority,
  assignedTo: lead.assignedTo,
  assignedToUser: lead.assignedToUser || null,
  assignedToUserName: lead.assignedToUserName,
  createdAt: lead.createdAt,
  updatedAt: lead.updatedAt,
  firstContactAt: lead.firstContactAt,
  lastContactAt: lead.lastContactAt,
  nextFollowUpAt: lead.nextFollowUpAt,
  preferredCallDate: lead.preferredCallDate,
  preferredCallWindow: lead.preferredCallWindow,
  message: lead.message,
  topics: lead.topics || [],
  travelersCount: lead.travelersCount,
  destination: lead.destination,
  travelMonth: lead.travelMonth,
  travelDate: lead.travelDate,
  budgetPerPerson: lead.budgetPerPerson,
  tripTitle: lead.tripTitle,
  callOutcomes: lead.callOutcomes || [],
  contactCount: lead.contactCount || 0,
  sourceItineraryId: lead.sourceItineraryId ? String(lead.sourceItineraryId._id || lead.sourceItineraryId) : null,
  quotations: lead.quotations || [],
  convertedBookingId: lead.convertedBookingId || null,
  convertedBookingCode: lead.convertedBookingCode || '',
  userId: lead.userId || null
});

export const sanitizeItineraryDossier = (itinerary) => {
  if (!itinerary) return null;
  return {
    id: String(itinerary._id),
    _id: String(itinerary._id),
    title: itinerary.title,
    tagline: itinerary.tagline,
    destination: itinerary.destination,
    destinationSlug: itinerary.destinationSlug,
    duration: itinerary.duration,
    travelers: itinerary.travelers,
    travelStyle: itinerary.travelStyle,
    pace: itinerary.pace,
    budgetLevel: itinerary.budgetLevel,
    totalEstimatedCost: itinerary.totalEstimatedCost,
    currency: itinerary.currency,
    weather: itinerary.weather,
    seasonContext: itinerary.seasonContext,
    bestTimeToVisit: itinerary.bestTimeToVisit,
    days: itinerary.days || [],
    staySuggestions: itinerary.staySuggestions || [],
    foodSuggestions: itinerary.foodSuggestions || [],
    packingList: itinerary.packingList || [],
    localTips: itinerary.localTips || [],
    budgetBreakdown: itinerary.budgetBreakdown || {},
    plannerContext: itinerary.plannerContext || {},
    healthReport: itinerary.healthReport || null,
    media: itinerary.media || null,
    matchedTrip: itinerary.matchedTrip || null,
    source: itinerary.source,
    generatedAt: itinerary.generatedAt,
    createdAt: itinerary.createdAt,
    updatedAt: itinerary.updatedAt,
    version: itinerary.version || 1,
    lifecycleStatus: itinerary.lifecycleStatus || 'GENERATED'
  };
};

export const loadAiPlannerLeadDossier = async ({ id, user }) => {
  const role = String(user?.role || '').toLowerCase();
  if (!['super_admin', 'admin', 'sales'].includes(role)) {
    throw Object.assign(new Error('Access denied for the AI Planner Sales workspace.'), { status: 403 });
  }
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { referenceId: id };
  const lead = await Lead.findOne(query)
    .populate('assignedToUser', 'name email role avatar phone')
    .populate('quotations', 'quotationNumber status schemaVersion pricing manualPricing createdAt updatedAt')
    .populate('convertedBookingId', 'bookingId bookingStatus paymentStatus pricing')
    .populate('userId', 'name email phone avatar')
    .lean();
  if (!lead) throw Object.assign(new Error('AI Planner Lead not found.'), { status: 404 });
  if (!canStaffAccessLead(lead, user) || lead.leadType !== 'trip_enquiry' || lead.source !== 'ai_planner') {
    throw Object.assign(new Error('This Lead is not available in the AI Planner queue.'), { status: 403 });
  }

  const itineraryId = lead.sourceItineraryId?._id || lead.sourceItineraryId;
  const itinerary = itineraryId ? await Itinerary.findById(itineraryId).lean() : null;
  const safeLead = leadDto(lead);
  const safeItinerary = sanitizeItineraryDossier(itinerary);
  return {
    lead: safeLead,
    itinerary: safeItinerary,
    sourcePlanState: itineraryId ? (itinerary ? 'AVAILABLE' : 'MISSING') : 'NOT_LINKED',
    summary: {
      planUpdatedAfterEnquiry: Boolean(itinerary?.updatedAt && lead.createdAt && new Date(itinerary.updatedAt) > new Date(lead.createdAt)),
      quotationState: lead.quotations?.length ? lead.quotations[lead.quotations.length - 1]?.status || 'DRAFT' : 'NOT_CREATED'
    },
    crm: {
      quotations: lead.quotations || [],
      booking: lead.convertedBookingId || null,
      contactHistory: lead.callOutcomes || [],
      assignment: lead.assignedToUser || (lead.assignedToUserName ? { name: lead.assignedToUserName } : null)
    }
  };
};

export const AI_PLANNER_LEAD_FILTER = AI_PLANNER_FILTER;
