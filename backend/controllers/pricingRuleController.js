import mongoose from 'mongoose';
import PricingRule from '../models/PricingRule.js';

const isDbConnected = () => mongoose.connection?.readyState === 1;
const requirePricingDatabase = (res) => {
  if (isDbConnected()) return true;
  res.status(503).json({ success: false, message: 'Pricing rules are temporarily unavailable.' });
  return false;
};
const findPricingRule = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byId = await PricingRule.findById(id);
    if (byId) return byId;
  }
  return PricingRule.findOne({ code: String(id || '').toUpperCase() });
};

export const getPricingRules = async (req, res) => {
  try {
    if (!requirePricingDatabase(res)) return;
    const { ruleType, destination, isActive } = req.query;
    const filter = {};
    if (ruleType && ruleType !== 'All') filter.ruleType = ruleType;
    if (destination && destination !== 'All') filter.destination = new RegExp(destination, 'i');
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const rules = await PricingRule.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: rules.length, rules });
  } catch (error) {
    console.error('getPricingRules Error:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch pricing rules.' });
  }
};

export const getPricingRuleById = async (req, res) => {
  try {
    if (!requirePricingDatabase(res)) return;
    const rule = await findPricingRule(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Pricing rule not found.' });
    res.json({ success: true, rule });
  } catch (error) {
    console.error('getPricingRuleById Error:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch pricing rule.' });
  }
};

export const createPricingRule = async (req, res) => {
  try {
    if (!requirePricingDatabase(res)) return;
    const {
      name, code, description, ruleType, destination, tripId, calculationType,
      value, minTravelers, maxTravelers, effectiveFrom, effectiveUntil,
      seasonStartDate, seasonEndDate, isActive
    } = req.body;
    if (!name || !code || !ruleType || value === undefined) {
      return res.status(400).json({ success: false, message: 'Name, unique code, rule type, and value are required.' });
    }

    const cleanCode = code.toUpperCase().trim();
    if (await PricingRule.exists({ code: cleanCode })) {
      return res.status(409).json({ success: false, message: `Pricing rule with code "${cleanCode}" already exists.` });
    }

    const userId = req.user?._id;
    const rule = await PricingRule.create({
      name: name.trim(), code: cleanCode, description: description || '', ruleType,
      destination: destination || 'All', tripId: tripId || 'All',
      calculationType: calculationType || 'percentage', value: Number(value),
      minTravelers: minTravelers ? Number(minTravelers) : 1,
      maxTravelers: maxTravelers ? Number(maxTravelers) : 100,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
      seasonStartDate: seasonStartDate ? new Date(seasonStartDate) : null,
      seasonEndDate: seasonEndDate ? new Date(seasonEndDate) : null,
      isActive: isActive !== false, changeHistory: [], createdBy: userId, updatedBy: userId
    });
    res.status(201).json({ success: true, message: `Pricing rule "${rule.name}" created successfully.`, rule });
  } catch (error) {
    console.error('createPricingRule Error:', error);
    res.status(500).json({ success: false, message: 'Unable to create pricing rule.' });
  }
};

