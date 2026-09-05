import mongoose from 'mongoose';
import PricingRule from '../models/PricingRule.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// Initial in-memory rules fallback for offline test resilience
export let memoryPricingRules = [
  {
    _id: 'rule_1',
    name: 'Peak Festive Season Surcharge (Diwali/New Year)',
    code: 'SEASON_PEAK_FESTIVE_15',
    description: '15% surcharge applied to all journeys during festive peak demand.',
    ruleType: 'seasonal',
    destination: 'All',
    tripId: 'All',
    calculationType: 'percentage',
    value: 15,
    minTravelers: 1,
    maxTravelers: 100,
    seasonStartDate: new Date('2026-10-15'),
    seasonEndDate: new Date('2026-11-15'),
    effectiveFrom: new Date('2026-01-01'),
    effectiveUntil: new Date('2026-12-31'),
    isActive: true,
    changeHistory: [],
    createdAt: new Date('2026-08-01')
  },
  {
    _id: 'rule_2',
    name: 'Himalayan High Altitude Transport Surcharge',
    code: 'HIMALAYA_TRANSPORT_SURCHARGE',
    description: 'Flat ₹2,500 transport surcharge for difficult high-altitude routes (Spiti/Ladakh).',
    ruleType: 'component',
    destination: 'Spiti Valley',
    tripId: 'All',
    calculationType: 'flat',
    value: 2500,
    minTravelers: 1,
    maxTravelers: 100,
    effectiveFrom: new Date('2026-01-01'),
    effectiveUntil: new Date('2026-12-31'),
    isActive: true,
    changeHistory: [],
    createdAt: new Date('2026-08-01')
  },
  {
    _id: 'rule_3',
    name: 'Large Group Discount (5+ Travelers)',
    code: 'GROUP_DISCOUNT_5PLUS',
    description: '5% discount for bookings with 5 or more travelers.',
    ruleType: 'discount',
    destination: 'All',
    tripId: 'All',
    calculationType: 'percentage',
    value: 5,
    minTravelers: 5,
    maxTravelers: 100,
    effectiveFrom: new Date('2026-01-01'),
    effectiveUntil: new Date('2026-12-31'),
    isActive: true,
    changeHistory: [],
    createdAt: new Date('2026-08-01')
  },
  {
    _id: 'rule_4',
    name: 'Indian Tour Operator GST Rule',
    code: 'GST_TOUR_OPERATOR_5',
    description: 'Standard 5% GST for Indian domestic tour packages.',
    ruleType: 'tax',
    destination: 'All',
    tripId: 'All',
    calculationType: 'percentage',
    value: 5,
    minTravelers: 1,
    maxTravelers: 100,
    effectiveFrom: new Date('2026-01-01'),
    effectiveUntil: new Date('2026-12-31'),
    isActive: true,
    changeHistory: [],
    createdAt: new Date('2026-08-01')
  }
];

// @desc    Get all pricing rules
// @route   GET /api/pricing-rules
// @access  Private (Admin, Operations, Sales)
export const getPricingRules = async (req, res) => {
  try {
    const { ruleType, destination, isActive } = req.query;
    const filter = {};

    if (ruleType && ruleType !== 'All') {
      filter.ruleType = ruleType;
    }
    if (destination && destination !== 'All') {
      filter.destination = new RegExp(destination, 'i');
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    let rules = [];
    if (isDbConnected()) {
      try {
        rules = await PricingRule.find(filter).sort({ createdAt: -1 });
      } catch (dbErr) {
        console.warn('Pricing rules DB query warning:', dbErr.message);
      }
    }

    if (rules.length === 0) {
      rules = memoryPricingRules.filter(r => {
        if (ruleType && ruleType !== 'All' && r.ruleType !== ruleType) return false;
        if (destination && destination !== 'All' && r.destination !== 'All' && !new RegExp(destination, 'i').test(r.destination)) return false;
        if (isActive !== undefined && String(r.isActive) !== String(isActive)) return false;
        return true;
      });
    }

    res.json({
      success: true,
      count: rules.length,
      rules
    });
  } catch (error) {
    console.error('getPricingRules Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error fetching pricing rules' });
  }
};

