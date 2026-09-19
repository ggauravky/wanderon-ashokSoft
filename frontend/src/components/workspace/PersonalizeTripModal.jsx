import React, { useState } from 'react';
import { X, Sparkles, Check, Compass, Home, Clock, Utensils, DollarSign, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VIBE_OPTIONS = [
  { id: 'monasteries', label: 'Monasteries & Sacred Sites', icon: '🏯', desc: 'Ancient cliffside gompas & sacred prayers' },
  { id: 'stargazing', label: 'Bortle 1 Stargazing', icon: '✨', desc: 'Zero light pollution Milky Way night skies' },
  { id: 'photography', label: 'Photography Expeditions', icon: '📷', desc: 'Golden hour mountain ridges & high passes' },
  { id: 'adventure', label: 'High-Altitude Treks', icon: '🧗', desc: 'Glacial lakes, suspension bridges & rocky paths' },
  { id: 'romantic', label: 'Cozy Mountain Hideaway', icon: '💑', desc: 'Private decks, quiet sunsets & fireside chai' },
  { id: 'cafes', label: 'Highland Cafe Trail', icon: '☕', desc: 'World’s highest cafes & organic bakery stops' }
];

const STAY_OPTIONS = [
  { id: 'Homestay 🏡', title: 'Authentic Homestay 🏡', desc: 'Warm local host family with traditional home-cooked cuisine and wood-heated rooms.' },
  { id: 'Boutique Hotel 🏨', title: 'Boutique Mountain Lodge 🏨', desc: 'Heated luxury rooms, panoramic glass decks, ambient dining and ensuite baths.' },
  { id: 'Glamping / Campsite ⛺', title: 'Glamping / Alpine Campsite ⛺', desc: 'Heated lakeside dome tents, starfield skylights, bonfires and barbecue setups.' },
  { id: 'Standard Hotel 🛏️', title: 'Dependable Comfort Hotel 🛏️', desc: 'Clean, reliable guestrooms with 24/7 power backup and geyser facilities.' }
];

const RHYTHM_OPTIONS = [
  { id: 'Chill Starts (9:00 AM)', title: 'Chill Starts (9:00 AM)', desc: 'Relaxed breakfast with mountain sun before hitting the road.' },
  { id: 'Early Starts (5:30 AM)', title: 'Early Starts (5:30 AM)', desc: 'First light golden alpenglow and zero traffic across mountain passes.' }
];

const VEHICLE_OPTIONS = [
  { id: 'Car (Self-Drive)', title: 'Rent a Car (Self-Drive) 🚗', desc: 'Rent a 4x4 SUV or Car to drive yourself across passes with GPS navigation.' },
  { id: 'Bike (Motorcycle)', title: 'Rent a Bike (Motorcycle) 🏍️', desc: 'Royal Enfield Himalayan / 450cc Dual-Sport with helmet & riding gear.' },
  { id: 'Car with Private Driver', title: 'Car with Private Driver 🚙', desc: 'Dedicated 4x4 SUV with veteran local mountain terrain chauffeur.' }
];

const DINING_OPTIONS = [
  { id: 'Vegetarian', title: 'Pure Vegetarian 🥦', desc: 'Fresh local farm vegetables, daals, rotis & hot mountain soups' },
  { id: 'Non-Vegetarian', title: 'Non-Vegetarian 🍗', desc: 'Wholesome local mutton/chicken curries, broths & high-protein meals' },
  { id: 'Jain', title: 'Jain Friendly 🥕', desc: 'Strict no-root vegetables with pure vegetarian kitchen hygiene' },
  { id: 'Local Regional', title: 'Local Himalayan Delicacies 🥟', desc: 'Authentic momos, thukpa, siddu, butter tea & local grains' }
];

const BUDGET_OPTIONS = [
  { id: 'Backpacker', tier: 'Budget', label: 'Backpacker Circuit', range: '₹18,000 – ₹25,000', desc: 'Shared local homestays, scenic group transit, authentic local dhabas' },
  { id: 'Comfort', tier: 'Moderate', label: 'Comfort Expedition', range: '₹38,000 – ₹52,000', desc: 'Heated boutique lodges, private chauffeur, buffet dining included' },
  { id: 'Luxury', tier: 'Luxury', label: 'Luxury Overland', range: '₹75,000 – ₹1,10,000', desc: 'Premium glamping suites, luxury 4x4 cruiser, curated private dining' }
];

const PersonalizeTripModal = ({
  isOpen,
  onClose,
  formData = {},
  onSavePreferences,
  destination = 'Spiti Valley'
}) => {
  const [activeSubTab, setActiveSubTab] = useState('vibe'); // 'vibe' | 'stays' | 'rhythm' | 'dining' | 'budget'
  const [localPreferences, setLocalPreferences] = useState({
    interests: formData.interests || ['monasteries', 'stargazing', 'photography'],
    stayPreference: formData.stayPreference || 'Homestay 🏡',
    paceRhythm: formData.paceRhythm || 'Chill Starts (9:00 AM)',
    transportPreference: formData.transportPreference || 'Rent a Car (Self-Drive)',
    dietaryPreference: formData.dietaryPreference || 'Vegetarian',
    budgetTier: formData.budgetTier || 'Comfort',
    budgetLevel: formData.budgetLevel || 'Moderate',
    tripType: formData.tripType || 'Couple'
  });

  if (!isOpen) return null;

  const toggleInterest = (id) => {
    setLocalPreferences((prev) => {
      const exists = prev.interests.includes(id);
      return {
        ...prev,
        interests: exists ? prev.interests.filter(i => i !== id) : [...prev.interests, id]
      };
    });
  };

  const handleApply = () => {
    onSavePreferences?.(localPreferences);
    onClose();
  };

  const tabs = [
    { id: 'vibe', label: '1. Vibe & Interests', icon: Compass },
    { id: 'stays', label: '2. Stays & Lodging', icon: Home },
    { id: 'rhythm', label: '3. Rhythm & Transit', icon: Clock },
    { id: 'dining', label: '4. Food & Dining', icon: Utensils },
    { id: 'budget', label: '5. Budget Tier', icon: DollarSign }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/30">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Personalise Your {destination} Trip
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tailor experiences, hospitality, pace and dining to match your exact vibe
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto grow space-y-5">
          {/* TAB 1: VIBE & INTERESTS */}
          {activeSubTab === 'vibe' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Select Your Target Activities & Vibes
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose all activities you'd love integrated into your daily route.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VIBE_OPTIONS.map((item) => {
                  const isChecked = localPreferences.interests.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleInterest(item.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-600 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <div className="grow">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-slate-900 leading-tight">
                            {item.label}
                          </h5>
                          {isChecked && <Check size={14} className="text-emerald-700 stroke-[3]" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: STAYS & LODGING */}
          {activeSubTab === 'stays' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Choose Your Preferred Lodging Style
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  All stays are vetted for hot water, heated bedding & certified hospitality.
                </p>
              </div>

              <div className="space-y-2.5">
                {STAY_OPTIONS.map((stay) => {
                  const isSelected = localPreferences.stayPreference === stay.id;
                  return (
                    <div
                      key={stay.id}
                      onClick={() => setLocalPreferences(prev => ({ ...prev, stayPreference: stay.id }))}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-600 shadow-xs ring-1 ring-emerald-600/30'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <h5 className="text-xs sm:text-sm font-black text-slate-900">
                          {stay.title}
                        </h5>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {stay.desc}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check size={12} className="stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: RHYTHM & TRANSIT */}
          {activeSubTab === 'rhythm' && (
            <div className="space-y-6">
              {/* Vehicle Preference */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Vehicle Preference: Rent a Bike or Car?
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose whether to rent a self-drive car/SUV, adventure bike, or travel with a private driver.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {VEHICLE_OPTIONS.map((veh) => {
                    const isSelected = localPreferences.transportPreference === veh.id;
                    return (
                      <div
                        key={veh.id}
                        onClick={() => setLocalPreferences(prev => ({ ...prev, transportPreference: veh.id }))}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-600 shadow-xs ring-2 ring-emerald-600/10'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="text-xs font-black text-slate-900">{veh.title}</h5>
                            {isSelected && <Check size={14} className="text-emerald-700 stroke-[3]" />}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">{veh.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sub-form for Driver Details vs Rental Query */}
                {(() => {
                  const isDriver = (localPreferences.transportPreference || '').toLowerCase().includes('driver');
                  const isBike = (localPreferences.transportPreference || '').toLowerCase().includes('bike');

                  if (isDriver) {
                    return (
                      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 mt-3">
                        <span className="text-xs font-black uppercase text-emerald-950 tracking-wider flex items-center gap-1.5">
                          <ShieldCheck size={15} className="text-emerald-700" /> Driver & Chauffeur Details
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-600 block mb-1">Driver Language</label>
                            <div className="flex flex-wrap gap-1">
                              {['Hindi & English', 'Fluent English', 'Local Regional'].map((lang) => (
                                <button
                                  key={lang}
                                  type="button"
                                  onClick={() => setLocalPreferences(prev => ({ ...prev, driverLanguage: lang }))}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                    (localPreferences.driverLanguage || 'Hindi & English') === lang
                                      ? 'bg-emerald-700 text-white font-black'
                                      : 'bg-white text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {lang}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-600 block mb-1">Driver Experience</label>
                            <div className="flex flex-wrap gap-1">
                              {['Veteran (10+ Yrs)', 'Friendly Guide', 'Calm & Scenic'].map((style) => (
                                <button
                                  key={style}
                                  type="button"
                                  onClick={() => setLocalPreferences(prev => ({ ...prev, driverStyle: style }))}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                    (localPreferences.driverStyle || 'Veteran (10+ Yrs)') === style
                                      ? 'bg-emerald-700 text-white font-black'
                                      : 'bg-white text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {style}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-600 block mb-1">Driver Special Notes / Pickup Request</label>
                          <input
                            type="text"
                            value={localPreferences.driverNotes || ''}
                            onChange={(e) => setLocalPreferences(prev => ({ ...prev, driverNotes: e.target.value }))}
                            placeholder="e.g., Pickup at Manali / Chandigarh, scenic photo halts..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 mt-3">
                      <span className="text-xs font-black uppercase text-slate-800 tracking-wider block">
                        Do you want to rent a {isBike ? 'Bike' : 'Car'} or bring your own?
                      </span>

                      <div className="grid grid-cols-2 gap-2">
                        <div
                          onClick={() => setLocalPreferences(prev => ({ ...prev, needsRental: true }))}
                          className={`p-2.5 rounded-xl border-2 cursor-pointer ${
                            localPreferences.needsRental !== false
                              ? 'bg-emerald-50 border-emerald-600 font-bold'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <h6 className="text-xs font-black text-slate-900">Yes, Rent a {isBike ? 'Bike 🏍️' : 'Car 🚗'}</h6>
                          <p className="text-[10px] text-slate-500 mt-0.5">Rental vehicle delivered to pickup spot</p>
                        </div>

                        <div
                          onClick={() => setLocalPreferences(prev => ({ ...prev, needsRental: false }))}
                          className={`p-2.5 rounded-xl border-2 cursor-pointer ${
                            localPreferences.needsRental === false
                              ? 'bg-emerald-50 border-emerald-600 font-bold'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <h6 className="text-xs font-black text-slate-900">No, Bringing Own {isBike ? 'Bike 🏍️' : 'Car 🚗'}</h6>
                          <p className="text-[10px] text-slate-500 mt-0.5">I will drive my personal vehicle</p>
                        </div>
                      </div>

                      {localPreferences.needsRental !== false ? (
                        <div className="pt-2 border-t border-slate-200/60">
                          <label className="text-[10px] font-black uppercase text-slate-600 block mb-1">Preferred Model</label>
                          <div className="flex flex-wrap gap-1.5">
                            {(isBike ? ['Himalayan 450cc', 'Scram 411', 'KTM Adv 390'] : ['Thar 4x4', 'Innova Crysta', 'Scorpio-N 4x4']).map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setLocalPreferences(prev => ({ ...prev, rentalModel: m }))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  (localPreferences.rentalModel || (isBike ? 'Himalayan 450cc' : 'Thar 4x4')) === m
                                    ? 'bg-emerald-700 text-white font-black'
                                    : 'bg-white text-slate-700 border border-slate-200'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-200/60">
                          <label className="text-[10px] font-black uppercase text-slate-600 block mb-1">Your Personal Vehicle Model</label>
                          <input
                            type="text"
                            value={localPreferences.ownVehicleDetails || ''}
                            onChange={(e) => setLocalPreferences(prev => ({ ...prev, ownVehicleDetails: e.target.value }))}
                            placeholder="e.g., Thar 4x4 Diesel / Himalayan 411cc"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Morning Rhythm */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Daily Rhythm & Morning Departure
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    How do you like to start your expedition days?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {RHYTHM_OPTIONS.map((rhythm) => {
                    const isSelected = localPreferences.paceRhythm === rhythm.id;
                    return (
                      <div
                        key={rhythm.id}
                        onClick={() => setLocalPreferences(prev => ({ ...prev, paceRhythm: rhythm.id }))}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-600 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="text-xs font-black text-slate-900">{rhythm.title}</h5>
                            {isSelected && <Check size={14} className="text-emerald-700 stroke-[3]" />}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{rhythm.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DINING */}
          {activeSubTab === 'dining' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Food & Dietary Preference
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Our tour captains and homestays calibrate kitchens to your dietary habits.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DINING_OPTIONS.map((dine) => {
                  const isSelected = localPreferences.dietaryPreference === dine.id;
                  const isNonVeg = dine.id === 'Non-Vegetarian';
                  return (
                    <div
                      key={dine.id}
                      onClick={() => setLocalPreferences(prev => ({ ...prev, dietaryPreference: dine.id }))}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? isNonVeg
                            ? 'bg-red-50/70 border-red-600 shadow-xs'
                            : 'bg-emerald-50/70 border-emerald-600 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="text-xs font-black text-slate-900">{dine.title}</h5>
                          {isSelected && <Check size={14} className={isNonVeg ? "text-red-700 stroke-[3]" : "text-emerald-700 stroke-[3]"} />}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-snug">{dine.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: BUDGET */}
          {activeSubTab === 'budget' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Target Budget Tier
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transparent per-person estimation including transport, stays & meal inclusions.
                </p>
              </div>

              <div className="space-y-2.5">
                {BUDGET_OPTIONS.map((b) => {
                  const isSelected = localPreferences.budgetTier === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setLocalPreferences(prev => ({ ...prev, budgetTier: b.id, budgetLevel: b.tier }))}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-600 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-black text-slate-900">{b.label}</h5>
                          <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            {b.range}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{b.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check size={12} className="stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Save & Recalibrate Itinerary</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PersonalizeTripModal;
