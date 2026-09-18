import React, { forwardRef } from 'react';
import { CalendarDays, Check, Clock3, Download, MapPin, Paperclip, Plane, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { formatQuotationCurrency, formatQuotationV2Date, getPublicPricing } from './quotationV2.js';

const themeMap = {
  minimal: { page: 'bg-white text-slate-900', accent: 'text-emerald-700', panel: 'border-slate-200 bg-white', hero: 'bg-slate-950 text-white' },
  journey: { page: 'bg-[#f7f4ed] text-[#18332b]', accent: 'text-[#b5663d]', panel: 'border-[#d8d0c2] bg-white/80', hero: 'bg-[#173e34] text-white' },
  signature_luxe: { page: 'bg-[#11100e] text-[#f4ede0]', accent: 'text-[#d5b273]', panel: 'border-[#3d3931] bg-[#191816]', hero: 'bg-[#11100e] text-[#f4ede0]' }
};

const Section = ({ title, eyebrow, children, theme }) => <section className={`rounded-2xl border p-6 md:p-8 ${theme.panel}`}><p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${theme.accent}`}>{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2><div className="mt-5">{children}</div></section>;
const Empty = ({ children }) => <p className="text-sm opacity-60">{children}</p>;

const QuotationTemplateRenderer = forwardRef(function QuotationTemplateRenderer({ quotation = {}, templateKey, isDraft = false, onAttachmentDownload, showDownloadHint = false }, ref) {
  const chosen = templateKey || quotation.templateKey || quotation.presentationSettings?.template || 'journey';
  const theme = themeMap[chosen] || themeMap.journey;
  const journey = quotation.tripRequirements || {};
  const customer = quotation.customerSnapshot || {};
  const pricing = getPublicPricing(quotation);
  const currency = pricing.currency || 'INR';
  const hotels = quotation.hotelOptions || [];
  const transports = quotation.transportOptions || [];
  const activities = quotation.activities || [];
  const attachments = quotation.attachments || [];
  const policies = quotation.policies || {};
  const showComponentPrices = quotation.presentationSettings?.showComponentPrices === true;
  const finalPrice = pricing.finalCustomerPrice || 0;
  return (
    <article ref={ref} className={`relative mx-auto min-h-screen w-full max-w-[1120px] overflow-hidden ${theme.page}`} data-template={chosen}>
      {isDraft && <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden"><span className="rotate-[-28deg] whitespace-nowrap text-7xl font-black uppercase tracking-[0.35em] opacity-[0.07]">Draft preview</span></div>}
      <header className={`relative overflow-hidden px-6 py-14 md:px-12 md:py-20 ${theme.hero}`}>
        {journey.coverImage && <img src={journey.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] opacity-80"><span>WanderLuxe</span><span>•</span><span>{quotation.quotationNumber || 'Private journey proposal'}</span><span>•</span><span>v{quotation.version || 1}</span></div>
          <h1 className={`mt-8 font-semibold leading-[0.98] ${chosen === 'signature_luxe' ? 'font-serif text-5xl md:text-7xl' : 'text-4xl md:text-6xl'}`}>{journey.title || 'Your journey, thoughtfully composed'}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 opacity-80">Prepared for {customer.name || 'our traveler'}{journey.destination ? ` · ${journey.destination}` : ''}</p>
          <div className="mt-9 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2"><CalendarDays size={15} />{formatQuotationV2Date(journey.startDate)} – {formatQuotationV2Date(journey.endDate)}</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2"><Clock3 size={15} />{journey.duration || `${journey.days || 0} days`}</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2"><UsersRound size={15} />{journey.totalTravelers || 1} traveler(s)</span>
          </div>
        </div>
      </header>
      <div className="space-y-6 px-4 py-6 md:px-10 md:py-10">
        {quotation.personalNote && <Section title="A note for your journey" eyebrow="Personally prepared" theme={theme}><p className="max-w-3xl whitespace-pre-line text-base leading-8 opacity-80">{quotation.personalNote}</p></Section>}

        <Section title="Journey at a glance" eyebrow="The essentials" theme={theme}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[['Destination', journey.destination, MapPin], ['Travel style', journey.travelStyle, Sparkles], ['Duration', journey.duration, Clock3], ['Travelers', journey.totalTravelers, UsersRound]].map(([label, value, Icon]) => <div key={label} className="rounded-xl border border-current/10 p-4"><Icon size={18} className={theme.accent} /><p className="mt-4 text-xs uppercase tracking-wider opacity-50">{label}</p><p className="mt-1 font-semibold">{value || 'To be confirmed'}</p></div>)}
          </div>
        </Section>

        <Section title="Day-by-day journey" eyebrow="Itinerary" theme={theme}>
          {quotation.itinerary?.length ? <ol className="space-y-5">{quotation.itinerary.map((day, index) => <li key={`${day.day}-${index}`} className="grid gap-4 border-b border-current/10 pb-5 last:border-0 md:grid-cols-[5rem_1fr]">
            <div><p className={`text-xs font-bold uppercase tracking-[0.16em] ${theme.accent}`}>Day {day.day || index + 1}</p>{day.coverMedia?.url && <img src={day.coverMedia.url} alt={day.coverMedia.altText || day.title || ''} className="mt-3 h-16 w-16 rounded-xl object-cover" />}</div>
            <div><h3 className="text-lg font-semibold">{day.title || `Day ${index + 1}`}</h3><p className="mt-1 text-sm opacity-55">{day.destination || day.locationName || day.stay}</p><p className="mt-3 whitespace-pre-line text-sm leading-7 opacity-75">{day.description || [day.morning, day.afternoon, day.evening].filter(Boolean).join(' · ') || 'Details to be confirmed.'}</p></div>
          </li>)}</ol> : <Empty>Itinerary details will be confirmed with your advisor.</Empty>}
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Stays" eyebrow="Hotels" theme={theme}>{hotels.length ? <div className="space-y-4">{hotels.map((hotel, index) => <article key={hotel.optionId || index} className="overflow-hidden rounded-xl border border-current/10">{hotel.imageUrl && <img src={hotel.imageUrl} alt={hotel.hotelName || ''} className="h-40 w-full object-cover" />}<div className="p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{hotel.hotelName || hotel.label || 'Selected stay'}</h3>{hotel.selected && <span className={`text-[10px] font-bold uppercase ${theme.accent}`}>Selected</span>}</div><p className="mt-1 text-sm opacity-60">{[hotel.city || hotel.location, hotel.roomType, hotel.mealPlan].filter(Boolean).join(' · ')}</p><div className="mt-2 flex items-end justify-between gap-3"><p className="text-xs opacity-50">{hotel.nights || 1} night(s) · {hotel.rooms || 1} room(s)</p>{showComponentPrices && hotel.totalPrice !== undefined && <p className="text-sm font-semibold">{formatQuotationCurrency(hotel.totalPrice, currency)}</p>}</div></div></article>)}</div> : <Empty>Stay details will be confirmed.</Empty>}</Section>
          <Section title="Getting around" eyebrow="Transportation" theme={theme}>{transports.length ? <div className="space-y-3">{transports.map((item, index) => <article key={item.optionId || index} className="rounded-xl border border-current/10 p-4"><Plane size={18} className={theme.accent} /><h3 className="mt-3 font-semibold">{item.title || item.vehicle || item.type || item.mode || 'Travel segment'}</h3><p className="mt-1 text-sm opacity-60">{item.pickup || item.route?.from || 'Origin'} → {item.drop || item.route?.to || 'Destination'}</p><div className="mt-2 flex items-end justify-between gap-3"><p className="text-xs opacity-50">{[item.schedule?.departureDate && formatQuotationV2Date(item.schedule.departureDate), item.cabinClass, item.seatDetails].filter(Boolean).join(' · ')}</p>{showComponentPrices && item.totalPrice !== undefined && <p className="text-sm font-semibold">{formatQuotationCurrency(item.totalPrice, currency)}</p>}</div></article>)}</div> : <Empty>Transportation details will be confirmed.</Empty>}</Section>
        </div>

        {activities.length > 0 && <Section title="Curated experiences" eyebrow="Activities" theme={theme}><div className="grid gap-3 md:grid-cols-2">{activities.map((item, index) => <article key={item.activityId || index} className="rounded-xl border border-current/10 p-4"><p className={`text-xs font-bold uppercase tracking-wider ${theme.accent}`}>Day {item.dayNumber || '—'}</p><h3 className="mt-2 font-semibold">{item.name}</h3><p className="mt-2 text-sm leading-6 opacity-65">{item.description || item.location}</p></article>)}</div></Section>}

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="What’s included" eyebrow="Inclusions" theme={theme}>{quotation.inclusions?.length ? <ul className="space-y-2">{quotation.inclusions.map((item, index) => <li key={index} className="flex gap-3 text-sm leading-6"><Check size={16} className={`mt-1 shrink-0 ${theme.accent}`} />{item}</li>)}</ul> : <Empty>No inclusions recorded.</Empty>}</Section>
          <Section title="Not included" eyebrow="Exclusions" theme={theme}>{quotation.exclusions?.length ? <ul className="space-y-2">{quotation.exclusions.map((item, index) => <li key={index} className="flex gap-3 text-sm leading-6"><span className="mt-1 opacity-50">—</span>{item}</li>)}</ul> : <Empty>No exclusions recorded.</Empty>}</Section>
        </div>

        <section className={`rounded-2xl border p-6 md:p-9 ${chosen === 'signature_luxe' ? 'border-[#d5b273]/40 bg-[#201d17]' : 'border-emerald-700/20 bg-emerald-950 text-white'}`}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">Your journey investment</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-4xl font-semibold tracking-tight">{finalPrice > 0 ? formatQuotationCurrency(finalPrice, currency) : 'Price pending'}</p><p className="mt-2 text-sm opacity-65">Final customer price for the proposal as presented.</p></div>{pricing.depositAmount > 0 && <div className="sm:text-right"><p className="text-xs uppercase tracking-wider opacity-60">Deposit</p><p className="mt-1 text-xl font-semibold">{formatQuotationCurrency(pricing.depositAmount, currency)}</p></div>}</div>
          {pricing.paymentSchedule?.length > 0 && <div className="mt-7 grid gap-3 md:grid-cols-3">{pricing.paymentSchedule.map((item, index) => <div key={index} className="rounded-xl border border-white/15 bg-white/5 p-4"><p className="text-xs opacity-60">{item.label}</p><p className="mt-1 font-semibold">{formatQuotationCurrency(item.amount, currency)}</p><p className="mt-1 text-xs opacity-50">{formatQuotationV2Date(item.dueDate)}</p></div>)}</div>}
        </section>

        {attachments.length > 0 && <Section title="Travel documents" eyebrow="Attachments" theme={theme}><div className="grid gap-3 md:grid-cols-2">{attachments.map((item) => <a key={item.id} href={item.secureUrl} target="_blank" rel="noreferrer" onClick={() => onAttachmentDownload?.(item)} className="flex items-center justify-between gap-3 rounded-xl border border-current/10 p-4 transition hover:bg-current/5"><span className="flex min-w-0 items-center gap-3"><Paperclip size={17} className={theme.accent} /><span className="truncate text-sm font-medium">{item.title || item.fileName}</span></span><Download size={16} /></a>)}</div></Section>}

        <Section title="Important information" eyebrow="Terms & policies" theme={theme}><div className="grid gap-6 md:grid-cols-2">{Object.entries(policies).filter(([, value]) => value).map(([key, value]) => <div key={key}><h3 className="text-sm font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 opacity-65">{value}</p></div>)}{quotation.termsAndConditions?.length > 0 && <div><h3 className="text-sm font-semibold">Terms and conditions</h3><ul className="mt-2 space-y-2 text-sm leading-6 opacity-65">{quotation.termsAndConditions.map((item, index) => <li key={index}>• {item}</li>)}</ul></div>}</div></Section>

        <footer className="flex flex-col gap-4 border-t border-current/10 px-1 py-8 text-sm opacity-60 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><ShieldCheck size={17} />WanderLuxe · Crafted travel, clearly presented</div><div>{quotation.advisor?.name && `Your advisor: ${quotation.advisor.name}`}{showDownloadHint && ' · Download a copy for your records'}</div></footer>
      </div>
    </article>
  );
});

export default QuotationTemplateRenderer;
