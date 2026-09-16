import React from 'react';
import { Edit3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import TripStatusBadge from './TripStatusBadge';
import { futureDepartures, money, nextDeparture } from '../tripHelpers';

const TripTable = ({ trips }) => (
  <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white lg:block">
    <table className="w-full min-w-[1040px] text-left text-sm">
      <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-[0.08em] text-slate-500"><tr>
        {['Trip', 'Destination', 'Price', 'Departures', 'Next departure', 'Capacity', 'Status', 'Updated', ''].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}
      </tr></thead>
      <tbody className="divide-y divide-slate-100">
        {trips.map((trip) => { const next = nextDeparture(trip); return <tr key={trip._id} className="hover:bg-slate-50/70">
          <td className="px-4 py-3"><div className="flex items-center gap-3"><img src={trip.image} alt="" className="h-11 w-14 rounded-lg bg-slate-100 object-cover" /><div><p className="max-w-[220px] truncate font-semibold text-slate-900">{trip.title}</p><p className="max-w-[220px] truncate text-xs text-slate-500">/{trip.slug}</p></div></div></td>
          <td className="px-4 py-3"><p className="font-medium text-slate-800">{trip.location || '—'}</p><p className="text-xs text-slate-500">{trip.destination || '—'}</p></td>
          <td className="px-4 py-3 font-semibold text-slate-900">{money(trip.price, trip.currency)}</td>
          <td className="px-4 py-3 text-slate-700">{futureDepartures(trip).length}</td>
          <td className="px-4 py-3 text-slate-700">{next?.dates || 'None'}</td>
          <td className="px-4 py-3 text-slate-700">{next ? `${Number(next.bookedSeats || 0)} / ${Number(next.capacity || 0)}` : '—'}</td>
          <td className="px-4 py-3"><TripStatusBadge status={trip.status} /></td>
          <td className="px-4 py-3 text-xs text-slate-500">{trip.updatedAt ? new Date(trip.updatedAt).toLocaleDateString('en-IN') : '—'}</td>
          <td className="px-4 py-3"><Link to={`/staff/admin/trips/${trip._id}/edit`} aria-label={`Edit ${trip.title}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"><Edit3 size={15} /></Link></td>
        </tr>; })}
      </tbody>
    </table>
  </div>
);

export default TripTable;