export const updatePricingRule = async (req, res) => {
  try {
    if (!requirePricingDatabase(res)) return;
    const rule = await findPricingRule(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Pricing rule not found.' });
    const {
      name, description, ruleType, destination, tripId, calculationType, value,
      minTravelers, maxTravelers, effectiveFrom, effectiveUntil,
      seasonStartDate, seasonEndDate, isActive, changeReason
    } = req.body;

    if (value !== undefined && (Number(value) !== rule.value || (calculationType && calculationType !== rule.calculationType))) {
      rule.changeHistory.push({
        modifiedBy: req.user?._id,
        modifiedByName: req.user?.name || req.user?.email || 'Admin',
        previousValue: rule.value,
        newValue: Number(value),
        previousType: rule.calculationType,
        newType: calculationType || rule.calculationType,
        changeReason: changeReason || 'Pricing rule adjusted by Admin',
        changedAt: new Date()
      });
    }

    if (name) rule.name = name.trim();
    if (description !== undefined) rule.description = description;
    if (ruleType) rule.ruleType = ruleType;
    if (destination) rule.destination = destination;
    if (tripId) rule.tripId = tripId;
    if (calculationType) rule.calculationType = calculationType;
    if (value !== undefined) rule.value = Number(value);
    if (minTravelers !== undefined) rule.minTravelers = Number(minTravelers);
    if (maxTravelers !== undefined) rule.maxTravelers = Number(maxTravelers);
    if (effectiveFrom) rule.effectiveFrom = new Date(effectiveFrom);
    if (effectiveUntil !== undefined) rule.effectiveUntil = effectiveUntil ? new Date(effectiveUntil) : null;
    if (seasonStartDate !== undefined) rule.seasonStartDate = seasonStartDate ? new Date(seasonStartDate) : null;
    if (seasonEndDate !== undefined) rule.seasonEndDate = seasonEndDate ? new Date(seasonEndDate) : null;
    if (isActive !== undefined) rule.isActive = Boolean(isActive);
    rule.updatedBy = req.user?._id;
    await rule.save();
    res.json({ success: true, message: `Pricing rule "${rule.name}" updated successfully.`, rule });
  } catch (error) {
    console.error('updatePricingRule Error:', error);
    res.status(500).json({ success: false, message: 'Unable to update pricing rule.' });
  }
};

export const togglePricingRule = async (req, res) => {
  try {
    if (!requirePricingDatabase(res)) return;
    const rule = await findPricingRule(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Pricing rule not found.' });
    rule.isActive = !rule.isActive;
    rule.updatedBy = req.user?._id;
    await rule.save();
    res.json({ success: true, message: `Pricing rule ${rule.isActive ? 'activated' : 'deactivated'} successfully.`, rule });
  } catch (error) {
    console.error('togglePricingRule Error:', error);
    res.status(500).json({ success: false, message: 'Unable to toggle pricing rule.' });
  }
};

export const deletePricingRule = async (req, res) => {
  try {
    if (!requirePricingDatabase(res)) return;
    const rule = await findPricingRule(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Pricing rule not found.' });
    await rule.deleteOne();
    res.json({ success: true, message: 'Pricing rule deleted successfully.', id: rule._id });
  } catch (error) {
    console.error('deletePricingRule Error:', error);
    res.status(500).json({ success: false, message: 'Unable to delete pricing rule.' });
  }
};

export const evaluatePricingRules = async (req, res) => {
  try {
    if (!requirePricingDatabase(res)) return;
    const { destination, tripId, startDate, travelersCount = 1, baseAmount = 0 } = req.body;
    const allRules = await PricingRule.find({ isActive: true });
    const pax = Math.max(1, Number(travelersCount));
    const base = Math.max(0, Number(baseAmount));
    const tripStart = startDate ? new Date(startDate) : new Date();
    const applicableRules = [];
    let totalAdjustment = 0;

    for (const rule of allRules) {
      if (rule.destination !== 'All' && destination && !new RegExp(rule.destination, 'i').test(destination)) continue;
      if (rule.tripId !== 'All' && tripId && rule.tripId !== tripId) continue;
      if (pax < rule.minTravelers || pax > rule.maxTravelers) continue;
      if (rule.seasonStartDate && rule.seasonEndDate &&
          (tripStart < new Date(rule.seasonStartDate) || tripStart > new Date(rule.seasonEndDate))) continue;

      let adjustmentAmount = rule.calculationType === 'percentage'
        ? Math.round(base * (rule.value / 100))
        : Math.round(rule.value);
      if (rule.ruleType === 'discount') adjustmentAmount = -Math.abs(adjustmentAmount);
      applicableRules.push({
        code: rule.code, name: rule.name, ruleType: rule.ruleType,
        calculationType: rule.calculationType, value: rule.value, adjustmentAmount
      });
      totalAdjustment += adjustmentAmount;
    }

    res.json({
      success: true,
      baseAmount: base,
      travelersCount: pax,
      applicableRules,
      totalAdjustment,
      adjustedTotal: Math.max(0, base + totalAdjustment)
    });
  } catch (error) {
    console.error('evaluatePricingRules Error:', error);
    res.status(500).json({ success: false, message: 'Unable to evaluate pricing rules.' });
  }
};
