import React from 'react';
import { Check, MapPin } from 'lucide-react';
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
  <div className="pdf-day-body"><div className="pdf-day-heading"><div><h3>{day.title}</h3><p>{[day.destination, day.date ? formatQuotationV2Date(day.date) : ''].filter(Boolean).join(' · ')}</p></div>{image && day.coverMedia?.url && <PdfImage src={day.coverMedia.url} alt={day.coverMedia.altText || day.title} className="pdf-day-image" />}</div>
    {day.description && <p className="pdf-copy">{day.description}</p>}
    {detailed && <div className="pdf-day-slots">{[['Morning', day.morning], ['Afternoon', day.afternoon], ['Evening', day.evening]].filter(([, value]) => value).map(([label, value]) => <div key={label}><b>{label}</b><span>{value}</span></div>)}</div>}
    <p className="pdf-inline-meta">{[
      day.mealsIncluded.length ? `Meals: ${day.mealsIncluded.join(', ')}` : '', day.stay ? `Stay: ${day.stay}` : '', day.transferDetails ? `Transfer: ${day.transferDetails}` : ''
    ].filter(Boolean).join('  ·  ')}</p>
    {!compact && day.activityHighlights.length > 0 && <p className="pdf-highlights">Highlights: {day.activityHighlights.join(' · ')}</p>}
  </div>
</article>;

export const HotelCard = ({ hotel, detailed = false }) => <article className={`pdf-hotel-card ${hotel.selected ? 'is-selected' : ''}`}>
  {hotel.imageUrl && <PdfImage src={hotel.imageUrl} alt={hotel.hotelName} className="pdf-hotel-image" />}
  <div className="pdf-hotel-body"><div className="pdf-card-kicker">{hotel.selected ? 'Recommended' : hotel.recommendationType || hotel.label || 'Alternative'}</div><h3>{hotel.hotelName}</h3><p>{[hotel.city, hotel.category, hotel.roomType].filter(Boolean).join(' · ')}</p><div className="pdf-card-meta">{hotel.nights > 0 && <span>{hotel.nights} nights</span>}{hotel.rooms > 0 && <span>{hotel.rooms} rooms</span>}{hotel.mealPlan && <span>{hotel.mealPlan}</span>}{hotel.occupancy && <span>{hotel.occupancy}</span>}</div>{detailed && hotel.amenities.length > 0 && <p className="pdf-tags">{hotel.amenities.join(' · ')}</p>}{detailed && hotel.notes && <p className="pdf-copy">{hotel.notes}</p>}</div>
</article>;

export const TransportCard = ({ item }) => <article className="pdf-transport-card"><div className="pdf-card-kicker">{item.mode || 'Transport'}</div><h3>{item.title}</h3><p className="pdf-route">{[item.pickup, item.drop].filter(Boolean).join(' → ') || 'Route to be confirmed'}</p><div className="pdf-card-meta">{[item.vehicle, item.reference, item.cabinClass, item.seatDetails, item.baggage].filter(Boolean).map((value) => <span key={value}>{value}</span>)}</div>{item.notes && <p className="pdf-copy">{item.notes}</p>}</article>;

export const ApprovalBlock = ({ model }) => {
  if (model.meta.isApproved && model.approval) return <div className="pdf-approval is-approved"><span>APPROVED</span><strong>{model.approval.method === 'ADMIN_OVERRIDE' ? 'Approved by Administrator' : `Approved by ${model.approval.approvedByName || model.customer.name}`}</strong><small>{formatQuotationV2Date(model.approval.approvedAt)} · Version {model.meta.version}</small></div>;
  return <div className="pdf-approval"><span>AWAITING CUSTOMER CONFIRMATION</span><p>This proposal can be reviewed and approved securely through the private WanderLuxe quotation link.</p></div>;
};
