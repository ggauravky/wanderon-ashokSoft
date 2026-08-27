import React from 'react';
import {
  MapPin, Calendar, Clock, Users, Hotel, Car, Compass,
  CheckCircle2, XCircle, ShieldCheck, Tag, Sparkles, Check, Phone, Mail, MessageSquare
} from 'lucide-react';

/**
 * High-Definition, Isolated A4 Travel Quotation Proposal Document
 * ForwardRef-enabled for high-DPI canvas capture and PDF generation.
 * STRICT ZERO-LEAKAGE: Does not render supplier costs, markups, or internal profit margins.
 */
const QuotationDocument = React.forwardRef(({ quotation, isCustomerView = true }, ref) => {
  if (!quotation) return null;

  const tripReq = quotation.tripRequirements || {};
  const customer = quotation.customerSnapshot || {};
  const pricing = quotation.pricing || {};
  const payment = quotation.paymentTerms || {};
  const hotels = quotation.hotelOptions || [];
  const transport = quotation.transportOptions || [];
  const activities = quotation.activities || [];
  const addOns = quotation.addOns || [];
  const inclusions = quotation.inclusions || [];
  const exclusions = quotation.exclusions || [];
  const terms = quotation.termsAndConditions || [];
  const cancellation = quotation.cancellationPolicy || [];
  const assigned = quotation.assignedToSnapshot || {};

  // Group hotel options by stay segment
  const staySegmentMap = new Map();
  hotels.forEach((h, idx) => {
    const segId = h.segmentId || `seg_${idx + 1}`;
    const segName = h.segmentName || (hotels.length > 1 ? `Stay Segment ${idx + 1}` : 'Primary Stay');
    if (!staySegmentMap.has(segId)) {
      staySegmentMap.set(segId, {
        segmentId: segId,
        segmentName: segName,
        segmentOrder: h.segmentOrder || (staySegmentMap.size + 1),
        options: []
      });
    }
    staySegmentMap.get(segId).options.push(h);
  });
  const staySegments = Array.from(staySegmentMap.values()).sort((a, b) => a.segmentOrder - b.segmentOrder);

  const selectedHotels = hotels.filter(h => h.selected);
  const selectedTransport = transport.find(t => t.selected) || transport[0];
  const selectedActivities = activities.filter(a => a.selected !== false);
  const selectedAddOns = addOns.filter(a => a.selected);

  const formattedDate = new Date(quotation.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const validUntilDate = quotation.validUntil
    ? new Date(quotation.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '7 Days from Issue';

  const isExpired = quotation.validUntil && new Date(quotation.validUntil).getTime() < Date.now();
  const hasChildrenOrInfants = (tripReq.children || 0) > 0 || (tripReq.infants || 0) > 0;

  return (
    <div
      ref={ref}
      id="quotation-print-document"
      className="w-[794px] bg-white text-slate-900 mx-auto p-10 font-sans shadow-lg border border-slate-200 relative print:shadow-none print:border-none print:w-full"
      style={{ boxSizing: 'border-box', minHeight: '1123px' }}
    >
      {/* ========================================================================= */}
      {/* 1. DOCUMENT HEADER & BRANDING */}
      {/* ========================================================================= */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black">
              <Compass size={18} />
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900">
              WANDER<span className="text-emerald-600">LUXE</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Bespoke Travel Expeditions & Luxury Concierge
          </p>
          <h1 className="text-xl font-black text-slate-900 pt-3 leading-tight max-w-lg">
            {tripReq.title || 'Custom Curated Journey Proposal'}
          </h1>
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1 text-emerald-700">
              <MapPin size={13} /> {tripReq.destination}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-indigo-700">
              <Clock size={13} /> {tripReq.duration || `${tripReq.days || 5}D/${tripReq.nights || 4}N`}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-700">
              <Users size={13} /> {tripReq.totalTravelers || 2} Travelers ({tripReq.travelStyle || 'Bespoke'})
            </span>
          </div>
        </div>

        <div className="text-right space-y-1.5 shrink-0">
          <div className="text-xs font-mono font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 inline-block">
            {quotation.quotationNumber || 'WL-Q-2026-DRAFT'} (v{quotation.version || 1})
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Issue Date: {formattedDate}</div>
          <div>
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full inline-block ${
              isExpired
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {isExpired ? 'Proposal Expired' : `Valid Until: ${validUntilDate}`}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CUSTOMER & JOURNEY SPECIFICATION CARD */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 mb-6 grid grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Prepared Exclusively For</span>
          <strong className="text-sm font-black text-slate-900 block">{customer.name || 'Valued Traveler'}</strong>
          <span className="text-[11px] text-slate-600 font-medium block truncate">{customer.email}</span>
          <span className="text-[11px] text-slate-600 font-medium block">{customer.phone}</span>
        </div>
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Travel Dates & Window</span>
          <strong className="text-xs font-bold text-slate-900 block">
            {tripReq.startDate ? new Date(tripReq.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Flexible Departure'}
            {tripReq.endDate ? ` — ${new Date(tripReq.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </strong>
          <span className="text-[11px] text-slate-600 font-medium block">
            Duration: {tripReq.days || 5} Days / {tripReq.nights || 4} Nights
          </span>
          <span className="text-[11px] text-emerald-700 font-bold block">
            Party: {tripReq.adults || 2} Adult(s)
            {(tripReq.children || 0) > 0 ? `, ${tripReq.children} Child(ren)` : ''}
            {(tripReq.infants || 0) > 0 ? `, ${tripReq.infants} Infant(s)` : ''}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Concierge Specialist</span>
          <strong className="text-xs font-bold text-slate-900 block">{assigned.name || 'WanderLuxe Senior Specialist'}</strong>
          <span className="text-[11px] text-slate-600 font-medium block truncate">{assigned.email || 'concierge@wanderluxe.in'}</span>
          <span className="text-[11px] text-slate-600 font-medium block">{assigned.phone || '+91 85420 36499'}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DAY-BY-DAY ITINERARY TIMELINE */}
      {/* ========================================================================= */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-600">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Calendar size={14} className="text-emerald-600" /> Day-by-Day Journey Itinerary ({quotation.itinerary?.length || 0} Days)
          </h2>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Custom Tailored Route
          </span>
        </div>

        <div className="space-y-3">
          {(quotation.itinerary || []).map((day, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs space-y-1.5 page-break-inside-avoid">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[10px] font-black">
                    DAY {day.day || idx + 1}
                  </span>
                  <h3 className="font-black text-slate-900 text-xs">{day.title}</h3>
                </div>
                {day.mealsIncluded?.length > 0 && (
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                    🍽️ {day.mealsIncluded.join(', ')}
                  </span>
                )}
              </div>

              {day.description && (
                <p className="text-[11px] text-slate-600 leading-relaxed">{day.description}</p>
              )}

              {/* Mini Morning / Afternoon / Evening Timeline */}
              {(day.morning || day.afternoon || day.evening) && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {day.morning && (
                    <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                      <span className="text-[9px] font-black uppercase text-amber-700 block">🌅 Morning</span>
                      <span className="text-[10px] text-slate-700 line-clamp-2">{day.morning}</span>
                    </div>
                  )}
                  {day.afternoon && (
                    <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                      <span className="text-[9px] font-black uppercase text-blue-700 block">☀️ Afternoon</span>
                      <span className="text-[10px] text-slate-700 line-clamp-2">{day.afternoon}</span>
                    </div>
                  )}
                  {day.evening && (
                    <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                      <span className="text-[9px] font-black uppercase text-indigo-700 block">🌙 Evening</span>
                      <span className="text-[10px] text-slate-700 line-clamp-2">{day.evening}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-4 pt-1 border-t border-slate-200/40">
                {day.stay && <span>🏨 Stay: <strong className="text-slate-800">{day.stay}</strong></span>}
                {day.transferDetails && <span>🚗 Fleet: <strong className="text-slate-800">{day.transferDetails}</strong></span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ACCOMMODATION ALTERNATIVES & STAY SEGMENTS */}
      {/* ========================================================================= */}
      <div className="space-y-4 mb-6 page-break-inside-avoid">
        <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Hotel size={14} className="text-emerald-600" /> Accommodation Plan & Hotel Tiers
          </h2>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {staySegments.length} Stay Segment(s)
          </span>
        </div>

        <div className="space-y-3">
          {staySegments.map((segment, sIdx) => {
            const selectedOpt = segment.options.find(o => o.selected) || segment.options[0];

            return (
              <div key={segment.segmentId} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">
                      {sIdx + 1}
                    </span>
                    {segment.segmentName} ({selectedOpt?.nights || 1} Nights)
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    City: {selectedOpt?.city || 'Scheduled Destination'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {segment.options.map((opt) => (
                    <div
                      key={opt.optionId}
                      className={`p-3 rounded-lg border text-xs space-y-1 ${
                        opt.selected
                          ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500/20'
                          : 'bg-white border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          opt.selected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {opt.tier || 'Deluxe'}
                        </span>
                        {opt.selected && (
                          <span className="text-[10px] text-emerald-700 font-black flex items-center gap-1">
                            <Check size={11} /> Selected Choice
                          </span>
                        )}
                      </div>
                      <div className="font-black text-slate-900 text-xs">{opt.hotelName}</div>
                      <div className="text-[10px] text-slate-500">{opt.roomType} • {opt.mealPlan}</div>
                      {opt.amenities?.length > 0 && (
                        <div className="text-[9px] text-slate-400 truncate pt-0.5">
                          {opt.amenities.slice(0, 3).join(' • ')}
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200/50 text-[10px]">
                        <span className="text-slate-400">{opt.rooms || 1} Room(s) × {opt.nights || 1} Night(s)</span>
                        <strong className="text-slate-900 font-mono">₹{(opt.totalPrice || 0).toLocaleString()}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TRANSPORT, EXPERIENCES & OPTIONAL EXTRAS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-4 mb-6 page-break-inside-avoid">
        {/* Dedicated Transport */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="text-xs font-black uppercase text-indigo-900 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
            <Car size={14} className="text-indigo-600" /> Dedicated Transportation
          </div>
          <div className="font-black text-slate-900 text-xs">{selectedTransport?.vehicle || 'Dedicated 4x4 SUV'}</div>
          <div className="text-[11px] text-slate-600 font-medium">
            Pickup/Drop: {selectedTransport?.pickup || 'Designated Point'} → {selectedTransport?.drop || 'Designated Point'}
          </div>
          <div className="text-[10px] text-slate-500">
            Capacity: {selectedTransport?.capacity || 6} Seater • Inclusions: {selectedTransport?.inclusions?.join(', ') || 'Fuel, Tolls, Driver Allowance'}
          </div>
        </div>

        {/* Selected Experiences & Add-ons */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="text-xs font-black uppercase text-emerald-900 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
            <Compass size={14} className="text-emerald-600" /> Selected Experiences & Extras
          </div>
          <div className="space-y-1 text-[11px]">
            {selectedActivities.map((act, i) => (
              <div key={i} className="flex justify-between text-slate-700">
                <span>✓ {act.name}</span>
                <strong className="font-mono text-slate-900">₹{(act.totalPrice || 0).toLocaleString()}</strong>
              </div>
            ))}
            {selectedAddOns.map((add, i) => (
              <div key={i} className="flex justify-between text-indigo-700">
                <span>+ {add.name} ({add.category || 'Add-on'})</span>
                <strong className="font-mono text-slate-900">₹{(add.totalPrice || 0).toLocaleString()}</strong>
              </div>
            ))}
            {selectedActivities.length === 0 && selectedAddOns.length === 0 && (
              <div className="text-[11px] text-slate-400 italic">Standard sightseeing included.</div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. INCLUSIONS & EXCLUSIONS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-xs page-break-inside-avoid">
        <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/70 space-y-2">
          <div className="font-black uppercase text-emerald-900 flex items-center gap-1.5 border-b border-emerald-200 pb-1">
            <CheckCircle2 size={13} className="text-emerald-600" /> Confirmed Inclusions
          </div>
          <ul className="space-y-1 text-slate-700 text-[10px]">
            {inclusions.map((inc, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span> {inc}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-rose-50/40 rounded-xl border border-rose-200/70 space-y-2">
          <div className="font-black uppercase text-rose-900 flex items-center gap-1.5 border-b border-rose-200 pb-1">
            <XCircle size={13} className="text-rose-600" /> Standard Exclusions
          </div>
          <ul className="space-y-1 text-slate-700 text-[10px]">
            {exclusions.map((exc, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-rose-500 font-bold">✗</span> {exc}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. COMMERCIAL PRICE BREAKDOWN & PAYMENT TERMS */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6 space-y-4 page-break-inside-avoid">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
            Commercial Investment Summary
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            100% Tax Compliant Tour Package
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Gross Package Subtotal</span>
            <span className="font-mono text-white font-bold">₹{(pricing.subtotal || 0).toLocaleString()}</span>
          </div>

          {(pricing.discountAmount || 0) > 0 && (
            <div className="flex justify-between text-emerald-400 font-bold">
              <span>Special Commercial Concession</span>
              <span className="font-mono">- ₹{pricing.discountAmount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-300">
            <span>Tour Operator GST ({pricing.gstPercent || 5}%)</span>
            <span className="font-mono text-white">+ ₹{(pricing.gstAmount || 0).toLocaleString()}</span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
            <div>
              <span className="block text-[10px] font-black uppercase text-emerald-400">Total Net Journey Investment</span>
              <span className="text-2xl font-black text-white font-mono">
                ₹{(pricing.finalTotal || 0).toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Per Person ({tripReq.totalTravelers || 2} Pax)</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                ₹{(pricing.perPersonPrice || 0).toLocaleString()} / traveler
              </span>
            </div>
          </div>

          {/* Age-based Pax breakdown if children/infants exist */}
          {hasChildrenOrInfants && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-300 font-mono">
              <div>
                Adult Rate (100%): <strong className="text-white">₹{(pricing.adultPrice || 0).toLocaleString()}</strong>
              </div>
              <div>
                Child Rate (70%): <strong className="text-white">₹{(pricing.childPrice || 0).toLocaleString()}</strong>
              </div>
              <div>
                Infant Rate (0%): <strong className="text-emerald-400">Complimentary</strong>
              </div>
            </div>
          )}
        </div>

        {/* 10% Advance Deposit Schedule */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
          <div>
            <div className="text-[10px] text-amber-400 uppercase font-black">10% Advance Booking Deposit</div>
            <div className="text-base font-black text-white font-mono">₹{(pricing.depositRequired || 0).toLocaleString()}</div>
            <span className="text-[9px] text-slate-400">Required to confirm room blocks & dedicated fleet</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">90% Balance Amount</div>
            <div className="text-sm font-bold text-slate-200 font-mono">₹{(pricing.balanceAmount || 0).toLocaleString()}</div>
            <span className="text-[9px] text-slate-400">Payable {payment.balanceDueDays || 6} days prior to departure</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. LEGAL TERMS & CANCELLATION POLICIES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-600 mb-6 page-break-inside-avoid">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <strong className="text-[10px] font-black uppercase text-slate-900 block">Terms & Conditions</strong>
          <ul className="space-y-0.5 list-disc pl-3">
            {terms.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <strong className="text-[10px] font-black uppercase text-slate-900 block">Cancellation Policy</strong>
          <ul className="space-y-0.5 list-disc pl-3">
            {cancellation.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 9. CONCIERGE FOOTER & CONTACT */}
      {/* ========================================================================= */}
      <div className="border-t-2 border-slate-900 pt-4 flex justify-between items-center text-xs page-break-inside-avoid">
        <div className="space-y-0.5">
          <div className="font-black text-slate-900 text-xs">WANDERLUXE EXPEDITIONS PVT. LTD.</div>
          <div className="text-[10px] text-slate-500">Corporate Tower B, Aerocity, New Delhi 110037 • CIN: U63040DL2026PTC301982</div>
          <div className="text-[10px] text-slate-500">Web: https://wanderluxe.in • Email: concierge@wanderluxe.in • +91 85420 36499</div>
        </div>
        <div className="text-right">
          <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-[8px] text-slate-400 font-mono ml-auto">
            <span>[ QR CODE ]</span>
            <span>VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
});

QuotationDocument.displayName = 'QuotationDocument';
export default QuotationDocument;
