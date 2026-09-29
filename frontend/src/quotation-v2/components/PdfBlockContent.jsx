import React from 'react';
import PdfImage from './PdfImage.jsx';
import TravelDocumentCard from './TravelDocumentCard.jsx';
import {
  ApprovalBlock,
  BulletList,
  Experiences,
  ExperiencesMatrix,
  Facts,
  HotelCard,
  HotelMatrix,
  ItineraryDay,
  ItineraryMatrix,
  Money,
  PolicyEntries,
  RouteFlow,
  TransportCard,
  TransportMatrix
} from './templateShared.jsx';
import { formatQuotationV2Date } from '../quotationV2.js';

const SectionLead = ({ block, templateKey }) => {
  if (!block.sectionTitle) return null;
  if (templateKey === 'minimal') {
    return (
      <header className="pdf-section-header dossier-header">
        <span className="dossier-stamp">{block.section.replaceAll('-', ' ')}</span>
        <h2 className="pdf-section-title">{block.sectionTitle}</h2>
      </header>
    );
  }
  if (templateKey === 'journey') {
    return (
      <header className="pdf-section-header journey-header">
        <p className="journey-note">{block.section.replaceAll('-', ' ')}</p>
        <h2 className="pdf-section-title">{block.sectionTitle}</h2>
      </header>
    );
  }
  return (
    <header className="pdf-section-header signature-header">
      <p className="pdf-kicker">{block.section.replaceAll('-', ' ')}</p>
      <h2 className="pdf-section-title">{block.sectionTitle}</h2>
    </header>
  );
};

