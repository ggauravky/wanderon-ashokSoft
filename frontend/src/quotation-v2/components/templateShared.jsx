import React from 'react';
import { BusFront, CarFront, Check, MapPin, Plane, Route, TrainFront } from 'lucide-react';
import { formatQuotationCurrency, formatQuotationV2Date } from '../quotationV2.js';
import PdfImage from './PdfImage.jsx';

export const Money = ({ value, currency }) => <>{value > 0 ? formatQuotationCurrency(value, currency) : 'Price pending'}</>;
export const DateValue = ({ value }) => <>{formatQuotationV2Date(value)}</>;

export const RouteFlow = ({ stops = [], compact = false }) => stops.length ? <div className={`pdf-route-flow ${compact ? 'is-compact' : ''}`}>{stops.map((stop, index) => <React.Fragment key={`${stop}-${index}`}><span><MapPin size={11} />{stop}</span>{index < stops.length - 1 && <b aria-hidden="true">→</b>}</React.Fragment>)}</div> : null;

export const Facts = ({ items, className = '' }) => <dl className={`pdf-facts ${className}`}>{items.filter(([, value]) => value !== undefined && value !== null && value !== '').map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;

export const BulletList = ({ items = [], negative = false }) => items.length ? <ul className={`pdf-bullet-list ${negative ? 'is-negative' : ''}`}>{items.map((item, index) => <li key={`${item}-${index}`}>{negative ? <span aria-hidden="true">×</span> : <Check size={13} />}{item}</li>)}</ul> : null;

const policyTitle = (key) => key.replace(/Continued$/, ' Continued').replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
export const PolicyEntries = ({ entries = [], cardClass = '' }) => <>{entries.map(([key, value], index) => {
  const negative = key.startsWith('exclusions');
  const title = policyTitle(key);
  return <section className={cardClass || 'pdf-policy'} key={`${key}-${index}`}><h3>{title}</h3>{Array.isArray(value) ? <BulletList items={value} negative={negative} /> : <p>{value}</p>}</section>;
})}</>;

export const ItineraryDay = ({ day, detailed = false, image = true, compact = false }) => <article className={`pdf-itinerary-day ${detailed ? 'is-detailed' : ''} ${compact ? 'is-compact' : ''}`}>
  <div className="pdf-day-marker"><span>DAY</span><strong>{String(day.day).padStart(2, '0')}</strong></div>
  <div className="pdf-day-body"><div className="pdf-day-heading"><div><h3>{day.title}{day.continued ? ' · Continued' : ''}</h3><p>{[day.destination, day.date ? formatQuotationV2Date(day.date) : ''].filter(Boolean).join(' · ')}</p></div>{image && day.coverMedia?.url && <PdfImage src={day.coverMedia.url} alt={day.coverMedia.altText || day.title} className="pdf-day-image" />}</div>
    {day.description && <p className="pdf-copy">{day.description}</p>}
    {[day.morning, day.afternoon, day.evening].some(Boolean) && <div className="pdf-day-slots">{[['Morning', day.morning], ['Afternoon', day.afternoon], ['Evening', day.evening]].filter(([, value]) => value).map(([label, value]) => <div key={label}><b>{label}</b><span>{value}</span></div>)}</div>}
    <p className="pdf-inline-meta">{[
      day.mealsIncluded.length ? `Meals: ${day.mealsIncluded.join(', ')}` : '', day.stay ? `Stay: ${day.stay}` : '', day.transferDetails ? `Transfer: ${day.transferDetails}` : ''
    ].filter(Boolean).join('  ·  ')}</p>
    {day.activityHighlights.length > 0 && <p className="pdf-highlights">Highlights: {day.activityHighlights.join(' · ')}</p>}
  </div>
</article>;

export const HotelCard = ({ hotel, galleryLimit = 0 }) => <article className={`pdf-hotel-card ${hotel.selected ? 'is-selected' : ''}`} data-pdf-flow-item="hotel">
  {!hotel.continued && <PdfImage src={hotel.heroImage?.url} alt={hotel.heroImage?.altText || hotel.hotelName} className="pdf-hotel-image" fallbackLabel={`${hotel.hotelName} · Stay image unavailable`} priority />}
  <div className="pdf-hotel-body">{!hotel.continued && hotel.heroImage?.caption && <p className="pdf-image-caption">{hotel.heroImage.caption}</p>}<div className="pdf-card-kicker">{hotel.continued ? 'Stay details continued' : hotel.selected ? 'Recommended stay' : hotel.recommendationType || hotel.label || 'Stay option'}</div><h3>{hotel.hotelName}{hotel.continued ? ' · Continued' : ''}</h3>{!hotel.continued && <><p>{[hotel.city, hotel.category, hotel.roomType].filter(Boolean).join(' · ')}</p><div className="pdf-card-meta">{hotel.nights > 0 && <span>{hotel.nights} nights</span>}{hotel.rooms > 0 && <span>{hotel.rooms} rooms</span>}{hotel.mealPlan && <span>{hotel.mealPlan}</span>}{hotel.occupancy && <span>{hotel.occupancy}</span>}{hotel.checkIn && <span>Check-in {formatQuotationV2Date(hotel.checkIn)}</span>}{hotel.checkOut && <span>Check-out {formatQuotationV2Date(hotel.checkOut)}</span>}</div></>}{hotel.amenities.length > 0 && <p className="pdf-tags">{hotel.amenities.join(' · ')}</p>}{hotel.notes && <p className="pdf-copy">{hotel.notes}</p>}{hotel.documents.length > 0 && <p className="pdf-document-available">{hotel.documents.length} customer document{hotel.documents.length === 1 ? '' : 's'} in Travel Documents</p>}{galleryLimit > 0 && hotel.gallery.some((image) => image.url !== hotel.heroImage?.url) && <div className="pdf-hotel-gallery">{hotel.gallery.filter((image) => image.url !== hotel.heroImage?.url).slice(0, galleryLimit).map((image) => <figure key={image.url}><PdfImage src={image.url} alt={image.altText || hotel.hotelName} fallbackLabel="Stay image unavailable" />{image.caption && <figcaption>{image.caption}</figcaption>}</figure>)}</div>}</div>
</article>;

const modeIcon = (mode) => {
  if (mode === 'FLIGHT') return Plane;
  if (mode === 'TRAIN') return TrainFront;
  if (mode === 'BUS') return BusFront;
  if (['CAB', 'PRIVATE_CAR', 'SUV', 'TEMPO_TRAVELLER', 'COACH', 'SELF_DRIVE'].includes(mode)) return CarFront;
  return Route;
};

export const TransportCard = ({ item, showMedia = true }) => {
  const Icon = modeIcon(item.mode);
  const hero = item.media.find((media) => media.isPrimary) || item.media[0];
  return <article className="pdf-transport-card" data-pdf-flow-item="transport"><div className="pdf-transport-heading"><Icon size={19} aria-hidden="true" /><div><div className="pdf-card-kicker">{item.mode || 'Transport'}</div><h3>{item.title}</h3></div></div>{showMedia && hero && <><PdfImage src={hero.url} alt={hero.altText || item.title} className="pdf-transport-image" fallbackLabel="Vehicle image unavailable" />{hero.caption && <p className="pdf-image-caption">{hero.caption}</p>}</>}<p className="pdf-route">{[item.pickup, item.drop].filter(Boolean).join(' → ') || 'Route to be confirmed'}</p><div className="pdf-card-meta">{[item.vehicle, item.reference, item.cabinClass, item.seatDetails, item.baggage, item.schedule.departureDate ? formatQuotationV2Date(item.schedule.departureDate) : ''].filter(Boolean).map((value) => <span key={value}>{value}</span>)}</div>{item.notes && <p className="pdf-copy">{item.notes}</p>}{item.documents.length > 0 && <p className="pdf-document-available">{item.documents.length} ticket{item.documents.length === 1 ? '' : 's'} / voucher{item.documents.length === 1 ? '' : 's'} in Travel Documents</p>}</article>;
};

export const Experiences = ({ activities = [], addOns = [] }) => <div className="pdf-experience-list">{activities.map((item) => <article key={`a-${item.id}`} data-pdf-flow-item="experience"><span>DAY {item.dayNumber || '—'} · ACTIVITY</span><strong>{item.name}</strong>{item.location && <small>{item.location}</small>}{item.description && <p>{item.description}</p>}</article>)}{addOns.map((item) => <article key={`o-${item.id}`} data-pdf-flow-item="experience"><span>ADD-ON{item.category ? ` · ${item.category}` : ''}</span><strong>{item.name}</strong>{item.description && <p>{item.description}</p>}</article>)}</div>;

export const ApprovalBlock = ({ model }) => {
  if (model.meta.isApproved && model.approval) return <div className="pdf-approval is-approved"><span>APPROVED</span><strong>{model.approval.method === 'ADMIN_OVERRIDE' ? 'Approved by Administrator' : `Approved by ${model.approval.approvedByName || model.customer.name}`}</strong><small>{formatQuotationV2Date(model.approval.approvedAt)} · Version {model.meta.version}</small></div>;
  return <div className="pdf-approval"><span>AWAITING CUSTOMER CONFIRMATION</span><p>This proposal can be reviewed and approved securely through the private WanderLuxe quotation link.</p></div>;
};
