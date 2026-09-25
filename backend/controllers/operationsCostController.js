import OperationalCost, { OPERATIONAL_COST_CATEGORIES } from '../models/OperationalCost.js';
import OperationalSettlement from '../models/OperationalSettlement.js';
import Vendor from '../models/Vendor.js';
import { assertOperationalTripOpen } from '../services/operationsClosureService.js';
import { assertDraftCostEditable, calculateOperationalCostTotal, enrichCostsWithSettlements, summarizeOperationalFinancials } from '../services/operationsFinanceService.js';
import { OperationsDomainError } from '../services/operationsExecutionService.js';
import { loadOperationsContext, validateIncidentInTrip, validateServiceInTrip } from '../services/operationsContextService.js';
import { ensureOperationsDatabase, handleOperationsError, operationsActor, operationsFailure, sameInstant } from './operationsControllerUtils.js';

const actorHistory = (action, fromStatus, toStatus, actor, note = '') => ({ action, fromStatus, toStatus, note, actorId: actor.id, actorName: actor.name, at: new Date() });
const vendorSnapshot = (vendor) => vendor ? ({ vendorCode: vendor.vendorCode || '', name: vendor.name || '', phone: vendor.contact?.phone || vendor.contact?.whatsapp || '', email: vendor.contact?.email || '' }) : {};

const costPayload = async (body, context, { partial = false } = {}) => {
  const category = String(body.category || '').toUpperCase();
  if (!partial || Object.hasOwn(body, 'category')) {
    if (!OPERATIONAL_COST_CATEGORIES.includes(category)) throw new OperationsDomainError(400, 'A valid operational cost category is required.', 'INVALID_COST_CATEGORY');
  }
  const [service, incident, vendor] = await Promise.all([
    Object.hasOwn(body, 'operationalServiceId') ? validateServiceInTrip(body.operationalServiceId, context.operationalTrip._id) : null,
    Object.hasOwn(body, 'incidentId') ? validateIncidentInTrip(body.incidentId, context.operationalTrip._id) : null,
    Object.hasOwn(body, 'vendorId') && body.vendorId ? Vendor.findById(body.vendorId) : null
  ]);
  if (body.vendorId && !vendor) throw new OperationsDomainError(400, 'Selected Vendor was not found.', 'INVALID_VENDOR_ID');
  const amountKeys = ['subtotal', 'taxAmount', 'adjustmentAmount'];
  const amounts = amountKeys.some((key) => Object.hasOwn(body, key)) ? calculateOperationalCostTotal(body) : null;
  const result = {};
  if (!partial || Object.hasOwn(body, 'category')) result.category = category;
  for (const field of ['description', 'payeeName', 'invoiceReference', 'internalNotes']) if (!partial || Object.hasOwn(body, field)) result[field] = String(body[field] || '').trim();
  if (amounts) Object.assign(result, amounts);
  if (!partial || Object.hasOwn(body, 'incurredAt')) {
    const date = new Date(body.incurredAt);
    if (Number.isNaN(date.getTime())) throw new OperationsDomainError(400, 'A valid incurred date is required.', 'INVALID_INCURRED_DATE');
    result.incurredAt = date;
  }
  if (Object.hasOwn(body, 'dueDate')) result.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (Object.hasOwn(body, 'vendorId')) { result.vendorId = vendor?._id || null; result.vendorSnapshot = vendorSnapshot(vendor); }
  if (Object.hasOwn(body, 'operationalServiceId')) result.operationalServiceId = service?._id || null;
  if (Object.hasOwn(body, 'incidentId')) result.incidentId = incident?._id || null;
  if (Object.hasOwn(body, 'documents')) result.documents = (body.documents || []).map((document) => ({ ...document }));
  result.currency = 'INR';
  return result;
};

const loadCost = async (costId) => {
  const cost = await OperationalCost.findById(costId).select('+settlementClaimedAmount');
  if (!cost) throw new OperationsDomainError(404, 'Operational cost was not found.', 'COST_NOT_FOUND');
  return cost;
};

const populateCost = (query) => query.populate('vendorId', 'vendorCode name types status contact commercialReference').populate('operationalServiceId', 'serviceType title confirmationStatus').populate('incidentId', 'incidentCode title status').populate('createdBy updatedBy finalizedBy voidedBy', 'name role');

export const listOperationalCosts = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const context = await loadOperationsContext(req.params.operationId);
    const [costs, settlements] = await Promise.all([
      populateCost(OperationalCost.find({ operationalTripId: context.operationalTrip._id }).sort({ incurredAt: -1, createdAt: -1 })).lean(),
      OperationalSettlement.find({ operationalTripId: context.operationalTrip._id }).populate('recordedBy voidedBy', 'name role').sort({ paidAt: -1 }).lean()
    ]);
    return res.json({ success: true, data: enrichCostsWithSettlements(costs, settlements), settlements, summary: summarizeOperationalFinancials({ bookings: context.bookings, costs, settlements }) });
  } catch (error) { return handleOperationsError(res, error, 'Unable to load operational costs.'); }
};