const Cover = ({ model, templateKey }) => {
  const dates = model.journey?.dateLabel || `${formatQuotationV2Date(model.journey?.startDate)} - ${formatQuotationV2Date(model.journey?.endDate)}`;
  if (templateKey === 'signature_luxe') {
    return (
      <>
        {model.journey?.coverImage && <PdfImage src={model.journey.coverImage} alt="" className="signature-cover-image" priority />}
        <div className="signature-cover-inner">
          <div className="signature-brand">WANDERLUXE</div>
          <div className="signature-cover-main">
            <p className="pdf-kicker" style={{ color: '#d4af37' }}>PRIVATE JOURNEY PROPOSAL · {model.meta?.quotationNumber} · V{model.meta?.version}</p>
            <h1 className="pdf-title">{model.journey?.title}</h1>
            <p className="signature-cover-sub">{model.journey?.destination}{model.journey?.travelStyle ? ` · ${model.journey.travelStyle}` : ''}</p>
            <div style={{ marginTop: 24 }}><RouteFlow stops={model.journey?.routeStops} /></div>
          </div>
          <div className="signature-cover-meta">
            <div><span>CURATED FOR</span><strong>{model.customer?.name}</strong></div>
            <div><span>DATES</span><strong>{dates}</strong></div>
            <div><span>TRAVELERS</span><strong>{model.journey?.travelers?.label || `${model.journey?.travelers?.total} guests`}</strong></div>
            <div><span>ORIGIN</span><strong>{model.journey?.origin || 'To be confirmed'}</strong></div>
          </div>
        </div>
      </>
    );
  }
  if (templateKey === 'journey') {
    return (
      <div className="journey-cover-inner">
        <div className="journey-stamp">PRIVATE TRAVEL JOURNAL</div>
        <p className="pdf-kicker" style={{ marginTop: 26 }}>{model.meta?.quotationNumber} · VERSION {model.meta?.version}</p>
        <h1 className="pdf-title">{model.journey?.title}</h1>
        <p style={{ marginTop: 18, fontSize: 18, color: '#c86d51' }}>{model.journey?.destination}</p>
        <div style={{ maxWidth: 390, marginTop: 28 }}><RouteFlow stops={model.journey?.routeStops} compact /></div>
        <div className="journey-polaroids">
          {[model.journey?.coverImage, model.journey?.secondaryImages?.[0]].filter(Boolean).map((src, index) => (
            <div className="journey-polaroid" key={src}><PdfImage src={src} alt={index ? 'Selected stay' : model.journey?.destination} /></div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 54, bottom: 58, width: 360 }}>
          <Facts items={[['Lead traveler', model.customer?.name], ['Origin', model.journey?.origin], ['Dates', dates], ['Travelers', model.journey?.travelers?.label || model.journey?.travelers?.total], ['Duration', model.journey?.duration], ['Advisor', model.advisor?.name || 'WanderLuxe Travel Desk']]} />
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="dossier-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>ISSUE DATE · {formatQuotationV2Date(model.meta?.issuedAt)}</span>
          <span>QUOTATION REF · {model.meta?.quotationNumber}</span>
          <span>VALID TILL · {formatQuotationV2Date(model.meta?.validUntil)}</span>
        </div>
        <h2 style={{ margin: '22px 0 0', font: '600 20px Georgia,serif', letterSpacing: '.18em' }}>WANDERLUXE</h2>
      </div>
      <div className="dossier-cover-body">
        <span className="dossier-stamp">EXPEDITION DOSSIER · V{model.meta?.version}</span>
        <h1 className="pdf-title">{model.journey?.title}</h1>
        <p style={{ font: 'italic 18px Georgia,serif', color: '#8b1e1e' }}>{model.journey?.destination}</p>
        <div style={{ marginTop: 20 }}><RouteFlow stops={model.journey?.routeStops} compact /></div>
        <div className="dossier-grid" style={{ marginTop: 28 }}>
          <div>
            <Facts items={[['Client', model.customer?.name], ['Origin', model.journey?.origin], ['Dates', dates], ['Duration', model.journey?.duration], ['Travelers', model.journey?.travelers?.label || model.journey?.travelers?.total], ['Travel style', model.journey?.travelStyle], ['Nights', model.journey?.nights]]} />
          </div>
          <div>
            <div className="dossier-tape" />
            <div className="dossier-photo">
              <PdfImage src={model.journey?.coverImage} alt={model.journey?.destination} />
              <p className="journey-note">{model.journey?.destination || 'Journey reference'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Overview = ({ model, templateKey }) => {
  const preferences = model.preferences ? [...(model.preferences.interests || []), model.preferences.stayPreference, model.preferences.dietaryPreference].filter(Boolean).join(' · ') : '';
  return (
    <>
      <Facts items={[['Customer', model.customer?.name], ['Origin', model.journey?.origin], ['Destination', model.journey?.destination], ['Dates', model.journey?.dateLabel || `${formatQuotationV2Date(model.journey?.startDate)} - ${formatQuotationV2Date(model.journey?.endDate)}`], ['Duration', model.journey?.duration], ['Travelers', model.journey?.travelers?.label || `${model.journey?.travelers?.total} guests`], ['Travel style', model.journey?.travelStyle], ['Preferences', preferences]]} />
      <div style={{ marginTop: 20 }}><RouteFlow stops={model.journey?.routeStops} compact={templateKey !== 'signature_luxe'} /></div>
      {model.journey?.highlights?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p className="pdf-kicker">JOURNEY HIGHLIGHTS</p>
          <BulletList items={model.journey.highlights} />
        </div>
      )}
    </>
  );
};

const Pricing = ({ model, compact = false }) => (
  <>
    <div className={`pdf-price-hero ${compact ? 'is-compact' : ''}`}>
      <span className="pdf-kicker">FINAL CUSTOMER PRICE</span>
      <strong><Money value={model.pricing?.finalCustomerPrice} currency={model.pricing?.currency} /></strong>
    </div>
    <div style={{ marginTop: 14 }}>
      <Facts items={[['Deposit', <Money key="deposit" value={model.pricing?.depositAmount} currency={model.pricing?.currency} />], ['Balance', <Money key="balance" value={model.pricing?.balanceAmount} currency={model.pricing?.currency} />], ['Valid until', formatQuotationV2Date(model.meta?.validUntil)], ['Travelers', model.journey?.travelers?.total]]} />
    </div>
    {!compact && model.pricing?.customerVisibleComponents?.length > 0 && (
      <div style={{ marginTop: 18 }}>
        <p className="pdf-kicker">CUSTOMER-FACING BREAKDOWN</p>
        <Facts items={model.pricing.customerVisibleComponents.map(([label, amount]) => [label, <Money key={label} value={amount} currency={model.pricing?.currency} />])} />
      </div>
    )}
    {model.pricing?.priceNotes && <p className="pdf-copy" style={{ marginTop: 10 }}>{model.pricing.priceNotes}</p>}
  </>
);

export default function PdfBlockContent({ block, model, templateKey }) {
  if (block.kind === 'cover') return <Cover model={model} templateKey={templateKey} />;
  if (block.kind === 'closing') {
    return (
      <div className="signature-cover-inner">
        <div>
          <p className="signature-brand">WANDERLUXE</p>
          <p className="pdf-kicker" style={{ marginTop: 90, color: '#d4af37' }}>PRIVATE JOURNEY PROPOSAL</p>
          <h2 className="pdf-title" style={{ marginTop: 18 }}>Your Journey<br />Starts Here</h2>
          <p className="signature-cover-sub">{model.journey?.title} · {model.meta?.quotationNumber} · Version {model.meta?.version}</p>
        </div>
        <div>
          <ApprovalBlock model={model} />
          <div className="signature-cover-meta" style={{ marginTop: 30 }}>
            <div><span>TRAVELER</span><strong>{model.customer?.name}</strong></div>
            <div><span>VALID UNTIL</span><strong>{formatQuotationV2Date(model.meta?.validUntil)}</strong></div>
            {model.advisor && (
              <>
                <div><span>ADVISOR</span><strong>{model.advisor.name || 'WanderLuxe'}</strong></div>
                <div><span>CONTACT</span><strong>{model.advisor.email || model.advisor.phone || 'WanderLuxe Travel Desk'}</strong></div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SectionLead block={block} templateKey={templateKey} />
      <div className="pdf-block-body">
        {block.kind === 'introduction' && (
          <>
            {block.content?.personalNote && <p className="pdf-copy pdf-introduction-copy">{block.content.personalNote}</p>}
            {!block.content?.personalNote && !block.content?.specialRequests && (
              <p className="pdf-copy pdf-introduction-copy">A privately prepared proposal for {model.customer?.name}.</p>
            )}
            {block.content?.specialRequests && (
              <div className="pdf-policy" style={{ marginTop: 12 }}>
                <h3>Special requests</h3>
                <p>{block.content.specialRequests}</p>
              </div>
            )}
          </>
        )}
        {block.kind === 'overview' && <Overview model={model} templateKey={templateKey} />}
        {block.kind === 'itinerary' && (
          <ItineraryDay
            day={block.content}
            detailed={templateKey === 'signature_luxe'}
            compact={templateKey === 'minimal'}
            mode={templateKey === 'signature_luxe' ? 'FULL' : templateKey === 'minimal' ? 'SUMMARY' : 'BALANCED'}
            image={templateKey !== 'minimal' && model.settings?.showItineraryGallery !== false}
          />
        )}
        {block.kind === 'itinerary-matrix' && <ItineraryMatrix days={block.content} />}
        {block.kind === 'hotel' && (
          <HotelCard
            hotel={block.content}
            detailed={templateKey === 'signature_luxe'}
            mode={templateKey === 'signature_luxe' ? 'FULL' : templateKey === 'minimal' ? 'MATRIX' : 'BALANCED'}
            galleryLimit={templateKey === 'signature_luxe' ? 3 : 0}
          />
        )}
        {block.kind === 'hotels-matrix' && <HotelMatrix hotels={block.content} />}
        {block.kind === 'transport' && (
          <TransportCard
            item={block.content}
            mediaLimit={templateKey === 'minimal' ? 0 : templateKey === 'journey' ? 1 : 2}
            showMedia={templateKey !== 'minimal' && (block.content.media || []).length > 0}
          />
        )}
        {block.kind === 'transport-matrix' && <TransportMatrix transport={block.content} />}
        {block.kind === 'experience' && (
          <Experiences
            activities={block.content.experienceKind === 'activity' ? [block.content] : []}
            addOns={block.content.experienceKind === 'addon' ? [block.content] : []}
            mode="DETAILED"
          />
        )}
        {block.kind === 'experiences-grouped' && (
          <Experiences
            activities={block.content.activities || []}
            addOns={block.content.addOns || []}
            mode="GROUPED"
          />
        )}
        {block.kind === 'experiences-matrix' && (
          <ExperiencesMatrix
            activities={block.content.activities || []}
            addOns={block.content.addOns || []}
          />
        )}
        {block.kind === 'document-register' && (
          <table className="pdf-payment-table" data-pdf-matrix="documents">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Type</th>
                <th>Related Service</th>
                <th style={{ width: '130px' }}>Passenger</th>
                <th style={{ width: '120px' }}>Reference</th>
              </tr>
            </thead>
            <tbody>
              {block.content.map((item) => (
                <tr key={item.id || item.secureUrl}>
                  <td><strong>{item.documentType}</strong></td>
                  <td>{item.relation?.name || 'General travel'}</td>
                  <td>{item.passengerName || '—'}</td>
                  <td>{item.bookingReference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {block.kind === 'document' && (
          <TravelDocumentCard
            document={block.content}
            displayMode={block.content.resolvedPdfDisplay}
            compact={templateKey === 'minimal'}
          />
        )}
        {block.kind === 'bullet-list' && <BulletList items={block.content.items} negative={block.content.negative} />}
        {block.kind === 'pricing' && <Pricing model={model} compact={templateKey === 'minimal'} />}
        {block.kind === 'payment-schedule' && (
          <table className="pdf-payment-table">
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {block.content.map((item, index) => (
                <tr key={`${item.label}-${index}`}>
                  <td><strong>{item.label}</strong></td>
                  <td><Money value={item.amount} currency={model.pricing?.currency} /></td>
                  <td>{formatQuotationV2Date(item.dueDate)}</td>
                  <td>{item.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {block.kind === 'policy' && (
          <PolicyEntries
            entries={[block.content]}
            cardClass={templateKey === 'journey' ? 'journey-paper-card pdf-policy' : templateKey === 'minimal' ? 'dossier-policy pdf-policy' : ''}
          />
        )}
        {block.kind === 'policies-compact' && (
          <div className="pdf-policies-compact">
            <PolicyEntries
              entries={block.content}
              cardClass="dossier-policy pdf-policy"
            />
          </div>
        )}
        {block.kind === 'advisor-approval' && (
          <div className="pdf-advisor-approval">
            {model.advisor && (
              <div className={templateKey === 'journey' ? 'journey-paper-card' : 'pdf-approval'}>
                <span>YOUR ADVISOR</span>
                <strong>{model.advisor.name || 'WanderLuxe Travel Desk'}</strong>
                <small>{[model.advisor.email, model.advisor.phone].filter(Boolean).join(' · ')}</small>
              </div>
            )}
            <ApprovalBlock model={model} />
          </div>
        )}
      </div>
    </>
  );
}
