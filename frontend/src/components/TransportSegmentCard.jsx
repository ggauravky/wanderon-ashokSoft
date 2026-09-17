import React, { useState } from 'react';
import { 
  Plane, Train, Bus, Car, Truck, Navigation, Bike, Ship, MoveRight,
  Clock, MapPin, Calendar, Users, DollarSign, ShieldAlert, Copy, 
  Trash2, ChevronDown, ChevronUp, Lock, CheckCircle2, FileText, 
  Camera, Info, Tag, Check, AlertCircle
} from 'lucide-react';
import { TRANSPORT_MODES, TRANSPORT_TYPES } from '../services/quotationService';
import VehicleMediaManager from './VehicleMediaManager';
import TransportDocumentManager from './TransportDocumentManager';

export default function TransportSegmentCard({
  segment,
  index,
  totalSegments = 1,
  effectiveTravelers = 2,
  isSuperOrAdmin = false,
  readOnly = false,
  onChange = () => {},
  onDuplicate = () => {},
  onDelete = () => {}
}) {
  const [expanded, setExpanded] = useState(true);
  const currentMode = segment.mode || 'SUV';

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'FLIGHT': return <Plane size={16} className="text-sky-600" />;
      case 'TRAIN': return <Train size={16} className="text-emerald-600" />;
      case 'BUS': return <Bus size={16} className="text-amber-600" />;
      case 'CAB': return <Car size={16} className="text-indigo-600" />;
      case 'SUV': return <Car size={16} className="text-indigo-600" />;
      case 'TEMPO_TRAVELLER': return <Truck size={16} className="text-purple-600" />;
      case 'COACH': return <Bus size={16} className="text-blue-600" />;
      case 'PRIVATE_CAR': return <Car size={16} className="text-teal-600" />;
      case 'BIKE': return <Bike size={16} className="text-orange-600" />;
      case 'FERRY': return <Ship size={16} className="text-cyan-600" />;
      case 'TRANSFER': return <Navigation size={16} className="text-violet-600" />;
      default: return <MoveRight size={16} className="text-slate-600" />;
    }
  };

  const updateField = (field, value) => {
    if (readOnly) return;
    onChange({ ...segment, [field]: value });
  };

  const updateNestedField = (parent, field, value) => {
    if (readOnly) return;
    const parentObj = segment[parent] || {};
    onChange({
      ...segment,
      [parent]: {
        ...parentObj,
        [field]: value
      }
    });
  };

  const handleModeChange = (newMode) => {
    if (readOnly) return;
    const matchedMode = TRANSPORT_MODES.find(m => m.value === newMode);
    const updated = {
      ...segment,
      mode: newMode,
      type: matchedMode?.defaultType || segment.type || 'SUV (Innova/Crysta)'
    };

    // Auto-adjust default pricingType
    if (newMode === 'FLIGHT' || newMode === 'TRAIN') {
      updated.pricingType = 'PER_PERSON';
    } else if (newMode === 'CAB' || newMode === 'SUV' || newMode === 'TEMPO_TRAVELLER' || newMode === 'COACH') {
      updated.pricingType = 'PER_VEHICLE';
    }

    onChange(updated);
  };

  const isFlight = currentMode === 'FLIGHT';
  const isTrain = currentMode === 'TRAIN';
  const isBus = currentMode === 'BUS' || currentMode === 'COACH';
  const isVehicle = ['CAB', 'SUV', 'TEMPO_TRAVELLER', 'PRIVATE_CAR'].includes(currentMode);

  return (
    <div
      className={`rounded-3xl border transition-all space-y-4 overflow-hidden ${
        segment.selected
          ? 'bg-emerald-50/20 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
          : 'bg-white border-slate-200 shadow-xs opacity-90'
      }`}
    >
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="checkbox"
            checked={Boolean(segment.selected)}
            disabled={readOnly}
            onChange={(e) => updateField('selected', e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded cursor-pointer shrink-0"
            title={segment.selected ? 'Selected for Quotation Price' : 'Unselected Alternative (Not in total price)'}
          />

          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
            {getModeIcon(currentMode)}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                Segment {index + 1}:
              </span>
              <select
                value={currentMode}
                disabled={readOnly}
                onChange={(e) => handleModeChange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                {TRANSPORT_MODES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              {segment.selected ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  Selected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                  Alternative Option
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
              <span>{segment.route?.from || segment.pickup || 'Origin'} ➔ {segment.route?.to || segment.drop || 'Destination'}</span>
              {segment.reference?.flightNumber && <span>• Flight {segment.reference.flightNumber}</span>}
              {segment.reference?.trainNumber && <span>• Train {segment.reference.trainNumber}</span>}
              {segment.vehicle && <span>• {segment.vehicle}</span>}
            </div>
          </div>
        </div>

        {/* Financial & Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs font-black text-emerald-700">
              ₹{(segment.totalPrice || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-bold">
              {segment.pricingType === 'PER_PERSON' ? 'Per Person Rate' : 'Total Vehicle Price'}
            </div>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {!readOnly && (
              <>
                <button
                  type="button"
                  onClick={onDuplicate}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 cursor-pointer"
                  title="Duplicate segment"
                >
                  <Copy size={15} />
                </button>
                <button
                  type="button"
                  disabled={totalSegments <= 1}
                  onClick={onDelete}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
                  title="Delete segment"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Form Fields */}
      {expanded && (
        <div className="p-4 sm:p-6 space-y-6 pt-1">
          {/* Row 1: Segment Title & Primary Carrier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                Segment Title / Description
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={segment.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder={isFlight ? 'e.g. Delhi to Leh Morning Flight' : isTrain ? 'e.g. New Delhi to Kalka Shatabdi' : 'e.g. Chandigarh to Manali Private Transfer'}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                {isFlight ? 'Airline / Carrier' : isTrain ? 'Train Name' : isBus ? 'Bus Operator' : 'Vehicle Model / Fleet'}
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={segment.vehicle || ''}
                onChange={(e) => updateField('vehicle', e.target.value)}
                placeholder={isFlight ? 'e.g. Air India / IndiGo' : isTrain ? 'e.g. Vande Bharat Express' : isBus ? 'e.g. Zingbus Volvo 9600' : 'e.g. Toyota Innova Crysta 4x4'}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                {isFlight ? 'Flight Number' : isTrain ? 'Train Number' : isBus ? 'Bus Number / Service' : 'Vehicle Registration / Type'}
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={segment.reference?.[isFlight ? 'flightNumber' : isTrain ? 'trainNumber' : isBus ? 'busNumber' : 'vehicleNumber'] || ''}
                onChange={(e) => updateNestedField('reference', isFlight ? 'flightNumber' : isTrain ? 'trainNumber' : isBus ? 'busNumber' : 'vehicleNumber', e.target.value)}
                placeholder={isFlight ? 'e.g. AI-445' : isTrain ? 'e.g. 12011' : isBus ? 'e.g. DL-01-AB-1234' : 'e.g. HP-01-X-4421'}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Row 2: Origin & Destination Route */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                Origin / Departure {isFlight ? 'Airport (IATA)' : isTrain ? 'Station' : 'City'} *
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={segment.route?.from || segment.pickup || ''}
                onChange={(e) => {
                  updateNestedField('route', 'from', e.target.value);
                  updateField('pickup', e.target.value);
                }}
                placeholder={isFlight ? 'e.g. Delhi (DEL)' : isTrain ? 'e.g. NDLS (New Delhi)' : 'e.g. Chandigarh Airport'}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                Destination / Arrival {isFlight ? 'Airport (IATA)' : isTrain ? 'Station' : 'City'} *
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={segment.route?.to || segment.drop || ''}
                onChange={(e) => {
                  updateNestedField('route', 'to', e.target.value);
                  updateField('drop', e.target.value);
                }}
                placeholder={isFlight ? 'e.g. Leh (IXL)' : isTrain ? 'e.g. CDG (Chandigarh)' : 'e.g. Manali Mall Road'}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                Departure Date & Time
              </label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  disabled={readOnly}
                  value={segment.schedule?.departureDate || ''}
                  onChange={(e) => updateNestedField('schedule', 'departureDate', e.target.value)}
                  className="w-2/3 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none"
                />
                <input
                  type="time"
                  disabled={readOnly}
                  value={segment.schedule?.departureTime || ''}
                  onChange={(e) => updateNestedField('schedule', 'departureTime', e.target.value)}
                  className="w-1/3 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                Arrival Date & Time
              </label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  disabled={readOnly}
                  value={segment.schedule?.arrivalDate || ''}
                  onChange={(e) => updateNestedField('schedule', 'arrivalDate', e.target.value)}
                  className="w-2/3 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none"
                />
                <input
                  type="time"
                  disabled={readOnly}
                  value={segment.schedule?.arrivalTime || ''}
                  onChange={(e) => updateNestedField('schedule', 'arrivalTime', e.target.value)}
                  className="w-1/3 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Mode-Specific Features */}
          {isFlight && (
            <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-200/80 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-sky-800 mb-1">Cabin Class</label>
                <select
                  value={segment.cabinClass || 'Economy'}
                  disabled={readOnly}
                  onChange={(e) => updateField('cabinClass', e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-1.5 font-bold outline-none cursor-pointer"
                >
                  <option value="Economy">Economy</option>
                  <option value="Premium Economy">Premium Economy</option>
                  <option value="Business">Business Class</option>
                  <option value="First Class">First Class</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-sky-800 mb-1">PNR / Airline Reference</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={segment.reference?.pnr || ''}
                  onChange={(e) => updateNestedField('reference', 'pnr', e.target.value)}
                  placeholder="e.g. WX9K2L"
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-1.5 font-bold outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-sky-800 mb-1">Check-in Baggage</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={segment.baggage?.checkIn || '15 Kg'}
                  onChange={(e) => updateNestedField('baggage', 'checkIn', e.target.value)}
                  placeholder="e.g. 15 Kg"
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-1.5 font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-sky-800 mb-1">Cabin Baggage</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={segment.baggage?.cabin || '7 Kg'}
                  onChange={(e) => updateNestedField('baggage', 'cabin', e.target.value)}
                  placeholder="e.g. 7 Kg"
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-1.5 font-bold outline-none"
                />
              </div>
            </div>
          )}

          {isTrain && (
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-emerald-800 mb-1">Rail Class</label>
                <select
                  value={segment.cabinClass || 'CC'}
                  disabled={readOnly}
                  onChange={(e) => updateField('cabinClass', e.target.value)}
                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-1.5 font-bold outline-none cursor-pointer"
                >
                  <option value="1A">Executive 1st AC (1A)</option>
                  <option value="2A">AC 2-Tier (2A)</option>
                  <option value="3A">AC 3-Tier (3A)</option>
                  <option value="CC">AC Chair Car (CC)</option>
                  <option value="EC">Executive Chair Car (EC)</option>
                  <option value="SL">Sleeper (SL)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-emerald-800 mb-1">PNR Number</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={segment.reference?.pnr || ''}
                  onChange={(e) => updateNestedField('reference', 'pnr', e.target.value)}
                  placeholder="e.g. 234-9871234"
                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-1.5 font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-emerald-800 mb-1">Coach / Berth</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={segment.seatDetails || ''}
                  onChange={(e) => updateField('seatDetails', e.target.value)}
                  placeholder="e.g. Coach C2, Seat 45, 46"
                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-1.5 font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-emerald-800 mb-1">Boarding Station</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={segment.route?.pickupPoint || ''}
                  onChange={(e) => updateNestedField('route', 'pickupPoint', e.target.value)}
                  placeholder="e.g. Platform 4, NDLS"
                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-1.5 font-bold outline-none"
                />
              </div>
            </div>
          )}

          {isBus && (
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-800 mb-1">Bus Seating Type</label>
                <select
                  value={segment.cabinClass || 'AC Sleeper'}
                  disabled={readOnly}
                  onChange={(e) => updateField('cabinClass', e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded-xl px-3 py-1.5 font-bold outline-none cursor-pointer"
                >
                  <option value="AC Sleeper">AC Multi-Axle Sleeper (2+1)</option>
                  <option value="Semi-Sleeper">Volvo AC Semi-Sleeper (2+2)</option>
                  <option value="Executive Seater">Executive AC Seater</option>
                  <option value="Bharat Benz">Bharat Benz Luxury Coach</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-800 mb-1">Seat Numbers</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={segment.seatDetails || ''}
                  onChange={(e) => updateField('seatDetails', e.target.value)}
                  placeholder="e.g. Upper 12, 13"
                  className="w-full bg-white border border-amber-200 rounded-xl px-3 py-1.5 font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-800 mb-1">Pickup Boarding Point</label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={segment.route?.pickupPoint || ''}
                  onChange={(e) => updateNestedField('route', 'pickupPoint', e.target.value)}
                  placeholder="e.g. Majnu Ka Tila, Delhi"
                  className="w-full bg-white border border-amber-200 rounded-xl px-3 py-1.5 font-bold outline-none"
                />
              </div>
            </div>
          )}

          {/* Row 4: Commercial Pricing & Multiplier */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                Pricing Multiplier Model
              </label>
              <select
                value={segment.pricingType || 'PER_VEHICLE'}
                disabled={readOnly}
                onChange={(e) => updateField('pricingType', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                <option value="PER_VEHICLE">Per Vehicle / Transit (Fixed)</option>
                <option value="PER_PERSON">Per Passenger (Pax Multiplied)</option>
                <option value="FIXED">Fixed Lump Sum</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                {segment.pricingType === 'PER_PERSON' ? 'Quantity (Units/Tickets)' : 'Quantity (Vehicles)'}
              </label>
              <input
                type="number"
                min="1"
                disabled={readOnly}
                value={segment.quantity || 1}
                onChange={(e) => updateField('quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                Customer Unit Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                disabled={readOnly}
                value={segment.unitPrice || ''}
                onChange={(e) => updateField('unitPrice', Math.max(0, Number(e.target.value) || 0))}
                placeholder={segment.pricingType === 'PER_PERSON' ? 'e.g. 6000' : 'e.g. 18000'}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-emerald-700 outline-none"
              />
            </div>

            {isSuperOrAdmin ? (
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <Lock size={10} /> Supplier Unit Cost (Internal)
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={readOnly}
                  value={segment.unitCost || ''}
                  onChange={(e) => updateField('unitCost', Math.max(0, Number(e.target.value) || 0))}
                  placeholder="e.g. 14000"
                  className="w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  disabled={readOnly}
                  value={segment.capacity || 6}
                  onChange={(e) => updateField('capacity', Math.max(1, parseInt(e.target.value, 10) || 6))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>
            )}
          </div>

          {/* Internal Driver / Supplier Section (Admin / Sales only) */}
          {isSuperOrAdmin && isVehicle && (
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Lock size={12} className="text-amber-600" /> Operational Chauffeur & Supplier Details (Internal)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Chauffeur / Driver Name</label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={segment.driverDetails?.name || ''}
                    onChange={(e) => updateNestedField('driverDetails', 'name', e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Chauffeur Phone</label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={segment.driverDetails?.phone || ''}
                    onChange={(e) => updateNestedField('driverDetails', 'phone', e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Supplier Fleet Partner</label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={segment.provider || ''}
                    onChange={(e) => updateField('provider', e.target.value)}
                    placeholder="e.g. North India Travels Ltd."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Vehicle Media Gallery */}
          <div className="pt-2 border-t border-slate-100">
            <VehicleMediaManager
              media={segment.vehicleMedia || []}
              onChange={(newMedia) => updateField('vehicleMedia', typeof newMedia === 'function' ? newMedia(segment.vehicleMedia || []) : newMedia)}
              readOnly={readOnly}
            />
          </div>

          {/* Section: Tickets & Travel Documents */}
          <div className="pt-2 border-t border-slate-100">
            <TransportDocumentManager
              documents={segment.documents || []}
              onChange={(newDocs) => updateField('documents', typeof newDocs === 'function' ? newDocs(segment.documents || []) : newDocs)}
              readOnly={readOnly}
              isSuperOrAdmin={isSuperOrAdmin}
            />
          </div>
        </div>
      )}
    </div>
  );
}