// @desc    Get single pricing rule by ID
// @route   GET /api/pricing-rules/:id
// @access  Private (Admin, Operations, Sales)
export const getPricingRuleById = async (req, res) => {
  try {
    const { id } = req.params;
    let rule = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        rule = await PricingRule.findById(id);
      } catch (e) {}
    }

    if (!rule) {
      rule = memoryPricingRules.find(r => String(r._id) === String(id) || r.code === id);
    }

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found.' });
    }

    res.json({ success: true, rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error fetching pricing rule' });
  }
};

// @desc    Create a new pricing rule
// @route   POST /api/pricing-rules
// @access  Private (Super Admin / Admin only)
export const createPricingRule = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      ruleType,
      destination,
      tripId,
      calculationType,
      value,
      minTravelers,
      maxTravelers,
      effectiveFrom,
      effectiveUntil,
      seasonStartDate,
      seasonEndDate,
      isActive
    } = req.body;

    if (!name || !code || !ruleType || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, unique code, rule type, and value are required.'
      });
    }

    const cleanCode = code.toUpperCase().trim();
    const userId = req.user?._id;

    const ruleData = {
      name: name.trim(),
      code: cleanCode,
      description: description || '',
      ruleType,
      destination: destination || 'All',
      tripId: tripId || 'All',
      calculationType: calculationType || 'percentage',
      value: Number(value),
      minTravelers: minTravelers ? Number(minTravelers) : 1,
      maxTravelers: maxTravelers ? Number(maxTravelers) : 100,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
      seasonStartDate: seasonStartDate ? new Date(seasonStartDate) : null,
      seasonEndDate: seasonEndDate ? new Date(seasonEndDate) : null,
      isActive: isActive !== false,
      changeHistory: [],
      createdBy: userId,
      updatedBy: userId
    };

    let newRule = null;
    if (isDbConnected()) {
      try {
        const existing = await PricingRule.findOne({ code: cleanCode });
        if (existing) {
          return res.status(400).json({ success: false, message: `Pricing rule with code "${cleanCode}" already exists.` });
        }
        newRule = await PricingRule.create(ruleData);
      } catch (dbErr) {
        console.warn('PricingRule DB save warning:', dbErr.message);
      }
    }

    if (!newRule) {
      const existing = memoryPricingRules.find(r => r.code === cleanCode);
      if (existing) {
        return res.status(400).json({ success: false, message: `Pricing rule with code "${cleanCode}" already exists.` });
      }
      newRule = {
        _id: 'rule_' + Date.now(),
        ...ruleData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryPricingRules.unshift(newRule);
    }

    res.status(201).json({
      success: true,
      message: `Pricing rule "${newRule.name}" created successfully.`,
      rule: newRule
    });
  } catch (error) {
    console.error('createPricingRule Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error creating pricing rule' });
  }
};

// @desc    Update pricing rule with change history tracking
// @route   PUT /api/pricing-rules/:id
// @access  Private (Super Admin / Admin only)
export const updatePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      ruleType,
      destination,
      tripId,
      calculationType,
      value,
      minTravelers,
      maxTravelers,
      effectiveFrom,
      effectiveUntil,
      seasonStartDate,
      seasonEndDate,
      isActive,
      changeReason
    } = req.body;

    let rule = null;
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        rule = await PricingRule.findById(id);
      } catch (e) {}
    }

    if (!rule) {
      const memIndex = memoryPricingRules.findIndex(r => String(r._id) === String(id) || r.code === id);
      if (memIndex !== -1) {
        rule = memoryPricingRules[memIndex];
      }
    }

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found.' });
    }

    const previousValue = rule.value;
    const previousType = rule.calculationType;
    const userId = req.user?._id;
    const userName = req.user?.name || req.user?.email || 'Admin';

    // Track history if value or calculation type changes
    if (value !== undefined && (Number(value) !== previousValue || (calculationType && calculationType !== previousType))) {
      const historyEntry = {
        modifiedBy: userId,
        modifiedByName: userName,
        previousValue,
        newValue: Number(value),
        previousType,
        newType: calculationType || previousType,
        changeReason: changeReason || 'Pricing rule adjusted by Admin',
        changedAt: new Date()
      };
      if (!Array.isArray(rule.changeHistory)) rule.changeHistory = [];
      rule.changeHistory.push(historyEntry);
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
    rule.updatedBy = userId;

    if (isDbConnected() && typeof rule.save === 'function') {
      await rule.save();
    }

    res.json({
      success: true,
      message: `Pricing rule "${rule.name}" updated successfully.`,
      rule
    });
  } catch (error) {
    console.error('updatePricingRule Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error updating pricing rule' });
  }
};

