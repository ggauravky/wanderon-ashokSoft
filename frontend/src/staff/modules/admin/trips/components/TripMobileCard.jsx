import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import TripStatusBadge from './TripStatusBadge';
import { futureDepartures, money, nextDeparture } from '../tripHelpers';

const TripMobileCard = ({ trip }) => {
  const next = nextDeparture(trip);
  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex gap-3"><img src={trip.image} alt="" className="h-16 w-20 rounded-lg bg-slate-100 object-cover" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="truncate font-semibold text-slate-950">{trip.title}</h2><TripStatusBadge status={trip.status} /></div><p className="mt-1 truncate text-xs text-slate-500">/{trip.slug}</p><p className="mt-2 font-semibold text-slate-900">{money(trip.price, trip.currency)}</p></div></div>
    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600"><span className="flex items-center gap-1.5"><MapPin size={13} />{trip.location || 'Unspecified'}</span><span className="flex items-center gap-1.5"><CalendarDays size={13} />{futureDepartures(trip).length} departures</span><span className="col-span-2">Next: {next?.dates || 'No future departure'}</span></div>
    <Link to={`/staff/admin/trips/${trip._id}/edit`} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">Edit trip</Link>
  </article>;
};

export default TripMobileCard;
