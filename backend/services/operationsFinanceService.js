import OperationalCost, { MAX_OPERATIONAL_AMOUNT } from '../models/OperationalCost.js';
import OperationalSettlement from '../models/OperationalSettlement.js';
import { OperationsDomainError } from './operationsExecutionService.js';

const money = (value) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) throw new OperationsDomainError(400, 'Financial amounts must be finite numbers.', 'INVALID_AMOUNT');
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

export const calculateOperationalCostTotal = ({ subtotal = 0, taxAmount = 0, adjustmentAmount = 0 } = {}) => {
  const normalized = {
    subtotal: money(subtotal),
    taxAmount: money(taxAmount),
    adjustmentAmount: money(adjustmentAmount)
  };
  if (normalized.subtotal < 0 || normalized.taxAmount < 0) {
    throw new OperationsDomainError(400, 'Subtotal and tax amount cannot be negative.', 'INVALID_COST_AMOUNT');
  }
  const totalAmount = money(normalized.subtotal + normalized.taxAmount + normalized.adjustmentAmount);
  if (totalAmount < 0 || totalAmount > MAX_OPERATIONAL_AMOUNT) {
    throw new OperationsDomainError(400, 'Operational cost total is outside the supported range.', 'INVALID_COST_TOTAL');
  }
  return { ...normalized, totalAmount };
};

export const deriveSettlementState = (totalAmount, paidAmount) => {
  const total = Math.max(0, money(totalAmount));
  const paid = Math.max(0, money(paidAmount));
  const outstandingAmount = Math.max(0, money(total - paid));
  return {
    paidAmount: paid,
    outstandingAmount,
    paymentState: paid <= 0 ? 'UNPAID' : outstandingAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID'
  };
};

export const validateSettlementAmount = (amount, outstandingAmount) => {
  const normalized = money(amount);
  if (normalized <= 0) throw new OperationsDomainError(400, 'Settlement amount must be greater than zero.', 'INVALID_SETTLEMENT_AMOUNT');
  if (normalized > money(outstandingAmount)) throw new OperationsDomainError(409, 'Settlement amount exceeds the remaining cost balance.', 'SETTLEMENT_OVERPAYMENT');
  return normalized;
};

export const assertDraftCostEditable = (cost) => {
  if (cost?.status !== 'DRAFT') throw new OperationsDomainError(409, 'Only Draft operational costs can be edited.', 'COST_IMMUTABLE');
  return true;
};

export const enrichCostsWithSettlements = (costs = [], settlements = [], now = new Date()) => {
  const paidByCost = new Map();
  for (const settlement of settlements) {
    if (settlement.status !== 'RECORDED') continue;
    const key = String(settlement.operationalCostId?._id || settlement.operationalCostId);
    paidByCost.set(key, money((paidByCost.get(key) || 0) + Number(settlement.amount || 0)));
  }
  return costs.map((cost) => {
    const value = cost?.toObject ? cost.toObject() : cost;
    const settlement = deriveSettlementState(value.totalAmount, paidByCost.get(String(value._id)) || 0);
    return {
      ...value,
      settlement,
      overdue: value.status === 'FINALIZED' && settlement.outstandingAmount > 0 && Boolean(value.dueDate) && new Date(value.dueDate) < now
    };
  });
};

export const summarizeOperationalFinancials = ({ bookings = [], costs = [], settlements = [], now = new Date() } = {}) => {
  const enrichedCosts = enrichCostsWithSettlements(costs, settlements, now);
  const finalized = enrichedCosts.filter((cost) => cost.status === 'FINALIZED');
  const draft = enrichedCosts.filter((cost) => cost.status === 'DRAFT');
  const finalizedCost = money(finalized.reduce((sum, cost) => sum + Number(cost.totalAmount || 0), 0));
  const draftCost = money(draft.reduce((sum, cost) => sum + Number(cost.totalAmount || 0), 0));
  const vendorPaid = money(settlements.filter((item) => item.status === 'RECORDED').reduce((sum, item) => sum + Number(item.amount || 0), 0));
  const vendorOutstanding = money(finalized.reduce((sum, cost) => sum + Number(cost.settlement.outstandingAmount || 0), 0));
  const overdueVendorAmount = money(finalized.filter((cost) => cost.overdue).reduce((sum, cost) => sum + Number(cost.settlement.outstandingAmount || 0), 0));
  const bookedRevenue = money(bookings.reduce((sum, booking) => sum + Number(booking.pricing?.finalAmount || 0), 0));
  const collectedRevenue = money(bookings.reduce((sum, booking) => sum + Number(booking.pricing?.amountPaid || 0), 0));
  return {
    bookedRevenue,
    collectedRevenue,
    draftCost,
    draftCostCount: draft.length,
    finalizedCost,
    vendorPaid,
    vendorOutstanding,
    overdueVendorAmount,
    grossOperationalContribution: money(bookedRevenue - finalizedCost),
    financialCompleteness: draft.length ? 'INCOMPLETE' : 'FINALIZED'
  };
};

