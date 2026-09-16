import React from 'react';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { normalizePhone } from '../salesUtils.js';

const ContactActionLinks = ({ lead, compact = false }) => {
  const phone = String(lead?.phone || '').trim();
  const email = String(lead?.email || '').trim();
  const whatsappPhone = normalizePhone(phone);
  const message = encodeURIComponent(`Hello ${lead?.name || 'there'}, this is WanderLuxe regarding your travel expert request ${lead?.referenceId || ''}.`);
  const classes = compact
    ? 'flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900'
    : 'flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50';

  return (
    <div className="flex flex-wrap gap-2" aria-label="Traveler contact actions">
      {phone && (
        <a href={`tel:${phone}`} className={classes} aria-label={`Call ${lead?.name || 'traveler'}`} title="Call traveler">
          <Phone size={15} aria-hidden="true" /> {!compact && 'Call'}
        </a>
      )}
      {whatsappPhone && (
        <a
          href={`https://wa.me/${whatsappPhone}?text=${message}`}
          target="_blank"
          rel="noreferrer"
          className={classes}
          aria-label={`Open WhatsApp for ${lead?.name || 'traveler'}`}
          title="Open WhatsApp"
        >
          <MessageCircle size={15} aria-hidden="true" /> {!compact && 'WhatsApp'}
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className={classes} aria-label={`Email ${lead?.name || 'traveler'}`} title="Email traveler">
          <Mail size={15} aria-hidden="true" /> {!compact && 'Email'}
        </a>
      )}
    </div>
  );
};

export default ContactActionLinks;
