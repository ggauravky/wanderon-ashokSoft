import OperationalCost from '../models/OperationalCost.js';
import OperationalSettlement, { OPERATIONAL_SETTLEMENT_METHODS } from '../models/OperationalSettlement.js';
import { assertOperationalTripOpen } from '../services/operationsClosureService.js';
import { createSettlementAtomically, enrichCostsWithSettlements, summarizeOperationalFinancials, voidSettlementAtomically } from '../services/operationsFinanceService.js';
import { OperationsDomainError } from '../services/operationsExecutionService.js';
import { ensureOperationsDatabase, handleOperationsError, operationsActor, operationsFailure } from './operationsControllerUtils.js';

const getCost = async (costId) => {
  const cost = await OperationalCost.findById(costId);
  if (!cost) throw new OperationsDomainError(404, 'Operational cost was not found.', 'COST_NOT_FOUND');
  return cost;
};

export const listCostSettlements = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    await getCost(req.params.costId);
    const rows = await OperationalSettlement.find({ operationalCostId: req.params.costId }).populate('recordedBy voidedBy', 'name role').sort({ paidAt: -1 }).lean();
    return res.json({ success: true, data: rows });
  } catch (error) { return handleOperationsError(res, error, 'Unable to load Vendor settlements.'); }
};

export const createCostSettlement = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const cost = await getCost(req.params.costId); await assertOperationalTripOpen(cost.operationalTripId);
    if (cost.status !== 'FINALIZED') return operationsFailure(res, 409, 'Vendor settlement can only be recorded against a finalized cost.', 'COST_NOT_FINALIZED');
    const paymentMethod = String(req.body.paymentMethod || '').toUpperCase();
    if (!OPERATIONAL_SETTLEMENT_METHODS.includes(paymentMethod)) return operationsFailure(res, 400, 'A valid payment method is required.');
    const paidAt = new Date(req.body.paidAt);
    if (Number.isNaN(paidAt.getTime())) return operationsFailure(res, 400, 'A valid payment date is required.');
    const settlement = await createSettlementAtomically({ cost, payload: { ...req.body, paymentMethod, paidAt, documents: (req.body.documents || []).map((document) => ({ ...document, uploadedBy: document.uploadedBy || req.user._id })) }, actor: operationsActor(req) });
    await settlement.populate('recordedBy', 'name role');
    return res.status(201).json({ success: true, data: settlement });
  } catch (error) { return handleOperationsError(res, error, 'Unable to record the Vendor settlement.'); }
};

export const voidOperationalSettlement = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const settlement = await OperationalSettlement.findById(req.params.settlementId);
    if (!settlement) return operationsFailure(res, 404, 'Vendor settlement was not found.');
    await assertOperationalTripOpen(settlement.operationalTripId);
    const changed = await voidSettlementAtomically({ settlement, reason: req.body.reason, actor: operationsActor(req) });
    return res.json({ success: true, data: changed });
  } catch (error) { return handleOperationsError(res, error, 'Unable to void the Vendor settlement record.'); }
};

export const listOperationalSettlements = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const query = {};
    if (req.query.status && String(req.query.status).toUpperCase() !== 'ALL') query.status = String(req.query.status).toUpperCase();
    if (req.query.vendor) query.vendorId = req.query.vendor;
    if (req.query.trip) query.operationalTripId = req.query.trip;
    if (req.query.from || req.query.to) query.paidAt = { ...(req.query.from ? { $gte: new Date(req.query.from) } : {}), ...(req.query.to ? { $lte: new Date(req.query.to) } : {}) };
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1); const limit = Math.min(100, Math.max(5, Number.parseInt(req.query.limit, 10) || 25));
    let costQuery = {};
    if (req.query.category && String(req.query.category).toUpperCase() !== 'ALL') costQuery.category = String(req.query.category).toUpperCase();
    if (req.query.overdueOnly === 'true') costQuery = { ...costQuery, status: 'FINALIZED', dueDate: { $lt: new Date() } };
    if (req.query.search) { const safe = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); costQuery.$or = [{ costCode: { $regex: safe, $options: 'i' } }, { description: { $regex: safe, $options: 'i' } }, { invoiceReference: { $regex: safe, $options: 'i' } }]; }
    if (Object.keys(costQuery).length) query.operationalCostId = { $in: await OperationalCost.find(costQuery).distinct('_id') };
    const [rows, total, costs, allSettlements] = await Promise.all([
      OperationalSettlement.find(query).populate('vendorId', 'vendorCode name types').populate('operationalTripId', 'operationKey').populate('operationalCostId', 'costCode category description totalAmount dueDate status contextSnapshot').populate('recordedBy voidedBy', 'name role').sort({ paidAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      OperationalSettlement.countDocuments(query),
      OperationalCost.find({ ...costQuery, ...(req.query.vendor ? { vendorId: req.query.vendor } : {}), ...(req.query.trip ? { operationalTripId: req.query.trip } : {}) }).populate('vendorId', 'vendorCode name types').populate('operationalTripId', 'operationKey').sort({ dueDate: 1, incurredAt: -1 }).limit(500).lean(),
      OperationalSettlement.find({ status: 'RECORDED' }).lean()
    ]);
    let enrichedCosts = enrichCostsWithSettlements(costs, allSettlements);
    if (req.query.paymentState && String(req.query.paymentState).toUpperCase() !== 'ALL') enrichedCosts = enrichedCosts.filter((cost) => cost.settlement.paymentState === String(req.query.paymentState).toUpperCase());
    if (req.query.overdueOnly === 'true') enrichedCosts = enrichedCosts.filter((cost) => cost.overdue);
    return res.json({ success: true, data: rows, costs: enrichedCosts, summary: summarizeOperationalFinancials({ costs, settlements: allSettlements }), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return handleOperationsError(res, error, 'Unable to load Vendor settlements.'); }
};
