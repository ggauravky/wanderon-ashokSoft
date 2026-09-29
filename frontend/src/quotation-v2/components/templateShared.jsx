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

export const ItineraryDay = ({ day, detailed = false, image = true, compact = false, mode = 'BALANCED' }) => {
  const isSummary = mode === 'SUMMARY' || compact;
  const isDetailed = mode === 'FULL' || detailed;

  return (
    <article className={`pdf-itinerary-day ${isDetailed ? 'is-detailed' : ''} ${isSummary ? 'is-compact' : ''}`}>
      <div className="pdf-day-marker">
        <span>DAY</span>
        <strong>{String(day.day).padStart(2, '0')}</strong>
      </div>
      <div className="pdf-day-body">
        <div className="pdf-day-heading">
          <div>
            <h3>{day.title}{day.continued ? ' · Continued' : ''}</h3>
            <p>{[day.destination, day.date ? formatQuotationV2Date(day.date) : ''].filter(Boolean).join(' · ')}</p>
          </div>
          {image && !isSummary && day.coverMedia?.url && (
            <PdfImage src={day.coverMedia.url} alt={day.coverMedia.altText || day.title} className="pdf-day-image" />
          )}
        </div>
        {day.description && <p className="pdf-copy">{day.description}</p>}
        {!isSummary && [day.morning, day.afternoon, day.evening].some(Boolean) && (
          <div className="pdf-day-slots">
            {[['Morning', day.morning], ['Afternoon', day.afternoon], ['Evening', day.evening]]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <b>{label}</b>
                  <span>{value}</span>
                </div>
              ))}
          </div>
        )}
        <p className="pdf-inline-meta">
          {[
            day.mealsIncluded?.length ? `Meals: ${day.mealsIncluded.join(', ')}` : '',
            day.stay ? `Stay: ${day.stay}` : '',
            day.transferDetails ? `Transfer: ${day.transferDetails}` : ''
          ].filter(Boolean).join('  ·  ')}
        </p>
        {!isSummary && day.activityHighlights?.length > 0 && (
          <p className="pdf-highlights">Highlights: {day.activityHighlights.join(' · ')}</p>
        )}
      </div>
    </article>
  );
};

