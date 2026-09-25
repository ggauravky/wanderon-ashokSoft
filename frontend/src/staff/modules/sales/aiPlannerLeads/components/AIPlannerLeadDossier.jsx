import React from 'react';
import { AlertTriangle, BedDouble, CalendarDays, CheckCircle2, CircleUserRound, IndianRupee, MapPin, PackageCheck, Route, Sparkles, Utensils, Users } from 'lucide-react';
import { formatDate, formatDateTime, formatMoney } from '../../salesUtils.js';

const Info = ({ label, value }) => <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 text-sm leading-6 text-slate-800">{value || 'Not provided'}</dd></div>;
const Section = ({ title, icon: Icon, children, description }) => <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon size={18} aria-hidden="true" /></span><div><h2 className="font-semibold text-slate-950">{title}</h2>{description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}</div></div><div className="mt-4">{children}</div></section>;
const Chips = ({ values, empty = 'Not provided' }) => values?.filter(Boolean)?.length ? <div className="flex flex-wrap gap-2">{values.filter(Boolean).map((value, index) => <span key={`${value}-${index}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">{value}</span>)}</div> : <p className="text-sm text-slate-500">{empty}</p>;

const activityText = (activity) => typeof activity === 'string' ? activity : [activity?.time, activity?.activity, activity?.location].filter(Boolean).join(' · ');
const mediaUrl = (media) => typeof media === 'string' ? media : media?.url;
const ActivityList = ({ title, activities }) => <div><h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>{activities?.length ? <ul className="mt-2 space-y-2">{activities.map((activity, index) => <li key={`${title}-${index}`} className="rounded-lg bg-slate-50 p-3"><p className="text-sm font-medium text-slate-800">{activityText(activity)}</p>{activity?.description && <p className="mt-1 text-xs leading-5 text-slate-500">{activity.description}</p>}{activity?.estimatedCost && <p className="mt-1 text-[11px] font-semibold text-amber-700">AI estimate: {activity.estimatedCost}</p>}</li>)}</ul> : <p className="mt-2 text-sm text-slate-400">Not provided</p>}</div>;

const travelPeriod = (planner = {}) => planner.datesFlexible !== false
  ? `${planner.flexibleMonth || 'Flexible period'} · Flexible dates`
  : `${formatDate(planner.startDate, 'Not provided')}${planner.endDate ? ` – ${formatDate(planner.endDate)}` : ''}`;

const travelerBreakdown = (planner = {}, fallback = 0) => {
  const breakdown = planner.travelersBreakdown || {};
  const parts = [
    breakdown.adults ? `${breakdown.adults} Adults` : '',
    breakdown.children ? `${breakdown.children} Children` : '',
    breakdown.infants ? `${breakdown.infants} Infants` : '',
    breakdown.seniors ? `${breakdown.seniors} Seniors` : ''
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : `${fallback || 1} traveler${Number(fallback || 1) === 1 ? '' : 's'}`;
};

const AIPlannerLeadDossier = ({ dossier }) => {
  const lead = dossier?.lead || {};
  const itinerary = dossier?.itinerary;
  const planner = itinerary?.plannerContext || {};
  if (!itinerary) return <section className="rounded-xl border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><AlertTriangle size={20} className="shrink-0 text-amber-700" aria-hidden="true" /><div><h2 className="font-semibold text-amber-950">Source AI plan is unavailable</h2><p className="mt-1 text-sm text-amber-800">This Lead remains usable for CRM work and a manual quotation, but its original itinerary is {dossier?.sourcePlanState === 'MISSING' ? 'no longer available' : 'not linked'}.</p></div></div></section>;

  const budget = itinerary.budgetBreakdown || {};
  const checks = itinerary.healthReport?.checks || [];
  return <div className="space-y-4">
    {dossier?.summary?.planUpdatedAfterEnquiry && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">Source plan updated after enquiry · review version {itinerary.version || 1} before preparing the quotation.</div>}

    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Customer" icon={CircleUserRound}><dl className="grid gap-4 sm:grid-cols-2"><Info label="Name" value={lead.name} /><Info label="Phone" value={lead.phone} /><Info label="Email" value={lead.email} /><Info label="Preferred contact" value={[lead.preferredCallDate ? formatDate(lead.preferredCallDate) : '', lead.preferredCallWindow].filter(Boolean).join(' · ')} /><Info label="Traveler message" value={lead.message} /><Info label="CRM status" value={lead.status?.replaceAll('_', ' ')} /></dl></Section>
      <Section title="Trip summary" icon={Route}><dl className="grid gap-4 sm:grid-cols-2"><Info label="Destination" value={itinerary.destination} /><Info label="Origin" value={planner.origin} /><Info label="Duration" value={`${itinerary.duration || itinerary.days?.length || '—'} days`} /><Info label="Travel period" value={travelPeriod(planner)} /><Info label="Travelers" value={travelerBreakdown(planner, itinerary.travelers)} /><Info label="Trip type" value={planner.tripType || itinerary.travelStyle} /><Info label="Pace" value={planner.paceRhythm || itinerary.pace} /><Info label="AI planning budget" value={planner.budgetAmount ? `${formatMoney(planner.budgetAmount)}/person` : itinerary.budgetLevel} /><Info label="Season context" value={itinerary.seasonContext || itinerary.bestTimeToVisit} /><Info label="Weather context" value={[itinerary.weather?.condition, itinerary.weather?.temp, itinerary.weather?.seasonTag].filter(Boolean).join(' · ')} /></dl></Section>
    </div>

    <Section title="Traveler preferences" icon={Sparkles}><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"><div><p className="mb-2 text-xs font-semibold text-slate-500">Interests</p><Chips values={planner.interests} /></div><Info label="Stay preference" value={planner.stayPreference} /><Info label="Room style" value={planner.roomStyle} /><Info label="Hotel rating preference" value={planner.hotelRating ? `${planner.hotelRating} star` : ''} /><Info label="Diet" value={planner.dietaryPreference} /><Info label="Budget tier" value={planner.budgetTier || itinerary.budgetLevel} /><Info label="Acclimatization" value={planner.acclimatization} /><Info label="Transport" value={planner.transportPreference} /><div><p className="mb-2 text-xs font-semibold text-slate-500">Mobility constraints</p><Chips values={planner.mobilityConstraints} /></div><div><p className="mb-2 text-xs font-semibold text-slate-500">Must include</p><Chips values={planner.mustInclude} /></div><div><p className="mb-2 text-xs font-semibold text-slate-500">Avoid</p><Chips values={planner.avoid} /></div><Info label="Custom preferences" value={planner.customPreferences} /></div></Section>

    <Section title="Complete AI itinerary" icon={CalendarDays} description="Planning content only. Activity and daily cost figures are AI estimates, not confirmed commercial rates."><ol className="space-y-4">{(itinerary.days || []).map((day, index) => {
      const gallery = (Array.isArray(day.galleryMedia) ? day.galleryMedia : Array.isArray(day.gallery) ? day.gallery : []).filter((item) => mediaUrl(item));
      return <li key={`${day.day || index}-${day.title}`} className="overflow-hidden rounded-xl border border-slate-200"><div className="grid md:grid-cols-[14rem_1fr]">{day.coverMedia?.url ? <img src={day.coverMedia.url} alt={day.coverMedia.altText || day.title || `Day ${day.day}`} className="h-44 w-full object-cover md:h-full" loading="lazy" /> : <div className="flex min-h-36 items-center justify-center bg-slate-100 text-slate-400"><MapPin size={24} aria-hidden="true" /></div>}<div className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Day {day.day || index + 1}</p><h3 className="mt-1 text-lg font-semibold text-slate-950">{day.title || day.locationName}</h3><p className="mt-1 text-sm text-slate-500">{day.locationName || 'Location not provided'}</p>{gallery.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{gallery.slice(0, 8).map((media, mediaIndex) => <img key={`${mediaUrl(media)}-${mediaIndex}`} src={mediaUrl(media)} alt={media?.altText || `${day.title || day.locationName} planning reference ${mediaIndex + 1}`} className="aspect-video w-full rounded-md object-cover" loading="lazy" />)}</div>}<div className="mt-4 grid gap-4 lg:grid-cols-3"><ActivityList title="Morning" activities={day.morning} /><ActivityList title="Afternoon" activities={day.afternoon} /><ActivityList title="Evening" activities={day.evening} /></div><div className="mt-4 grid gap-3 border-t border-slate-100 pt-3 text-sm sm:grid-cols-2"><p><strong>AI stay suggestion:</strong> {day.stay || 'Not provided'}</p><p><strong>Daily AI estimate:</strong> {day.dailyCost || 'Not provided'}</p></div>{day.tips?.length > 0 && <div className="mt-3"><Chips values={day.tips} /></div>}</div></div></li>;
    })}</ol></Section>

    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="AI Stay Suggestions" icon={BedDouble} description="Planning suggestions, not confirmed Hotels."><Chips values={itinerary.staySuggestions} empty="No stay suggestions recorded." /></Section>
      <Section title="Food suggestions" icon={Utensils} description="Planning context; these are not included meals."><Chips values={itinerary.foodSuggestions} empty="No food suggestions recorded." /></Section>
      <Section title="Packing recommendations" icon={PackageCheck}><Chips values={itinerary.packingList} empty="No packing recommendations recorded." /></Section>
      <Section title="Local planning tips" icon={MapPin}><Chips values={itinerary.localTips} empty="No local tips recorded." /></Section>
    </div>

    <Section title="AI Planning Estimate" icon={IndianRupee} description="Planning reference only — commercial quotation pricing is prepared separately."><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Info label="Stay" value={budget.stay} /><Info label="Transport" value={budget.transport} /><Info label="Food" value={budget.food} /><Info label="Activities" value={budget.activities} /><Info label="Estimated total" value={budget.estimatedTotal || formatMoney(itinerary.totalEstimatedCost)} /></dl></Section>

    <Section title="Planning checks" icon={CheckCircle2} description="Factual checks produced by the existing feasibility engine; they are not medical conclusions.">{checks.length ? <ul className="space-y-2">{checks.map((check, index) => <li key={check.id || `${check.code}-${index}`} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"><span className={check.status === 'pass' ? 'text-emerald-600' : 'text-amber-600'}>{check.status === 'pass' ? '✓' : '⚠'}</span><div><p className="text-sm font-semibold text-slate-800">{check.name || check.code || 'Planning check'}</p><p className="mt-1 text-xs leading-5 text-slate-500">{check.message || 'No additional detail.'}</p></div></li>)}</ul> : <p className="text-sm text-slate-500">Planning checks were not stored for this legacy itinerary.</p>}{itinerary.healthReport?.modificationsApplied?.length > 0 && <div className="mt-4 border-t border-slate-100 pt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Plan safeguards applied</p><Chips values={itinerary.healthReport.modificationsApplied} /></div>}</Section>

    {itinerary.matchedTrip?.title && <Section title="Related WanderLuxe Trip" icon={Users}><dl className="grid gap-4 sm:grid-cols-3"><Info label="Trip" value={itinerary.matchedTrip.title} /><Info label="Duration" value={itinerary.matchedTrip.duration} /><Info label="Catalog price reference" value={formatMoney(itinerary.matchedTrip.price)} /></dl></Section>}

    <p className="text-xs text-slate-400">Generated {formatDateTime(itinerary.generatedAt || itinerary.createdAt)} · Source version {itinerary.version || 1} · {itinerary.lifecycleStatus || 'GENERATED'}</p>
  </div>;
};

export default AIPlannerLeadDossier;
