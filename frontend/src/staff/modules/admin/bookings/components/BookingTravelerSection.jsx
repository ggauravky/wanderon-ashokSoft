import React from 'react';
import { Mail, Phone, UserRound } from 'lucide-react';

const BookingTravelerSection = ({ booking }) => {
  const travelers = booking.travelers || [];
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-950">Traveler</h2><div className="mt-4 rounded-lg border border-slate-200 p-4"><div className="flex items-center gap-2 font-semibold text-slate-900"><UserRound size={16} className="text-emerald-700" />{booking.customer?.name || 'Name not provided'}</div><div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p className="flex items-center gap-2"><Mail size={14} />{booking.customer?.email || 'Email not provided'}</p><p className="flex items-center gap-2"><Phone size={14} />{booking.customer?.phone || 'Phone not provided'}</p><p>Age: {booking.customer?.age || '—'}</p><p>Gender: {booking.customer?.gender || '—'}</p><p>Traveler count: {booking.numberOfTravelers ?? '—'}</p><p>Occupancy: {booking.occupancy || '—'}</p></div></div>{travelers.length > 0 && <div className="mt-4 space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Additional travelers</p>{travelers.map((traveler, index) => <div key={`${traveler.name}-${index}`} className="grid gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 sm:grid-cols-4"><span className="font-medium text-slate-900">{traveler.name || `Traveler ${index + 2}`}</span><span>{traveler.age || 'Age —'}</span><span>{traveler.gender || 'Gender —'}</span><span>{traveler.phone || traveler.email || 'Contact —'}</span></div>)}</div>}</section>;
};

export default BookingTravelerSection;

