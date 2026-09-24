const text = (value) => typeof value === 'string' ? value.trim() : '';

export const POLICY_FIELDS = [
  'paymentTerms', 'cancellationPolicy', 'refundNotes',
  'travelRequirements', 'importantInformation', 'termsAndConditions'
];

export const buildQuotationPolicyDefaults = (quotation = {}) => {
  const payment = quotation.paymentTerms || {};
  const percent = Number(payment.depositPercent);
  const days = Number(payment.balanceDueDays);
  let paymentCopy = 'Payment terms will be confirmed with final commercial approval.';
  if (payment.paymentMode === 'FULL') {
    paymentCopy = 'Full payment is required to confirm the booking, subject to final commercial approval.';
  } else if (Number.isFinite(percent) && percent > 0 && Number.isFinite(days) && days >= 0) {
    paymentCopy = `A ${percent}% deposit is required to provisionally confirm the booking. The remaining balance is due ${days} days before departure.`;
  }
  const validity = quotation.validUntil && !Number.isNaN(new Date(quotation.validUntil).getTime())
    ? `This quotation is valid until ${new Date(quotation.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}. `
    : '';
  return {
    paymentTerms: paymentCopy,
    cancellationPolicy: 'Cancellation terms depend on the confirmed services, supplier conditions, and timing. The applicable conditions must be reviewed and confirmed in this quotation before sharing.',
    refundNotes: 'Any refund is subject to the confirmed cancellation terms and applicable supplier conditions. The amount and timing will be confirmed after review.',
    travelRequirements: 'Travelers should carry valid government identification, weather-appropriate clothing, and any personal medication. The team will confirm any trip-specific requirements before departure.',
    importantInformation: 'Hotels, transport, and activities remain subject to availability and confirmation. Only the services expressly listed in the final quotation are included.',
    termsAndConditions: `${validity}Services remain subject to availability until confirmed. Travelers are responsible for providing accurate details. Changes to the itinerary or services may require a revised quotation. Only expressly listed services form part of this proposal.`
  };
};

export const normalizeQuotationPolicies = (quotation = {}) => ({
  ...quotation.policies,
  cancellationPolicy: text(quotation.policies?.cancellationPolicy)
    || (Array.isArray(quotation.cancellationPolicy) ? quotation.cancellationPolicy.filter(Boolean).join('\n') : ''),
  termsAndConditions: text(quotation.policies?.termsAndConditions)
    || (Array.isArray(quotation.termsAndConditions) ? quotation.termsAndConditions.filter(Boolean).join('\n') : '')
});
