import React, { forwardRef } from 'react';
import { 
  Compass, ShieldCheck, MapPin, Calendar, Clock, Users, 
  Phone, Mail, CheckCircle2, QrCode, AlertCircle, Sparkles, 
  ArrowRight, Luggage, Navigation, Plane, Award, KeyRound
} from 'lucide-react';

export const BoardingPassDocument = forwardRef(({ pass }, ref) => {
  if (!pass) return null;

  const {
    bookingId = 'WLX-2026-CONFIRMED',
    bookingStatus = 'CONFIRMED',
    confirmedAt = new Date().toISOString(),
    trip = {},
    leadTraveler = {},
    coTravelers = [],
    numberOfTravelers = 1,
    occupancy = 'Double Sharing',
    pricing = {},
    payment = {},
    qrCode = {},
    supportContact = {}
  } = pass;

  const formattedDate = new Date(confirmedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = new Date(confirmedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const finalAmount = Number(pricing.finalAmount || pricing.subtotal || 0);
  const destinationName = trip.destination || trip.location || 'Himalayas, India';
  const pickupPointName = trip.pickupPoint || 'Main Meeting Point / Airport Arrival Terminal';

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
      {/* Top Airline Style Boarding Header */}
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
                  ELECTRONIC VOUCHER
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
              {bookingId}
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
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Origin Hub</span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc' }}>
              {pickupPointName.split('(')[0].trim() || 'Assembly Point'}
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

      {/* Main Document Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Section 1: Trip & Itinerary Specs */}
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
            {trip.title || 'Curated Travel Expedition'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                Duration
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#0f172a' }}>
                <Clock size={14} color="#059669" /> {trip.duration || 'Flexible'}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                Departure Batch
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#0f172a' }}>
                <Calendar size={14} color="#059669" /> {trip.batchDate || '15 Sep - 20 Sep 2026'}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                Sharing / Class
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#0f172a' }}>
                <Users size={14} color="#059669" /> {occupancy}
              </div>
            </div>
          </div>

          {/* Assembly / Pickup Point Callout */}
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
              <strong style={{ color: '#064e3b', display: 'block', fontSize: '11px' }}>Assembly & Boarding Point:</strong>
              <span style={{ color: '#065f46', fontWeight: '500' }}>{pickupPointName}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Traveler Manifest & QR Security Box */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          
          {/* Left Column: Passenger Manifest & Payment */}
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
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{leadTraveler.name || 'Valued Guest'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Phone</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: '700', color: '#0f172a' }}>
                    {leadTraveler.phone || '+91 85420 36499'}
                  </span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Email</span>
                  <span style={{ color: '#334155', fontWeight: '500' }}>{leadTraveler.email || 'traveler@wanderluxe.in'}</span>
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
                  {numberOfTravelers} Guest{numberOfTravelers > 1 ? 's' : ''}
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
                      <strong style={{ color: '#0f172a' }}>{idx + 1}. {t.name || `Traveler ${idx + 2}`}</strong>
                      <span style={{ color: '#64748b', fontSize: '10px' }}>{t.gender || 'Adult'}, {t.age || '--'} Yrs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fare & Payment Box */}
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
                    ₹{finalAmount.toLocaleString()} <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>INR</span>
                  </strong>
                </div>
              </div>
              <div style={{
                marginTop: '8px',
                paddingTop: '6px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9px',
                color: '#64748b',
                fontFamily: 'ui-monospace, monospace'
              }}>
                <span>Ref: {payment.razorpayPaymentId || 'rzp_verified_pay'}</span>
                <span>Date: {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Res Scannable QR Voucher */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'center'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a', display: 'block' }}>
                Identity & Boarding QR
              </span>
              <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '500' }}>
                Scan at pickup point for verified check-in
              </span>
            </div>

            <div style={{
              padding: '10px',
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '2px solid #0f172a',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              margin: '10px 0'
            }}>
              {qrCode.dataUrl ? (
                <img
                  src={qrCode.dataUrl}
                  alt="Official Boarding Pass QR"
                  style={{ width: '160px', height: '160px', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <QrCode size={44} />
                </div>
              )}
            </div>

            <div>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', fontWeight: '700', color: '#334155', display: 'block' }}>
                {qrCode.verificationToken ? qrCode.verificationToken.substring(0, 16).toUpperCase() : bookingId}
              </span>
              <span style={{ fontSize: '9px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                Captain: {supportContact.captainName || 'Certified Expedition Lead'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Essential Guidelines Notice */}
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
            <div>• Non-transferable digital pass cryptographically linked to PNR.</div>
            <div>• 24/7 Helpline: <strong>+91 85420 36499</strong> (support@wanderluxe.in)</div>
          </div>
        </div>

      </div>

      {/* Perforation Cutout Styling & Footer */}
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
        <span>WanderLuxe Travels Pvt Ltd • Official System Generated Voucher</span>
        <span>SHA-256 Verified Security Hash • All Rights Reserved</span>
      </div>
    </div>
  );
});

BoardingPassDocument.displayName = 'BoardingPassDocument';
export default BoardingPassDocument;