// @desc    Toggle pricing rule active status
// @route   PUT /api/pricing-rules/:id/toggle
// @access  Private (Super Admin / Admin only)
export const togglePricingRule = async (req, res) => {
  try {
    const { id } = req.params;

    let rule = null;
    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        rule = await PricingRule.findById(id);
      } catch (e) {}
    }

    if (!rule) {
      rule = memoryPricingRules.find(r => String(r._id) === String(id) || r.code === id);
    }

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found.' });
    }

    rule.isActive = !rule.isActive;
    if (isDbConnected() && typeof rule.save === 'function') {
      await rule.save();
    }

    res.json({
      success: true,
      message: `Pricing rule ${rule.isActive ? 'activated' : 'deactivated'} successfully.`,
      rule
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error toggling pricing rule' });
  }
};

// @desc    Delete pricing rule
// @route   DELETE /api/pricing-rules/:id
// @access  Private (Super Admin / Admin only)
export const deletePricingRule = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await PricingRule.findByIdAndDelete(id);
      } catch (e) {}
    }

    memoryPricingRules = memoryPricingRules.filter(r => String(r._id) !== String(id) && r.code !== id);

    res.json({
      success: true,
      message: 'Pricing rule deleted successfully.',
      id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error deleting pricing rule' });
  }
};

// @desc    Evaluate dynamic pricing rules for a given context (Destination, Dates, Travelers, Base Price)
// @route   POST /api/pricing-rules/evaluate
// @access  Private (Sales, Operations, Admin)
export const evaluatePricingRules = async (req, res) => {
  try {
    const { destination, tripId, startDate, endDate, travelersCount = 1, baseAmount = 0 } = req.body;

    let allRules = [];
    if (isDbConnected()) {
      try {
        allRules = await PricingRule.find({ isActive: true });
      } catch (e) {}
    }
    if (allRules.length === 0) {
      allRules = memoryPricingRules.filter(r => r.isActive);
    }

    const pax = Math.max(1, Number(travelersCount));
    const base = Math.max(0, Number(baseAmount));
    const tripStart = startDate ? new Date(startDate) : new Date();

    const applicableRules = [];
    let totalAdjustment = 0;

    for (const rule of allRules) {
      // 1. Destination / Trip filter
      if (rule.destination !== 'All' && destination && !new RegExp(rule.destination, 'i').test(destination)) {
        continue;
      }
      if (rule.tripId !== 'All' && tripId && rule.tripId !== tripId) {
        continue;
      }

      // 2. Traveler count range
      if (pax < rule.minTravelers || pax > rule.maxTravelers) {
        continue;
      }

      // 3. Seasonal date range
      if (rule.seasonStartDate && rule.seasonEndDate) {
        const seasonStart = new Date(rule.seasonStartDate);
        const seasonEnd = new Date(rule.seasonEndDate);
        if (tripStart < seasonStart || tripStart > seasonEnd) {
          continue;
        }
      }

      // Calculate adjustment amount
      let adjustmentAmount = 0;
      if (rule.calculationType === 'percentage') {
        adjustmentAmount = Math.round(base * (rule.value / 100));
      } else {
        adjustmentAmount = Math.round(rule.value);
      }

      if (rule.ruleType === 'discount') {
        adjustmentAmount = -Math.abs(adjustmentAmount);
      }

      applicableRules.push({
        code: rule.code,
        name: rule.name,
        ruleType: rule.ruleType,
        calculationType: rule.calculationType,
        value: rule.value,
        adjustmentAmount
      });

      totalAdjustment += adjustmentAmount;
    }

    const adjustedTotal = Math.max(0, base + totalAdjustment);

    res.json({
      success: true,
      baseAmount: base,
      travelersCount: pax,
      applicableRules,
      totalAdjustment,
      adjustedTotal
    });
  } catch (error) {
    console.error('evaluatePricingRules Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error evaluating pricing rules' });
  }
};