export const summarizeVendors = (costs = [], settlements = [], services = [], now = new Date()) => {
  const enriched = enrichCostsWithSettlements(costs, settlements, now).filter((cost) => cost.status === 'FINALIZED' && cost.vendorId);
  const byVendor = new Map();
  for (const cost of enriched) {
    const vendorId = String(cost.vendorId?._id || cost.vendorId);
    const row = byVendor.get(vendorId) || {
      vendorId,
      vendorCode: cost.vendorSnapshot?.vendorCode || cost.vendorId?.vendorCode || '',
      name: cost.vendorSnapshot?.name || cost.vendorId?.name || 'Vendor',
      types: cost.vendorId?.types || [], trips: new Set(), services: 0, finalizedCost: 0, paid: 0, outstanding: 0, overdue: 0
    };
    row.trips.add(String(cost.operationalTripId?._id || cost.operationalTripId));
    row.finalizedCost += Number(cost.totalAmount || 0);
    row.paid += Number(cost.settlement.paidAmount || 0);
    row.outstanding += Number(cost.settlement.outstandingAmount || 0);
    if (cost.overdue) row.overdue += Number(cost.settlement.outstandingAmount || 0);
    byVendor.set(vendorId, row);
  }
  for (const service of services) {
    const vendorIds = [service.vendorId, service.transportDetails?.driverVendorId, service.guideDetails?.guideVendorId].filter(Boolean).map(String);
    for (const vendorId of new Set(vendorIds)) {
      const row = byVendor.get(vendorId);
      if (row) row.services += 1;
    }
  }
  return [...byVendor.values()].map((row) => ({ ...row, trips: row.trips.size })).sort((a, b) => b.outstanding - a.outstanding || a.name.localeCompare(b.name));
};

export const reserveSettlementAmount = async (costId, amount) => {
  const normalized = money(amount);
  const cost = await OperationalCost.findOneAndUpdate(
    {
      _id: costId,
      status: 'FINALIZED',
      $expr: { $lte: [{ $add: [{ $ifNull: ['$settlementClaimedAmount', 0] }, normalized] }, '$totalAmount'] }
    },
    { $inc: { settlementClaimedAmount: normalized } },
    { new: true, select: '+settlementClaimedAmount' }
  );
  if (!cost) throw new OperationsDomainError(409, 'The cost is not finalized or the payment would exceed its remaining balance.', 'SETTLEMENT_OVERPAYMENT');
  return cost;
};

export const releaseSettlementAmount = (costId, amount) => OperationalCost.updateOne(
  { _id: costId, settlementClaimedAmount: { $gte: money(amount) } },
  { $inc: { settlementClaimedAmount: -money(amount) } }
);

export const createSettlementAtomically = async ({ cost, payload, actor }) => {
  const amount = validateSettlementAmount(payload.amount, cost.totalAmount);
  await reserveSettlementAmount(cost._id, amount);
  try {
    return await OperationalSettlement.create({
      operationalTripId: cost.operationalTripId,
      operationalCostId: cost._id,
      vendorId: cost.vendorId || null,
      amount,
      currency: 'INR',
      paymentMethod: payload.paymentMethod,
      externalReference: String(payload.externalReference || '').trim(),
      paidAt: payload.paidAt,
      documents: payload.documents || [],
      notes: String(payload.notes || '').trim(),
      recordedBy: actor.id
    });
  } catch (error) {
    await releaseSettlementAmount(cost._id, amount);
    throw error;
  }
};

export const voidSettlementAtomically = async ({ settlement, reason, actor, now = new Date() }) => {
  const note = String(reason || '').trim();
  if (note.length < 5) throw new OperationsDomainError(400, 'A meaningful void reason is required.', 'VOID_REASON_REQUIRED');
  const changed = await OperationalSettlement.findOneAndUpdate(
    { _id: settlement._id, status: 'RECORDED' },
    { $set: { status: 'VOID', voidReason: note, voidedAt: now, voidedBy: actor.id } },
    { new: true }
  );
  if (!changed) throw new OperationsDomainError(409, 'This settlement is already void.', 'SETTLEMENT_ALREADY_VOID');
  await releaseSettlementAmount(settlement.operationalCostId, settlement.amount);
  return changed;
};
