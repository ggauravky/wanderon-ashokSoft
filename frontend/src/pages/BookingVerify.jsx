import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, MapPin, Calendar, Users, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { verifyBookingTokenApi } from '../services/api';

const BookingVerify = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setLoading(true);
        const res = await verifyBookingTokenApi(token);
        setData(res);
      } catch (err) {
        setError(err.message || 'Invalid or expired QR verification token.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center bg-brand-light">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-emerald border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-brand-navy font-bold text-sm">Verifying Boarding Pass Authenticity...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center bg-brand-light px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-2xl font-black text-brand-navy mb-2">Invalid Verification QR</h1>
          <p className="text-gray-500 text-sm mb-6">
            {error || 'This QR code does not correspond to an active or confirmed WanderLuxe booking record.'}
          </p>
          <Link
            to="/"
            className="w-full py-3.5 bg-brand-navy text-white font-bold rounded-2xl inline-block hover:bg-brand-emerald transition-all"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16 bg-gradient-to-b from-brand-light via-white to-brand-light px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Verified Header */}
        <div className="p-8 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/30">
            <ShieldCheck size={36} className="text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider mb-2">
            <CheckCircle2 size={14} /> Official Verified Travel Pass
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">{data.tripTitle}</h1>
          <p className="text-emerald-100 text-xs font-mono mt-1">Booking ID: {data.bookingId}</p>
        </div>

        {/* Verification Summary Details */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-brand-light rounded-2xl">
              <span className="text-gray-400 font-bold uppercase block mb-1">Lead Traveler</span>
              <div className="flex items-center gap-2 font-extrabold text-brand-navy">
                <Users size={16} className="text-brand-emerald shrink-0" />
                <span className="truncate">{data.customerName}</span>
              </div>
            </div>

            <div className="p-4 bg-brand-light rounded-2xl">
              <span className="text-gray-400 font-bold uppercase block mb-1">Total Travelers</span>
              <div className="flex items-center gap-2 font-extrabold text-brand-navy">
                <Users size={16} className="text-brand-emerald shrink-0" />
                <span>{data.numberOfTravelers} Person(s)</span>
              </div>
            </div>

            <div className="p-4 bg-brand-light rounded-2xl">
              <span className="text-gray-400 font-bold uppercase block mb-1">Departure Batch</span>
              <div className="flex items-center gap-2 font-extrabold text-brand-navy">
                <Calendar size={16} className="text-brand-emerald shrink-0" />
                <span className="truncate">{data.batchDate}</span>
              </div>
            </div>

            <div className="p-4 bg-brand-light rounded-2xl">
              <span className="text-gray-400 font-bold uppercase block mb-1">Trip Duration</span>
              <div className="flex items-center gap-2 font-extrabold text-brand-navy">
                <Clock size={16} className="text-brand-emerald shrink-0" />
                <span>{data.duration}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-xs">
            <MapPin size={18} className="text-brand-emerald shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-brand-navy block">Pickup & Meeting Point</span>
              <span className="text-gray-600 font-medium">{data.pickupPoint}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Status</span>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black uppercase tracking-wider text-[11px]">
              {data.bookingStatus}
            </span>
          </div>

          <Link
            to="/"
            className="w-full py-4 bg-brand-navy text-white rounded-2xl font-extrabold text-xs hover:bg-brand-emerald transition-all shadow-xl flex items-center justify-center gap-2"
          >
            Visit WanderLuxe Expeditions <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingVerify;
