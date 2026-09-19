import React, { forwardRef } from 'react';
import { 
  Compass, ShieldCheck, MapPin, Calendar, Clock, Users, 
  CheckCircle2, QrCode, AlertCircle, Sparkles, Navigation
} from 'lucide-react';

const money = (value) =>
  value === null || value === undefined || !Number.isFinite(Number(value))
    ? '—'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));

export const BoardingPassDocument = forwardRef(({ pass }, ref) => {
  if (!pass) return null;

  const {
    bookingId = '',
    bookingStatus = 'CONFIRMED',
    confirmedAt = null,
    trip = {},
    leadTraveler = {},
    coTravelers = [],
    numberOfTravelers = null,
    occupancy = '',
    pricing = {},
    payment = {},
    qrCode = {},
    supportContact = {}
  } = pass;

  const formattedDate = confirmedAt ? new Date(confirmedAt).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : '—';

  const totalAmount = pricing.totalAmount != null && Number.isFinite(Number(pricing.totalAmount))
    ? Number(pricing.totalAmount)
    : pricing.finalAmount != null && Number.isFinite(Number(pricing.finalAmount))
      ? Number(pricing.finalAmount)
      : null;

  const amountPaid = pricing.amountPaid != null && Number.isFinite(Number(pricing.amountPaid))
    ? Number(pricing.amountPaid)
    : totalAmount;

  const amountOutstanding = pricing.amountOutstanding != null && Number.isFinite(Number(pricing.amountOutstanding))
    ? Number(pricing.amountOutstanding)
    : 0;

  const destinationName = trip.destination || trip.location || '—';
  const pickupPointName = trip.pickupPoint || 'To be confirmed';

  return (
    <div
      ref={ref}
      id="boarding-pass-print-container"
      style={{
        width: '100%',
        maxWidth: '820px',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        borderRadius: '24px',
        border: '1.5px solid #e2e8f0',
        padding: '24px',
        boxSizing: 'border-box',
        margin: '0 auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* Top Luxury Boarding Header */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #091224 0%, #0f2347 100%)',
          color: '#ffffff',
          borderRadius: '18px',
          padding: '20px 24px',
          marginBottom: '20px',
          border: '1px solid #1e3a8a',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}>
              <Compass size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '2px', color: '#34d399', textTransform: 'uppercase' }}>
                  WanderLuxe Expeditions
                </span>
                <span style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#6ee7b7',
                  fontSize: '9px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  OFFICIAL TRAVEL PASS
                </span>
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: '900', margin: '2px 0 0 0', color: '#ffffff', letterSpacing: '-0.5px' }}>
                Official Travel Boarding Pass
              </h1>
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '8px 14px',
            borderRadius: '12px',
            textAlign: 'right'
          }}>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>
              Booking Reference / PNR
            </span>
            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '16px', fontWeight: '900', color: '#ffffff' }}>
              {bookingId || '—'}
            </span>
          </div>
        </div>

        {/* Route Bar */}
        <div style={{
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Assembly Point</span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc' }}>
              {pickupPointName.split('(')[0].trim() || 'To be confirmed'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
            <span style={{ width: '30px', height: '1.5px', backgroundColor: 'rgba(16, 185, 129, 0.4)', display: 'inline-block' }} />
            <Navigation size={16} style={{ transform: 'rotate(90deg)' }} />
            <span style={{ width: '30px', height: '1.5px', backgroundColor: 'rgba(16, 185, 129, 0.4)', display: 'inline-block' }} />
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Destination</span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#34d399' }}>
              {destinationName}
            </span>
          </div>
        </div>
      </div>

      {/* Main Document Body */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Expedition Specs */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569' }}>
              <Sparkles size={14} color="#059669" /> Expedition Information
            </div>
            <span style={{
              backgroundColor: '#d1fae5',
              color: '#065f46',
              fontSize: '10px',
              fontWeight: '900',
              padding: '3px 10px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid #a7f3d0'
            }}>
              <ShieldCheck size={12} /> {bookingStatus}
            </span>
          </div>

          <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: '0 0 14px 0' }}>
            {trip.title || '—'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                Duration
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#0f172a' }}>
                <Clock size={14} color="#059669" /> {trip.duration || '—'}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                Departure Batch
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#0f172a' }}>
                <Calendar size={14} color="#059669" /> {trip.batchDate || 'To be confirmed'}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                Sharing / Class
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#0f172a' }}>
                <Users size={14} color="#059669" /> {occupancy || 'Double Sharing'}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            backgroundColor: '#ecfdf5',
            borderRadius: '12px',
            border: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '11px'
          }}>
            <MapPin size={15} color="#047857" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#064e3b', display: 'block', fontSize: '11px' }}>Assembly & Pickup Point:</strong>
              <span style={{ color: '#065f46', fontWeight: '500' }}>{pickupPointName}</span>
            </div>
          </div>
        </div>

        {/* Passenger Manifest & Boarding QR Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          
          {/* Left Column: Passenger Manifest & Financials */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid #e2e8f0',
              fontSize: '11px'
            }}>
              <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', display: 'block', marginBottom: '10px' }}>
                Lead Passenger Manifest
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Traveler Name</span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{leadTraveler.name || '—'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Phone</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: '700', color: '#0f172a' }}>
                    {leadTraveler.phone || '—'}
                  </span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Email</span>
                  <span style={{ color: '#334155', fontWeight: '500' }}>{leadTraveler.email || '—'}</span>
                </div>
              </div>

              <div style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Total Party Size</span>
                <span style={{
                  backgroundColor: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontWeight: '800',
                  color: '#0f172a'
                }}>
                  {numberOfTravelers ?? 1} Guest{numberOfTravelers > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Co-Travelers if any */}
            {coTravelers && coTravelers.length > 0 && (
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                fontSize: '11px'
              }}>
                <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Co-Travelers ({coTravelers.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {coTravelers.map((t, idx) => (
                    <div key={idx} style={{
                      backgroundColor: '#ffffff',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <strong style={{ color: '#0f172a' }}>{idx + 2}. {t.name || 'Traveler'}</strong>
                      <span style={{ color: '#64748b', fontSize: '10px' }}>{t.gender || '—'}, {t.age ? `${t.age} Yrs` : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Summary Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '16px',
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Payment Status</span>
                  <strong style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> {payment.status || 'PAID'}
                  </strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Total Paid</span>
                  <strong style={{ fontSize: '16px', color: '#0f172a' }}>
                    {money(amountPaid)}
                  </strong>
                </div>
              </div>

              <div style={{
                marginTop: '8px',
                paddingTop: '6px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#64748b'
              }}>
                <span>Journey Value: <strong style={{ color: '#0f172a' }}>{money(totalAmount)}</strong></span>
                <span>Outstanding: <strong style={{ color: '#047857' }}>{money(amountOutstanding)}</strong></span>
              </div>

              <div style={{
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9px',
                color: '#64748b',
                fontFamily: 'ui-monospace, monospace'
              }}>
                <span>Ref: {payment.razorpayPaymentId || '—'}</span>
                <span>Date: {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Prominent High-Contrast Scannable Boarding QR */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '16px',
            border: '2px solid #0f172a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'center'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a', display: 'block' }}>
                Official Boarding QR
              </span>
              <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '500' }}>
                Present to trip captain at assembly point
              </span>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              margin: '10px 0'
            }}>
              {qrCode.dataUrl ? (
                <img
                  src={qrCode.dataUrl}
                  alt="Official Boarding Pass QR"
                  style={{ width: '190px', height: '190px', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <div style={{ width: '190px', height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <QrCode size={56} />
                </div>
              )}
            </div>

            <div>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', fontWeight: '700', color: '#334155', display: 'block' }}>
                {bookingId || '—'}
              </span>
              <span style={{ fontSize: '9px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                WanderLuxe Verification QR
              </span>
            </div>
          </div>
        </div>

        {/* Mandatory Guidelines */}
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '14px',
          padding: '12px 16px',
          fontSize: '10px',
          color: '#78350f'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px', color: '#92400e' }}>
            <AlertCircle size={13} color="#b45309" /> Mandatory Boarding Checklist
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px', fontWeight: '500' }}>
            <div>• Carry original Govt Photo ID (Aadhaar / Passport / Voter ID).</div>
            <div>• Report to pickup hub at least 30 minutes prior to departure.</div>
            <div>• Present this official Boarding QR for captain verification.</div>
            <div>• Support: <strong>{supportContact.phone || '—'}</strong> ({supportContact.email || '—'})</div>
          </div>
        </div>

      </div>

      {/* Footer Perforation Line */}
      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1.5px dashed #cbd5e1',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '9px',
        color: '#64748b',
        fontFamily: 'ui-monospace, monospace'
      }}>
        <span>WanderLuxe Travels • Official System-Generated Boarding Pass</span>
        <span>Valid only when booking status is CONFIRMED and PAID</span>
      </div>
    </div>
  );
});

BoardingPassDocument.displayName = 'BoardingPassDocument';
export default BoardingPassDocument;