export const createOperationalCost = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const context = await loadOperationsContext(req.params.operationId);
    await assertOperationalTripOpen(context.operationalTrip._id);
    const actor = operationsActor(req);
    const payload = await costPayload(req.body, context);
    const cost = await OperationalCost.create({ ...payload, operationalTripId: context.operationalTrip._id, contextSnapshot: context.contextSnapshot, createdBy: actor.id, updatedBy: actor.id, history: [actorHistory('CREATED', null, 'DRAFT', actor)] });
    return res.status(201).json({ success: true, data: cost });
  } catch (error) { return handleOperationsError(res, error, 'Unable to create the operational cost.'); }
};

export const getOperationalCost = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const cost = await populateCost(OperationalCost.findById(req.params.costId)).lean();
    if (!cost) return operationsFailure(res, 404, 'Operational cost was not found.');
    const settlements = await OperationalSettlement.find({ operationalCostId: cost._id }).populate('recordedBy voidedBy', 'name role').sort({ paidAt: -1 }).lean();
    return res.json({ success: true, data: enrichCostsWithSettlements([cost], settlements)[0], settlements });
  } catch (error) { return handleOperationsError(res, error, 'Unable to load the operational cost.'); }
};

export const updateOperationalCost = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const cost = await loadCost(req.params.costId);
    await assertOperationalTripOpen(cost.operationalTripId);
    assertDraftCostEditable(cost);
    if (req.body.updatedAt && !sameInstant(req.body.updatedAt, cost.updatedAt)) return operationsFailure(res, 409, 'This cost changed while you were editing it. Refresh and try again.');
    const context = await loadOperationsContext(cost.operationalTripId);
    const mergedAmounts = { subtotal: Object.hasOwn(req.body, 'subtotal') ? req.body.subtotal : cost.subtotal, taxAmount: Object.hasOwn(req.body, 'taxAmount') ? req.body.taxAmount : cost.taxAmount, adjustmentAmount: Object.hasOwn(req.body, 'adjustmentAmount') ? req.body.adjustmentAmount : cost.adjustmentAmount };
    const body = { ...req.body, ...(Object.keys(req.body).some((key) => ['subtotal', 'taxAmount', 'adjustmentAmount'].includes(key)) ? mergedAmounts : {}) };
    const payload = await costPayload(body, context, { partial: true });
    Object.assign(cost, payload);
    const actor = operationsActor(req); cost.updatedBy = actor.id; cost.history.push(actorHistory('UPDATED', 'DRAFT', 'DRAFT', actor));
    await cost.save();
    return res.json({ success: true, data: cost });
  } catch (error) { return handleOperationsError(res, error, 'Unable to update the operational cost.'); }
};

export const finalizeOperationalCost = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const cost = await loadCost(req.params.costId); await assertOperationalTripOpen(cost.operationalTripId);
    if (cost.status === 'FINALIZED') return res.json({ success: true, data: cost, idempotent: true });
    if (cost.status !== 'DRAFT') return operationsFailure(res, 409, 'A void cost cannot be finalized.');
    const actor = operationsActor(req); cost.status = 'FINALIZED'; cost.finalizedAt = new Date(); cost.finalizedBy = actor.id; cost.updatedBy = actor.id; cost.history.push(actorHistory('FINALIZED', 'DRAFT', 'FINALIZED', actor));
    await cost.save(); return res.json({ success: true, data: cost });
  } catch (error) { return handleOperationsError(res, error, 'Unable to finalize the operational cost.'); }
};

export const voidOperationalCost = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const cost = await loadCost(req.params.costId); await assertOperationalTripOpen(cost.operationalTripId);
    if (cost.status === 'VOID') return res.json({ success: true, data: cost, idempotent: true });
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 5) return operationsFailure(res, 400, 'A meaningful void reason is required.', 'VOID_REASON_REQUIRED');
    if (await OperationalSettlement.exists({ operationalCostId: cost._id, status: 'RECORDED' })) return operationsFailure(res, 409, 'Void recorded settlements before voiding this cost.', 'ACTIVE_SETTLEMENTS_EXIST');
    const actor = operationsActor(req); const from = cost.status; cost.status = 'VOID'; cost.voidReason = reason; cost.voidedAt = new Date(); cost.voidedBy = actor.id; cost.updatedBy = actor.id; cost.history.push(actorHistory('VOIDED', from, 'VOID', actor, reason));
    await cost.save(); return res.json({ success: true, data: cost });
  } catch (error) { return handleOperationsError(res, error, 'Unable to void the operational cost.'); }
};

export const getOperationalFinancialSummary = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const context = await loadOperationsContext(req.params.operationId);
    const [costs, settlements] = await Promise.all([OperationalCost.find({ operationalTripId: context.operationalTrip._id }).lean(), OperationalSettlement.find({ operationalTripId: context.operationalTrip._id }).lean()]);
    return res.json({ success: true, data: summarizeOperationalFinancials({ bookings: context.bookings, costs, settlements }) });
  } catch (error) { return handleOperationsError(res, error, 'Unable to load the operational financial summary.'); }
};
