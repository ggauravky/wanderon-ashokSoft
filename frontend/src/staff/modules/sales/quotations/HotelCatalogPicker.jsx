import React, { useEffect, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getHotelApi, listHotelsApi } from '../../../../services/hotelService.js';
import { getEmptyHotelOption } from '../../../../services/quotationService.js';

const types = ['HOTEL', 'BOUTIQUE_HOTEL', 'RESORT', 'HOSTEL', 'HOMESTAY', 'GUEST_HOUSE', 'CAMP', 'VILLA', 'APARTMENT', 'LODGE', 'OTHER'];
const meals = { EP: 'EP (Room Only)', CP: 'CP (Breakfast)', MAP: 'MAP (Breakfast + Dinner)', AP: 'AP (All Meals)' };
const control = 'min-h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm';
const newId = () => `hotel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export default function HotelCatalogPicker({ open, onClose, onSelect, initialSearch = '', existing = null, isAdmin = false }) {
  const [filters, setFilters] = useState({ search: '', city: '', propertyType: '', starRating: '', page: 1 });
  const [result, setResult] = useState({ data: [], pagination: {} });
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ roomTypeId: '', mealPlan: '', checkIn: '', checkOut: '', nights: 1, rooms: 1, occupancy: '', applyRate: false, ratePlanId: '' });
  const change = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? value : 1 }));
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    if (!open) return;
    setFilters({ search: initialSearch || '', city: '', propertyType: '', starRating: '', page: 1 });
    setForm({ roomTypeId: existing?.catalogRoomTypeId || '', mealPlan: existing?.catalogMealPlan || '', checkIn: existing?.checkIn?.slice?.(0, 10) || '', checkOut: existing?.checkOut?.slice?.(0, 10) || '', nights: existing?.nights || 1, rooms: existing?.rooms || 1, occupancy: existing?.occupancy || '', applyRate: false, ratePlanId: '' });
    setHotel(null); setError('');
  }, [open, initialSearch, existing]);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const timer = setTimeout(() => {
      setLoading(true); setError('');
      listHotelsApi(filters).then((data) => { if (alive) setResult(data); }).catch((cause) => { if (alive) setError(cause.message); }).finally(() => { if (alive) setLoading(false); });
    }, 250);
    return () => { alive = false; clearTimeout(timer); };
  }, [filters, open]);
  useEffect(() => {
    if (!open || !existing?.catalogHotelId) return;
    let alive = true;
    getHotelApi(existing.catalogHotelId).then((data) => {
      if (!alive) return;
      setHotel(data.data);
      setForm((current) => ({ ...current,
        roomTypeId: data.data.roomTypes.some((room) => room.roomTypeId === current.roomTypeId) ? current.roomTypeId : data.data.roomTypes[0]?.roomTypeId || '',
        mealPlan: data.data.availableMealPlans.includes(current.mealPlan) ? current.mealPlan : data.data.availableMealPlans[0] || ''
      }));
    }).catch(() => {});
    return () => { alive = false; };
  }, [open, existing?.catalogHotelId]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open, onClose]);
  const selectHotel = async (item) => {
    setLoading(true); setError('');
    try {
      const response = await getHotelApi(item._id);
      setHotel(response.data);
      setForm((current) => ({ ...current, roomTypeId: current.roomTypeId && response.data.roomTypes.some((room) => room.roomTypeId === current.roomTypeId) ? current.roomTypeId : response.data.roomTypes[0]?.roomTypeId || '', mealPlan: response.data.availableMealPlans.includes(current.mealPlan) ? current.mealPlan : response.data.availableMealPlans[0] || '' }));
    } catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  };
  const validRates = (hotel?.ratePlans || []).filter((rate) => rate.active && rate.roomTypeId === form.roomTypeId && rate.mealPlan === form.mealPlan);
  const selectedRate = validRates.find((rate) => rate.ratePlanId === form.ratePlanId);
  const date = form.checkIn ? new Date(form.checkIn) : null;
  const rateValid = selectedRate && date && (!selectedRate.validFrom || date >= new Date(selectedRate.validFrom)) && (!selectedRate.validTo || date <= new Date(selectedRate.validTo)) && form.nights >= selectedRate.minNights;
  const confirm = () => {
    if (!hotel || !form.roomTypeId || !form.mealPlan) return;
    if (form.applyRate && !rateValid) return setError('Choose a valid reference rate and check-in date.');
    const room = hotel.roomTypes.find((item) => item.roomTypeId === form.roomTypeId);
    const option = {
      ...(existing || getEmptyHotelOption()), optionId: existing?.catalogHotelId ? existing.optionId : newId(),
      sourceKind: 'HOTEL_CATALOG', reviewStatus: 'REVIEWED',
      ...(existing?.sourceKind === 'AI_PLANNER' ? { replacesAiOptionId: existing.optionId } : {}),
      catalogHotelId: hotel._id, catalogHotelCode: hotel.hotelCode, catalogVersion: hotel.catalogVersion,
      catalogRoomTypeId: room.roomTypeId, catalogMealPlan: form.mealPlan,
      hotelName: hotel.name, city: hotel.location?.city || '', location: [hotel.location?.locality, hotel.location?.city].filter(Boolean).join(', '),
      category: hotel.classification || hotel.propertyType?.replaceAll('_', ' '), roomType: room.name, mealPlan: meals[form.mealPlan],
      imageUrl: hotel.media?.hero?.secureUrl || '', gallery: (hotel.media?.gallery || []).slice(0, 8).map((media) => ({ url: media.secureUrl, altText: media.altText })), amenities: hotel.amenities || [],
      checkIn: form.checkIn || undefined, checkOut: form.checkOut || undefined, nights: form.nights, rooms: form.rooms,
      occupancy: form.occupancy, availabilityStatus: 'UNCONFIRMED',
      costPerNight: 0, pricePerNight: 0, taxRate: 0, totalCost: 0, totalPrice: 0,
      ...(isAdmin && form.applyRate ? { applyCatalogRate: true, catalogRatePlanId: form.ratePlanId } : {})
    };
    onSelect(option);
    onClose();
  };
  if (!open) return null;
  return <div role="presentation" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" aria-labelledby="hotel-picker-title" className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded bg-white shadow-xl"><header className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 id="hotel-picker-title" className="text-lg font-semibold text-slate-950">Search Hotel Catalog</h2><p className="text-sm text-slate-500">Availability is unconfirmed until verified with the property.</p></div><button type="button" aria-label="Close hotel search" title="Close" onClick={onClose} className="p-2 text-slate-600"><X size={20} /></button></header><div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]"><div className="min-h-0 overflow-y-auto border-r border-slate-200 p-5"><div className="grid gap-2 sm:grid-cols-2"><label className="relative sm:col-span-2"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input autoFocus aria-label="Search hotel catalog" value={filters.search} onChange={(event) => change('search', event.target.value)} placeholder="Hotel name or destination" className={`${control} pl-9`} /></label><input aria-label="Filter city" value={filters.city} onChange={(event) => change('city', event.target.value)} placeholder="City" className={control} /><select aria-label="Property type" value={filters.propertyType} onChange={(event) => change('propertyType', event.target.value)} className={control}><option value="">All types</option>{types.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}</select><select aria-label="Star rating" value={filters.starRating} onChange={(event) => change('starRating', event.target.value)} className={control}><option value="">All ratings</option>{[5, 4, 3, 2, 1].map((stars) => <option key={stars} value={stars}>{stars} stars</option>)}</select></div>{error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}<div className="mt-4 space-y-2">{loading && <p className="text-sm text-slate-500">Loading hotels…</p>}{!loading && result.data.map((item) => <button key={item._id} type="button" onClick={() => selectHotel(item)} className={`flex w-full gap-3 border p-3 text-left hover:border-emerald-500 ${hotel?._id === item._id ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}>{item.media?.hero?.secureUrl ? <img src={item.media.hero.secureUrl} alt="" className="h-16 w-20 shrink-0 object-cover" /> : <Building2 size={28} className="m-3 shrink-0 text-slate-400" />}<span><strong className="block text-sm text-slate-950">{item.name}</strong><span className="text-xs text-slate-600">{item.location?.city} · {item.propertyType?.replaceAll('_', ' ')} · {item.starRating || 'Unrated'} stars</span></span></button>)}{!loading && !result.data.length && <div className="py-8 text-sm text-slate-500">No matching active hotels. {isAdmin ? <Link to="/staff/admin/hotels/new" className="text-emerald-700 underline">Create a property</Link> : 'Add a manual hotel option or ask Admin to add the property.'}</div>}</div><div className="mt-4 flex items-center justify-between text-sm"><span>{result.pagination?.total || 0} matches</span><div className="flex items-center gap-2"><button type="button" aria-label="Previous hotel page" disabled={filters.page <= 1} onClick={() => change('page', filters.page - 1)}><ChevronLeft size={17} /></button>{filters.page} / {result.pagination?.pages || 1}<button type="button" aria-label="Next hotel page" disabled={filters.page >= result.pagination?.pages} onClick={() => change('page', filters.page + 1)}><ChevronRight size={17} /></button></div></div></div><div className="min-h-0 overflow-y-auto p-5">{hotel ? <div className="space-y-4"><div>{hotel.media?.hero?.secureUrl && <img src={hotel.media.hero.secureUrl} alt={hotel.media.hero.altText || hotel.name} className="aspect-video w-full object-cover" />}<h3 className="mt-3 text-lg font-semibold text-slate-950">{hotel.name}</h3><p className="text-sm text-slate-600">{hotel.location?.city}, {hotel.location?.state} · {hotel.propertyType?.replaceAll('_', ' ')}</p><p className="mt-2 text-sm text-slate-600">{hotel.shortDescription}</p><p className="mt-2 text-xs text-slate-500">{hotel.amenities?.slice(0, 8).join(' · ')}</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Room type<select value={form.roomTypeId} onChange={(event) => set('roomTypeId', event.target.value)} className={control}>{hotel.roomTypes.map((room) => <option key={room.roomTypeId} value={room.roomTypeId}>{room.name}</option>)}</select></label><label className="text-sm">Meal plan<select value={form.mealPlan} onChange={(event) => set('mealPlan', event.target.value)} className={control}>{hotel.availableMealPlans.map((plan) => <option key={plan} value={plan}>{meals[plan]}</option>)}</select></label><label className="text-sm">Check-in<input type="date" value={form.checkIn} onChange={(event) => set('checkIn', event.target.value)} className={control} /></label><label className="text-sm">Check-out<input type="date" value={form.checkOut} onChange={(event) => set('checkOut', event.target.value)} className={control} /></label><label className="text-sm">Nights<input type="number" min="1" value={form.nights} onChange={(event) => set('nights', Math.max(1, Number(event.target.value)))} className={control} /></label><label className="text-sm">Rooms<input type="number" min="1" value={form.rooms} onChange={(event) => set('rooms', Math.max(1, Number(event.target.value)))} className={control} /></label><label className="text-sm sm:col-span-2">Occupancy<select value={form.occupancy} onChange={(event) => set('occupancy', event.target.value)} className={control}>{['', 'Single', 'Double Sharing', 'Triple Sharing', 'Family Suite', 'Quad Sharing'].map((item) => <option key={item} value={item}>{item || 'Unconfirmed'}</option>)}</select></label></div>{isAdmin && <div className="border-t border-slate-200 pt-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.applyRate} onChange={(event) => set('applyRate', event.target.checked)} />Use catalog reference rate</label>{form.applyRate && <><select aria-label="Reference rate" value={form.ratePlanId} onChange={(event) => set('ratePlanId', event.target.value)} className={`${control} mt-2`}><option value="">Choose rate</option>{validRates.map((rate) => <option key={rate.ratePlanId} value={rate.ratePlanId}>{rate.currency} {rate.customerReferenceRatePerNight} / night</option>)}</select>{selectedRate && <p className={`mt-1 text-xs ${rateValid ? 'text-emerald-700' : 'text-amber-700'}`}>{rateValid ? 'Valid for selected stay' : !date ? 'Date validity requires review' : 'Reference rate expired or outside stay terms'}</p>}</>}</div>}<button type="button" disabled={!form.roomTypeId || !form.mealPlan || (form.applyRate && !rateValid)} onClick={confirm} className="min-h-10 w-full rounded bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-40">{existing ? 'Use selected property' : 'Add to quotation'}</button></div> : <div className="flex min-h-60 items-center justify-center text-sm text-slate-500">Select a hotel to review rooms and stay options.</div>}</div></div></div></div>;
}