export const ItineraryMatrix = ({ days = [] }) => (
  <table className="pdf-matrix-table pdf-payment-table" data-pdf-matrix="itinerary">
    <thead>
      <tr>
        <th style={{ width: '48px' }}>Day</th>
        <th style={{ width: '150px' }}>Route & Destination</th>
        <th>Main Plan & Highlights</th>
        <th style={{ width: '140px' }}>Stay & Meals</th>
      </tr>
    </thead>
    <tbody>
      {days.map((day) => (
        <tr key={`day-${day.day}`}>
          <td><strong>{String(day.day).padStart(2, '0')}</strong></td>
          <td>
            <strong>{day.title}</strong>
            {day.destination && <div style={{ opacity: 0.7, marginTop: 2 }}>{day.destination}</div>}
            {day.transferDetails && <div style={{ opacity: 0.6, fontSize: '7.5px', marginTop: 2 }}>{day.transferDetails}</div>}
          </td>
          <td>
            {day.description || day.summaryText || 'Sightseeing and planned experiences.'}
            {day.activityHighlights?.length > 0 && (
              <div style={{ marginTop: 3, opacity: 0.75, fontSize: '8px' }}>
                Highlights: {day.activityHighlights.join(' · ')}
              </div>
            )}
          </td>
          <td>
            <div>{day.stay || '—'}</div>
            {day.mealsIncluded?.length > 0 && (
              <div style={{ opacity: 0.65, fontSize: '7.5px', marginTop: 2 }}>
                Meals: {day.mealsIncluded.join(', ')}
              </div>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const HotelCard = ({ hotel, detailed = false, galleryLimit = 0, mode = 'BALANCED' }) => {
  const isFull = mode === 'FULL' || detailed;
  const isMatrix = mode === 'MATRIX';
  const showHero = !hotel.continued && !isMatrix && Boolean(hotel.heroImage?.url);

  return (
    <article className={`pdf-hotel-card ${hotel.selected ? 'is-selected' : ''} ${isMatrix ? 'is-compact' : ''}`} data-pdf-flow-item="hotel">
      {showHero && (
        <PdfImage
          src={hotel.heroImage?.url}
          alt={hotel.heroImage?.altText || hotel.hotelName}
          className="pdf-hotel-image"
          fallbackLabel={`${hotel.hotelName} · Stay image unavailable`}
          priority
        />
      )}
      <div className="pdf-hotel-body">
        {showHero && hotel.heroImage?.caption && (
          <p className="pdf-image-caption">{hotel.heroImage.caption}</p>
        )}
        <div className="pdf-card-kicker">
          {hotel.continued ? 'Stay details continued' : hotel.selected ? 'Recommended stay' : hotel.recommendationType || hotel.label || 'Stay option'}
        </div>
        <h3>{hotel.hotelName}{hotel.continued ? ' · Continued' : ''}</h3>
        {!hotel.continued && (
          <>
            <p>{[hotel.city, hotel.category, hotel.roomType].filter(Boolean).join(' · ')}</p>
            <div className="pdf-card-meta">
              {hotel.nights > 0 && <span>{hotel.nights} nights</span>}
              {hotel.rooms > 0 && <span>{hotel.rooms} rooms</span>}
              {hotel.mealPlan && <span>{hotel.mealPlan}</span>}
              {hotel.occupancy && <span>{hotel.occupancy}</span>}
              {hotel.checkIn && <span>Check-in {formatQuotationV2Date(hotel.checkIn)}</span>}
              {hotel.checkOut && <span>Check-out {formatQuotationV2Date(hotel.checkOut)}</span>}
            </div>
          </>
        )}
        {hotel.amenities?.length > 0 && <p className="pdf-tags">{hotel.amenities.join(' · ')}</p>}
        {hotel.notes && <p className="pdf-copy">{hotel.notes}</p>}
        {hotel.documents?.length > 0 && (
          <p className="pdf-document-available">{hotel.documents.length} customer document{hotel.documents.length === 1 ? '' : 's'} in Travel Documents</p>
        )}
        {isFull && galleryLimit > 0 && hotel.gallery?.some((image) => image.url !== hotel.heroImage?.url) && (
          <div className="pdf-hotel-gallery">
            {hotel.gallery
              .filter((image) => image.url !== hotel.heroImage?.url)
              .slice(0, galleryLimit)
              .map((image) => (
                <figure key={image.url}>
                  <PdfImage src={image.url} alt={image.altText || hotel.hotelName} fallbackLabel="Stay image unavailable" />
                  {image.caption && <figcaption>{image.caption}</figcaption>}
                </figure>
              ))}
          </div>
        )}
      </div>
    </article>
  );
};

export const HotelMatrix = ({ hotels = [] }) => (
  <table className="pdf-matrix-table pdf-payment-table" data-pdf-matrix="hotels">
    <thead>
      <tr>
        <th style={{ width: '100px' }}>City</th>
        <th>Property & Tier</th>
        <th>Room & Meal Plan</th>
        <th style={{ width: '130px' }}>Nights & Dates</th>
      </tr>
    </thead>
    <tbody>
      {hotels.map((hotel) => (
        <tr key={hotel.id || hotel.optionId}>
          <td><strong>{hotel.city || '—'}</strong></td>
          <td>
            <strong>{hotel.hotelName}</strong>
            {hotel.category && <div style={{ opacity: 0.7, marginTop: 2 }}>{hotel.category}</div>}
            {hotel.amenities?.length > 0 && (
              <div style={{ opacity: 0.6, fontSize: '7.5px', marginTop: 2 }}>
                {hotel.amenities.slice(0, 4).join(' · ')}
              </div>
            )}
          </td>
          <td>
            <div>{hotel.roomType || 'Standard'}</div>
            {hotel.mealPlan && <div style={{ opacity: 0.75, marginTop: 2 }}>{hotel.mealPlan}</div>}
            {hotel.occupancy && <div style={{ opacity: 0.6, fontSize: '7.5px' }}>{hotel.occupancy}</div>}
          </td>
          <td>
            <strong>{hotel.nights || 1} night{hotel.nights === 1 ? '' : 's'}</strong>
            {hotel.checkIn && (
              <div style={{ opacity: 0.65, fontSize: '7.5px', marginTop: 2 }}>
                In: {formatQuotationV2Date(hotel.checkIn)}
              </div>
            )}
            {hotel.checkOut && (
              <div style={{ opacity: 0.65, fontSize: '7.5px' }}>
                Out: {formatQuotationV2Date(hotel.checkOut)}
              </div>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const modeIcon = (mode) => {
  if (mode === 'FLIGHT') return Plane;
  if (mode === 'TRAIN') return TrainFront;
  if (mode === 'BUS') return BusFront;
  if (['CAB', 'PRIVATE_CAR', 'SUV', 'TEMPO_TRAVELLER', 'COACH', 'SELF_DRIVE'].includes(mode)) return CarFront;
  return Route;
};

export const TransportCard = ({ item, showMedia = true, mediaLimit = 1 }) => {
  const Icon = modeIcon(item.mode);
  const hero = (item.media || []).find((media) => media.isPrimary) || (item.media || [])[0];
  const media = hero ? [hero, ...(item.media || []).filter((entry) => entry.url !== hero.url)].slice(0, Math.max(1, mediaLimit)) : [];

  return (
    <article className="pdf-transport-card" data-pdf-flow-item="transport">
      <div className="pdf-transport-heading">
        <Icon size={19} aria-hidden="true" />
        <div>
          <div className="pdf-card-kicker">{item.mode || 'Transport'}</div>
          <h3>{item.title}</h3>
        </div>
      </div>
      {showMedia && media.length > 0 && (
        <>
          <div className={`pdf-transport-media ${media.length > 1 ? 'has-secondary' : ''}`}>
            {media.map((entry) => (
              <PdfImage
                key={entry.url}
                src={entry.url}
                alt={entry.altText || item.title}
                className="pdf-transport-image"
                fallbackLabel="Vehicle image unavailable"
              />
            ))}
          </div>
          {hero?.caption && <p className="pdf-image-caption">{hero.caption}</p>}
        </>
      )}
      <p className="pdf-route">{[item.pickup, item.drop].filter(Boolean).join(' → ') || 'Route to be confirmed'}</p>
      <div className="pdf-card-meta">
        {[item.vehicle, item.reference, item.cabinClass, item.seatDetails, item.baggage, item.schedule?.departureDate ? formatQuotationV2Date(item.schedule.departureDate) : '']
          .filter(Boolean)
          .map((value) => <span key={value}>{value}</span>)}
      </div>
      {item.notes && <p className="pdf-copy">{item.notes}</p>}
      {item.documents?.length > 0 && (
        <p className="pdf-document-available">{item.documents.length} ticket{item.documents.length === 1 ? '' : 's'} / voucher{item.documents.length === 1 ? '' : 's'} in Travel Documents</p>
      )}
    </article>
  );
};

export const TransportMatrix = ({ transport = [] }) => (
  <table className="pdf-matrix-table pdf-payment-table" data-pdf-matrix="transport">
    <thead>
      <tr>
        <th style={{ width: '80px' }}>Mode</th>
        <th>Route & Segment</th>
        <th>Date & Schedule</th>
        <th style={{ width: '150px' }}>Vehicle & Reference</th>
      </tr>
    </thead>
    <tbody>
      {transport.map((item) => (
        <tr key={item.id || item.optionId}>
          <td><strong>{item.mode || 'TRANSIT'}</strong></td>
          <td>
            <strong>{item.title}</strong>
            <div style={{ opacity: 0.8, marginTop: 2 }}>
              {[item.pickup, item.drop].filter(Boolean).join(' → ') || 'Route TBD'}
            </div>
          </td>
          <td>
            {item.schedule?.departureDate && (
              <div>{formatQuotationV2Date(item.schedule.departureDate)} {item.schedule.departureTime || ''}</div>
            )}
            {item.schedule?.arrivalDate && (
              <div style={{ opacity: 0.65, fontSize: '7.5px' }}>
                Arr: {formatQuotationV2Date(item.schedule.arrivalDate)} {item.schedule.arrivalTime || ''}
              </div>
            )}
          </td>
          <td>
            <div>{item.vehicle || 'Standard'}</div>
            {item.reference && <div style={{ opacity: 0.7, fontSize: '7.5px', marginTop: 2 }}>Ref: {item.reference}</div>}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const Experiences = ({ activities = [], addOns = [], mode = 'DETAILED' }) => {
  if (mode === 'GROUPED') {
    return (
      <div className="pdf-experience-grouped" data-pdf-flow-item="experience-grouped">
        {activities.length > 0 && (
          <div className="pdf-card-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {activities.map((item) => (
              <article key={`a-${item.id}`} style={{ padding: '10px', border: '1px solid rgba(100,116,139,.2)', borderRadius: '8px', background: 'rgba(100,116,139,.02)' }}>
                <span style={{ fontSize: '8px', letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.6 }}>
                  DAY {item.dayNumber || '—'} · ACTIVITY
                </span>
                <h4 style={{ margin: '4px 0 2px', fontSize: '12px' }}>{item.name}</h4>
                {item.location && <p style={{ margin: 0, fontSize: '8.5px', opacity: 0.7 }}>{item.location}</p>}
                {item.description && <p style={{ margin: '4px 0 0', fontSize: '9px', lineHeight: 1.4, opacity: 0.8 }}>{item.description}</p>}
              </article>
            ))}
          </div>
        )}
        {addOns.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <h4 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', opacity: 0.6, margin: '0 0 8px' }}>Selected Add-ons</h4>
            <div className="pdf-card-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {addOns.map((item) => (
                <article key={`o-${item.id}`} style={{ padding: '10px', border: '1px solid rgba(100,116,139,.2)', borderRadius: '8px', background: 'rgba(100,116,139,.02)' }}>
                  <span style={{ fontSize: '8px', letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.6 }}>ADD-ON{item.category ? ` · ${item.category}` : ''}</span>
                  <h4 style={{ margin: '4px 0 2px', fontSize: '12px' }}>{item.name}</h4>
                  {item.description && <p style={{ margin: '4px 0 0', fontSize: '9px', lineHeight: 1.4, opacity: 0.8 }}>{item.description}</p>}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pdf-experience-list">
      {activities.map((item) => (
        <article key={`a-${item.id}`} data-pdf-flow-item="experience">
          <span>DAY {item.dayNumber || '—'} · ACTIVITY</span>
          <strong>{item.name}</strong>
          {item.location && <small>{item.location}</small>}
          {item.description && <p>{item.description}</p>}
        </article>
      ))}
      {addOns.map((item) => (
        <article key={`o-${item.id}`} data-pdf-flow-item="experience">
          <span>ADD-ON{item.category ? ` · ${item.category}` : ''}</span>
          <strong>{item.name}</strong>
          {item.description && <p>{item.description}</p>}
        </article>
      ))}
    </div>
  );
};

export const ExperiencesMatrix = ({ activities = [], addOns = [] }) => (
  <table className="pdf-matrix-table pdf-payment-table" data-pdf-matrix="experiences">
    <thead>
      <tr>
        <th style={{ width: '70px' }}>Day / Type</th>
        <th>Experience / Add-on</th>
        <th style={{ width: '130px' }}>Location / Scope</th>
        <th style={{ width: '100px' }}>Status</th>
      </tr>
    </thead>
    <tbody>
      {activities.map((item) => (
        <tr key={`act-${item.id}`}>
          <td><strong>{item.dayNumber ? `Day ${item.dayNumber}` : 'Activity'}</strong></td>
          <td>
            <strong>{item.name}</strong>
            {item.description && <div style={{ opacity: 0.7, fontSize: '8px', marginTop: 2 }}>{item.description}</div>}
          </td>
          <td>{item.location || 'Included route'}</td>
          <td>{item.isIncluded ? 'Included' : item.isOptional ? 'Optional' : 'Confirmed'}</td>
        </tr>
      ))}
      {addOns.map((item) => (
        <tr key={`add-${item.id}`}>
          <td><strong>Add-on</strong></td>
          <td>
            <strong>{item.name}</strong>
            {item.description && <div style={{ opacity: 0.7, fontSize: '8px', marginTop: 2 }}>{item.description}</div>}
          </td>
          <td>{item.category || 'Package upgrade'}</td>
          <td>Selected</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const ApprovalBlock = ({ model }) => {
  if (model.meta?.isApproved && model.approval) {
    return (
      <div className="pdf-approval is-approved">
        <span>APPROVED</span>
        <strong>{model.approval.method === 'ADMIN_OVERRIDE' ? 'Approved by Administrator' : `Approved by ${model.approval.approvedByName || model.customer?.name}`}</strong>
        <small>{formatQuotationV2Date(model.approval.approvedAt)} · Version {model.meta.version}</small>
      </div>
    );
  }
  return (
    <div className="pdf-approval">
      <span>AWAITING CUSTOMER CONFIRMATION</span>
      <p>This proposal can be reviewed and approved securely through the private WanderLuxe quotation link.</p>
    </div>
  );
};
