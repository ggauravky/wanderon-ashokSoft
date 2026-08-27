/**
 * Authoritative Server-Side Pricing Engine for WanderLuxe Quotation Builder (Phase 3)
 * 
 * Computes deterministic multi-segment hotel alternatives, transport options,
 * activities, add-ons, age-based traveler costing, markups, discounts,
 * Indian Tour Operator GST (5%), and internal supplier profitability margins.
 */

export const calculateQuotationPrice = (quotationData = {}) => {
  const reqs = quotationData.tripRequirements || {};
  const adults = Math.max(1, parseInt(reqs.adults, 10) || 2);
  const children = Math.max(0, parseInt(reqs.children, 10) || 0);
  const infants = Math.max(0, parseInt(reqs.infants, 10) || 0);
  const totalTravelers = adults + children + infants;
  const tripNights = Math.max(1, parseInt(reqs.nights, 10) || parseInt(reqs.days, 10) - 1 || 4);

  // Pricing Rules for Age Multipliers
  const rules = quotationData.pricingRules || {};
  const adultMultiplier = rules.adultMultiplier !== undefined ? Number(rules.adultMultiplier) : 1.0;
  const childMultiplier = rules.childMultiplier !== undefined ? Number(rules.childMultiplier) : 0.70;
  const infantMultiplier = rules.infantMultiplier !== undefined ? Number(rules.infantMultiplier) : 0.0;

  // Effective paying pax weight for per-person rate distribution
  const effectiveTravelers = Math.max(
    1,
    Number((adults * adultMultiplier + children * childMultiplier + infants * infantMultiplier).toFixed(2))
  );

  // 1. Base Package Price & Internal Supplier Cost
  const customerBasePrice = Math.max(0, Number(quotationData.pricing?.customerBasePrice || 0));
  const internalBaseCost = Math.max(0, Number(quotationData.pricing?.internalBaseCost || 0));

  // 2. Hotel Options (Groupable by Stay Segment, sum only selected === true)
  let internalHotelCost = 0;
  let customerHotelPrice = 0;
  const processedHotels = (quotationData.hotelOptions || []).map((hotel, idx) => {
    const rooms = Math.max(1, parseInt(hotel.rooms, 10) || 1);
    const nights = Math.max(1, parseInt(hotel.nights, 10) || tripNights);
    const costPerNight = Math.max(0, Number(hotel.costPerNight || 0));
    const pricePerNight = Math.max(0, Number(hotel.pricePerNight || 0));

    const totalCost = Math.round(costPerNight * nights * rooms);
    const totalPrice = Math.round(pricePerNight * nights * rooms);

    const isSelected = Boolean(hotel.selected);
    if (isSelected) {
      internalHotelCost += totalCost;
      customerHotelPrice += totalPrice;
    }

    return {
      ...hotel,
      optionId: hotel.optionId || `hotel_opt_${idx + 1}`,
      segmentId: hotel.segmentId || 'seg_default',
      segmentName: hotel.segmentName || 'Primary Stay',
      segmentOrder: hotel.segmentOrder || 1,
      rooms,
      nights,
      costPerNight,
      pricePerNight,
      totalCost,
      totalPrice,
      selected: isSelected
    };
  });

  // 3. Transport Options (sum only selected === true)
  let internalTransportCost = 0;
  let customerTransportPrice = 0;
  const processedTransports = (quotationData.transportOptions || []).map((trans, idx) => {
    const quantity = Math.max(1, parseInt(trans.quantity, 10) || 1);
    const unitCost = Math.max(0, Number(trans.unitCost || 0));
    const unitPrice = Math.max(0, Number(trans.unitPrice || 0));

    const totalCost = Math.round(unitCost * quantity);
    const totalPrice = Math.round(unitPrice * quantity);

    const isSelected = Boolean(trans.selected);
    if (isSelected) {
      internalTransportCost += totalCost;
      customerTransportPrice += totalPrice;
    }

    return {
      ...trans,
      optionId: trans.optionId || `trans_opt_${idx + 1}`,
      quantity,
      unitCost,
      unitPrice,
      totalCost,
      totalPrice,
      selected: isSelected
    };
  });

  // 4. Activities (Per Person, Per Vehicle, Fixed)
  let internalActivityCost = 0;
  let customerActivityPrice = 0;
  const processedActivities = (quotationData.activities || []).map((act, idx) => {
    const quantity = Math.max(1, parseInt(act.quantity, 10) || 1);
    const unitCost = Math.max(0, Number(act.unitCost || 0));
    const unitPrice = Math.max(0, Number(act.unitPrice || 0));
    const pricingType = act.pricingType || 'PER_PERSON';

    let multiplier = 1;
    if (pricingType === 'PER_PERSON') {
      multiplier = effectiveTravelers;
    } else if (pricingType === 'PER_VEHICLE') {
      multiplier = quantity;
    }

    const totalCost = Math.round(unitCost * multiplier);
    const totalPrice = Math.round(unitPrice * multiplier);

    const isSelected = act.selected !== false;
    if (isSelected) {
      internalActivityCost += totalCost;
      customerActivityPrice += totalPrice;
    }

    return {
      ...act,
      activityId: act.activityId || `act_${idx + 1}`,
      quantity,
      unitCost,
      unitPrice,
      totalCost,
      totalPrice,
      pricingType,
      selected: isSelected
    };
  });

  // 5. Add-ons (Per Person, Per Night, Per Vehicle, Fixed)
  let internalAddOnCost = 0;
  let customerAddOnPrice = 0;
  const processedAddOns = (quotationData.addOns || []).map((addon, idx) => {
    const quantity = Math.max(1, parseInt(addon.quantity, 10) || 1);
    const unitCost = Math.max(0, Number(addon.unitCost || 0));
    const unitPrice = Math.max(0, Number(addon.unitPrice || 0));
    const pricingType = addon.pricingType || 'FIXED';

    let multiplier = 1;
    if (pricingType === 'PER_PERSON') {
      multiplier = effectiveTravelers;
    } else if (pricingType === 'PER_NIGHT') {
      multiplier = tripNights;
    } else if (pricingType === 'PER_VEHICLE') {
      multiplier = quantity;
    }

    const totalCost = Math.round(unitCost * quantity * (pricingType === 'PER_PERSON' ? effectiveTravelers : (pricingType === 'PER_NIGHT' ? tripNights : 1)));
    const totalPrice = Math.round(unitPrice * quantity * (pricingType === 'PER_PERSON' ? effectiveTravelers : (pricingType === 'PER_NIGHT' ? tripNights : 1)));

    const isSelected = Boolean(addon.selected);
    if (isSelected) {
      internalAddOnCost += totalCost;
      customerAddOnPrice += totalPrice;
    }

    return {
      ...addon,
      addonId: addon.addonId || `addon_${idx + 1}`,
      quantity,
      unitCost,
      unitPrice,
      totalCost,
      totalPrice,
      pricingType,
      selected: isSelected
    };
  });

  // 6. Cost & Price Aggregations
  const totalInternalCost = internalBaseCost + internalHotelCost + internalTransportCost + internalActivityCost + internalAddOnCost;
  const subtotal = customerBasePrice + customerHotelPrice + customerTransportPrice + customerActivityPrice + customerAddOnPrice;

  // 7. Markup Calculation (Percentage or Fixed)
  const markupType = quotationData.pricing?.markupType || 'percentage';
  const markupPercent = Math.max(0, Number(quotationData.pricing?.markupPercent || 0));
  const markupValue = Math.max(0, Number(quotationData.pricing?.markupValue || 0));
  let markupAmount = 0;

  if (markupType === 'fixed' && markupValue > 0) {
    markupAmount = Math.round(markupValue);
  } else if (markupPercent > 0) {
    markupAmount = Math.round(subtotal * (markupPercent / 100));
  } else if (quotationData.pricing?.markupAmount > 0) {
    markupAmount = Math.round(Number(quotationData.pricing.markupAmount));
  }

  // 8. Discount Calculation (Percentage or Flat)
  const discountType = quotationData.pricing?.discountType || 'none';
  const discountValue = Math.max(0, Number(quotationData.pricing?.discountValue || 0));
  let discountAmount = 0;
  if (discountType === 'percentage' && discountValue > 0) {
    discountAmount = Math.round((subtotal + markupAmount) * (discountValue / 100));
  } else if (discountType === 'flat' && discountValue > 0) {
    discountAmount = Math.min(subtotal + markupAmount, Math.round(discountValue));
  }

  // 9. Taxable Amount & Taxes (GST 5% standard + Optional TCS)
  const taxableAmount = Math.max(0, subtotal + markupAmount - discountAmount);
  const gstPercent = quotationData.pricing?.gstPercent !== undefined ? Number(quotationData.pricing.gstPercent) : 5;
  const gstAmount = Math.round(taxableAmount * (gstPercent / 100));

  const tcsPercent = Math.max(0, Number(quotationData.pricing?.tcsPercent || 0));
  const tcsAmount = Math.round(taxableAmount * (tcsPercent / 100));

  // 10. Final Customer Total & Age-Tier Per-Person Pricing
  const finalTotal = taxableAmount + gstAmount + tcsAmount;
  const perPersonPrice = totalTravelers > 0 ? Math.round(finalTotal / totalTravelers) : finalTotal;

  const adultPrice = Math.round(finalTotal / effectiveTravelers);
  const childPrice = Math.round(adultPrice * childMultiplier);
  const infantPrice = Math.round(adultPrice * infantMultiplier);

  const adultTotal = Math.round(adultPrice * adults);
  const childTotal = Math.round(childPrice * children);
  const infantTotal = Math.round(infantPrice * infants);

  // 11. Payment Terms (10% Deposit Schedule)
  const depositPercent = Math.max(5, Math.min(100, Number(quotationData.paymentTerms?.depositPercent || 10)));
  const balanceDueDays = Math.max(1, Number(quotationData.paymentTerms?.balanceDueDays || 6));
  const depositRequired = Math.round(finalTotal * (depositPercent / 100));
  const balanceAmount = Math.max(0, finalTotal - depositRequired);

  // 12. Internal Profitability & Margin (Staff only)
  const projectedMargin = taxableAmount - totalInternalCost;
  const projectedMarginPercent = taxableAmount > 0 
    ? Number(((projectedMargin / taxableAmount) * 100).toFixed(2)) 
    : 0;

  return {
    tripRequirements: {
      ...reqs,
      adults,
      children,
      infants,
      totalTravelers,
      nights: tripNights
    },
    pricingRules: {
      adultMultiplier,
      childMultiplier,
      infantMultiplier,
      maxSalesDiscount: rules.maxSalesDiscount || 10,
      maxSalesMarkup: rules.maxSalesMarkup || 30
    },
    hotelOptions: processedHotels,
    transportOptions: processedTransports,
    activities: processedActivities,
    addOns: processedAddOns,
    paymentTerms: {
      depositPercent,
      balanceDueDays,
      paymentMode: quotationData.paymentTerms?.paymentMode || 'PARTIAL',
      currency: quotationData.paymentTerms?.currency || 'INR'
    },
    pricing: {
      internalBaseCost,
      internalHotelCost,
      internalTransportCost,
      internalActivityCost,
      internalAddOnCost,
      totalInternalCost,

      customerBasePrice,
      customerHotelPrice,
      customerTransportPrice,
      customerActivityPrice,
      customerAddOnPrice,
      subtotal,

      markupType,
      markupPercent,
      markupValue,
      markupAmount,

      discountType,
      discountValue,
      discountAmount,

      taxableAmount,
      gstPercent,
      gstAmount,
      tcsPercent,
      tcsAmount,

      finalTotal,
      perPersonPrice,
      adultPrice,
      childPrice,
      infantPrice,
      adultTotal,
      childTotal,
      infantTotal,

      depositRequired,
      balanceAmount,

      projectedMargin,
      projectedMarginPercent
    }
  };
};

export default {
  calculateQuotationPrice
};
