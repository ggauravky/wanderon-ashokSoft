import React, { useMemo } from 'react';
import { Check, ShieldCheck, Plus } from 'lucide-react';
import { OPTION_MEDIA, getExpeditionProfile } from '../../utils/expeditionPlannerData';

/**
 * Returns environment-adaptive labels for the Transit & Pace step
 */
function getEnvironmentLabels(env = 'high_altitude', destName = 'your destination') {
  const labels = {
    high_altitude: {
      stepBadge: 'Transit & Mountain Pace · Step 3 of 5',
      heading: 'How do you want to conquer the passes?',
      subtitle: (d) => `Configure your driving logistics, daily start rhythm, and high-altitude acclimatization tempo across the ${d} rain shadow.`,
      section3Title: 'High Altitude & Acclimatization Care',
      safetyTitle: 'Himalayan Safety Protocol',
      safetyDesc: 'All expedition vehicles carry medical-grade pulse oximeters, high-capacity portable oxygen canisters, and certified high-altitude drivers trained in AMS detection.',
      showAcclimatization: true,
    },
    coastal_city: {
      stepBadge: 'Transit & Travel Pace · Step 3 of 5',
      heading: 'How do you want to explore the city?',
      subtitle: (d) => `Choose your preferred transport, daily routine, and sightseeing pace across ${d}'s coastal landmarks and heritage quarters.`,
      section3Title: 'Comfort & Sightseeing Pace',
      safetyTitle: 'Verified Travel Assurance',
      safetyDesc: 'All vehicles are AC-equipped with verified chauffeurs. Local AC cabs, metro connectivity, and premium sedan options available for seamless city navigation.',
      showAcclimatization: false,
    },
    urban_heritage: {
      stepBadge: 'Transit & Exploration Pace · Step 3 of 5',
      heading: 'How do you want to navigate the city?',
      subtitle: (d) => `Pick your transport mode, morning rhythm, and sightseeing flow for exploring ${d}'s historic monuments and vibrant bazaars.`,
      section3Title: 'Sightseeing Flow & Comfort',
      safetyTitle: 'Verified City Transit',
      safetyDesc: 'AC sedans with trained chauffeurs, metro access, and rickshaw heritage rides — all pre-verified for safety and comfort.',
      showAcclimatization: false,
    },
    tropical_beach: {
      stepBadge: 'Transit & Beach Pace · Step 3 of 5',
      heading: 'How do you want to cruise the coast?',
      subtitle: (d) => `Configure your coastal transport, daily flow, and beach-hopping pace across ${d}'s sun-kissed shorelines.`,
      section3Title: 'Coastal Comfort & Flow',
      safetyTitle: 'Coastal Safety Assurance',
      safetyDesc: 'Verified beach transport, licensed water sports operators, and coast guard approved ferry services for a safe and fun experience.',
      showAcclimatization: false,
    },
    desert: {
      stepBadge: 'Transit & Desert Pace · Step 3 of 5',
      heading: 'How do you want to traverse the dunes?',
      subtitle: (d) => `Choose your safari transport, daily rhythm, and desert exploration tempo across ${d}'s golden landscape.`,
      section3Title: 'Desert Comfort & Safety',
      safetyTitle: 'Desert Safety Protocol',
      safetyDesc: 'All desert vehicles equipped with GPS trackers, satellite phones, emergency water reserves, and trained desert navigation drivers.',
      showAcclimatization: false,
    },
    rainforest: {
      stepBadge: 'Transit & Jungle Pace · Step 3 of 5',
      heading: 'How do you want to explore the trails?',
      subtitle: (d) => `Set your preferred transport, morning start time, and trekking pace through ${d}'s lush forest trails and canyon paths.`,
      section3Title: 'Trail Safety & Comfort',
      safetyTitle: 'Rainforest Safety Protocol',
      safetyDesc: 'All treks include certified forest guides, rain-proof gear kits, leech-proof ankle guards, and emergency satellite beacons.',
      showAcclimatization: false,
    },
  };

  return labels[env] || labels.urban_heritage;
}

const PlannerStepTransitPace = ({ formData, updateFormData, destination = 'Spiti' }) => {
  const selectedTransit = formData.transportPreference || 'With Driver';
  const selectedPace = formData.paceRhythm || 'Chill Starts (9:00 AM)';
  const selectedAcclimatization = formData.acclimatization || 'Keep it Gentle';

  const profile = useMemo(() => getExpeditionProfile(destination), [destination]);
  const env = profile.environment || 'high_altitude';
  const labels = useMemo(() => getEnvironmentLabels(env, destination), [env, destination]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black uppercase tracking-wider text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {labels.stepBadge}
          </span>
          <button
            type="button"
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors hidden sm:block"
          >
            Skip for now →
          </button>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {labels.heading}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          {labels.subtitle(destination)}
        </p>
      </div>

      {/* 1. Vehicle & Transit Preference: Rent a Car or Bike */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            <span className="text-slate-400">1.</span> Vehicle Preference: Rent a Car or Bike?
          </span>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
            Vehicle Logistics
          </span>
        </div>

        {/* Quick Vehicle Type Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { label: '🚗 Rent a Car (Self-Drive)', title: 'Rent a Car (Self-Drive)', type: 'car' },
            { label: '🏍️ Rent a Bike (Motorcycle)', title: 'Rent a Bike (Motorcycle)', type: 'bike' },
            { label: '🚙 Car with Private Driver', title: 'Car with Private Driver', type: 'chauffeur' }
          ].map((pill) => {
            const isPillActive = (formData.vehicleType === pill.type) || selectedTransit.toLowerCase().includes(pill.type) || selectedTransit.toLowerCase() === pill.title.toLowerCase();
            return (
              <button
                key={pill.type}
                type="button"
                onClick={() => updateFormData({ transportPreference: pill.title, vehicleType: pill.type })}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isPillActive
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {Object.values(OPTION_MEDIA.transit).map((item) => {
            const isSelected = 
              selectedTransit.toLowerCase().includes(item.id.toLowerCase()) ||
              selectedTransit.toLowerCase() === item.title.toLowerCase() ||
              (item.vehicleType && (formData.vehicleType === item.vehicleType || selectedTransit.toLowerCase().includes(item.vehicleType)));
            return (
              <div
                key={item.id}
                onClick={() => updateFormData({ transportPreference: item.title, vehicleType: item.vehicleType || item.id })}
                className={`group relative rounded-3xl overflow-hidden border-2 transition-all duration-200 cursor-pointer bg-white shadow-2xs hover:shadow-md ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-600/10'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Recommended / Type Badge */}
                {item.badge && (
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="text-[9px] font-black uppercase bg-emerald-700 text-white px-2 py-0.5 rounded shadow-xs">
                      {item.badge}
                    </span>
                  </div>
                )}

                {/* Visual Image */}
                <div className="relative h-32 w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Right Checkbox */}
                  <div className="absolute top-2.5 right-2.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-white/80 backdrop-blur-md text-slate-700'
                      }`}
                    >
                      {isSelected ? <Check size={12} className="stroke-[3]" /> : <Plus size={12} />}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <h4 className="text-base font-black text-white drop-shadow-sm">{item.title}</h4>
                    <p className="text-[10px] text-slate-200 font-medium mt-0.5">{item.subtitle}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* SUB-SECTION 1A: RENTAL STATUS QUERY (IF CAR OR BIKE CHOSEN) */}
        {/* ========================================================================= */}
        {(() => {
          const isDriverSelected = selectedTransit.toLowerCase().includes('driver') || selectedTransit.toLowerCase().includes('chauffeur') || formData.vehicleType === 'chauffeur';
          const isBike = selectedTransit.toLowerCase().includes('bike') || formData.vehicleType === 'bike';

          if (isDriverSelected) {
            return (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-950 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-700" /> Private Mountain Chauffeur & Driver Details
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Verified Driver Assignment
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Driver Language */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                      Driver Language Preference
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Hindi & English', 'Fluent English', 'Local Regional / Mountain'].map((lang) => {
                        const isSelected = (formData.driverLanguage || 'Hindi & English') === lang;
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => updateFormData({ driverLanguage: lang })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-700 text-white shadow-xs font-black'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Driver Style / Trait */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                      Chauffeur Experience & Driving Style
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Veteran Mountain Pilot (10+ Yrs)',
                        'Friendly Guide & Storyteller',
                        'Calm & Non-Intrusive'
                      ].map((style) => {
                        const isSelected = (formData.driverStyle || 'Veteran Mountain Pilot (10+ Yrs)') === style;
                        return (
                          <button
                            key={style}
                            type="button"
                            onClick={() => updateFormData({ driverStyle: style })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-700 text-white shadow-xs font-black'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {style}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Driver Pickup & Special Instructions */}
                <div className="space-y-1.5 pt-2 border-t border-emerald-200/60">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                    Pickup Station & Special Driver Requests
                  </label>
                  <input
                    type="text"
                    value={formData.driverNotes || ''}
                    onChange={(e) => updateFormData({ driverNotes: e.target.value })}
                    placeholder="e.g., Pickup at Chandigarh / Manali airport, knowledgeable in scenic photo halts, patient with slow mountain ascents..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>
              </div>
            );
          }

          // If Self-Drive Car or Bike is selected
          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600" /> Do you want to rent a {isBike ? 'Bike' : 'Car'} or bring your own?
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Rental Logistics
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A: Rent */}
                <div
                  onClick={() => updateFormData({ needsRental: true, rentalStatus: 'rent' })}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    formData.needsRental !== false
                      ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-600/10'
                      : 'bg-white hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    formData.needsRental !== false ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-black text-slate-900">
                      Yes, I want to rent a {isBike ? 'Bike 🏍️' : 'Car 🚗'}
                    </h5>
                    <p className="text-[10px] text-slate-500 leading-snug">
                      {isBike ? 'Verified 450cc Dual-Sport with riding helmet, luggage rack & 24/7 mechanical backup.' : 'Verified high-clearance 4x4 SUV / Sedan delivered to your starting station.'}
                    </p>
                  </div>
                </div>

                {/* Option B: Bringing Own */}
                <div
                  onClick={() => updateFormData({ needsRental: false, rentalStatus: 'own' })}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    formData.needsRental === false
                      ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-600/10'
                      : 'bg-white hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    formData.needsRental === false ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-black text-slate-900">
                      No, bringing my own {isBike ? 'Bike 🏍️' : 'Car 🚗'}
                    </h5>
                    <p className="text-[10px] text-slate-500 leading-snug">
                      I will drive my personal vehicle. Includes inner-line permits & emergency breakdown coordination.
                    </p>
                  </div>
                </div>
              </div>

              {/* If Renting, provide model preference options */}
              {formData.needsRental !== false && (
                <div className="pt-2 border-t border-slate-200/60 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Preferred {isBike ? 'Bike' : 'Car'} Rental Model
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(isBike ? [
                      'Royal Enfield Himalayan 450cc',
                      'Royal Enfield Scram 411 / Hunter',
                      'KTM Adventure 390',
                      'BMW G310 GS'
                    ] : [
                      'Mahindra Thar 4x4 (Hardtop)',
                      'Toyota Innova Crysta / Fortuner',
                      'Scorpio-N 4x4 SUV',
                      'Compact 4x4 / Sedan'
                    ]).map((model) => {
                      const isModelSelected = (formData.rentalModel || (isBike ? 'Royal Enfield Himalayan 450cc' : 'Mahindra Thar 4x4 (Hardtop)')) === model;
                      return (
                        <button
                          key={model}
                          type="button"
                          onClick={() => updateFormData({ rentalModel: model })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isModelSelected
                              ? 'bg-emerald-700 text-white shadow-xs font-black'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {model}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* If Bringing Own, text input for vehicle model */}
              {formData.needsRental === false && (
                <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Your Personal Vehicle Details (Make / Model / 4x4 Status)
                  </label>
                  <input
                    type="text"
                    value={formData.ownVehicleDetails || ''}
                    onChange={(e) => updateFormData({ ownVehicleDetails: e.target.value })}
                    placeholder={isBike ? 'e.g., Royal Enfield Himalayan 411cc / Duke 390' : 'e.g., Mahindra Thar 4x4 Diesel / Fortuner 4WD'}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* 2. Morning Rhythm & Pace */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            <span className="text-slate-400">2.</span> What's your daily pace & morning rhythm?
          </span>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
            Routine & Timing
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.values(OPTION_MEDIA.routine).map((item) => {
            const isSelected = selectedPace === item.title;
            return (
              <div
                key={item.id}
                onClick={() => updateFormData({ paceRhythm: item.title, pace: item.id === 'chill' ? 'Balanced' : 'Fast-Paced' })}
                className={`group relative rounded-3xl overflow-hidden border-2 transition-all duration-200 cursor-pointer bg-white shadow-2xs hover:shadow-md ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-600/10'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Visual Image */}
                <div className="relative h-32 w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Top Right Checkbox */}
                  <div className="absolute top-2.5 right-2.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-white/80 backdrop-blur-md text-slate-700'
                      }`}
                    >
                      {isSelected ? <Check size={12} className="stroke-[3]" /> : <Plus size={12} />}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="absolute bottom-2.5 left-3.5 right-3.5">
                    <h4 className="text-base font-black text-white drop-shadow-sm">{item.title}</h4>
                    <p className="text-[10px] text-slate-200 font-medium leading-snug mt-0.5 line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Acclimatization & Safety Care — only shown for high_altitude */}
      {labels.showAcclimatization && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              <span className="text-slate-400">3.</span> {labels.section3Title}
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
              Comfort & Safety
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.values(OPTION_MEDIA.acclimatization).map((item) => {
              const isSelected = selectedAcclimatization === item.title;
              return (
                <div
                  key={item.id}
                  onClick={() => updateFormData({ acclimatization: item.title })}
                  className={`group relative rounded-3xl overflow-hidden border-2 transition-all duration-200 cursor-pointer bg-white shadow-2xs hover:shadow-md ${
                    isSelected
                      ? 'border-emerald-600 ring-2 ring-emerald-600/10'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Visual Image */}
                  <div className="relative h-32 w-full overflow-hidden bg-slate-900">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                    {/* Top Right Checkbox */}
                    <div className="absolute top-2.5 right-2.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white/80 backdrop-blur-md text-slate-700'
                        }`}
                      >
                        {isSelected ? <Check size={12} className="stroke-[3]" /> : <Plus size={12} />}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="absolute bottom-2.5 left-3.5 right-3.5">
                      <h4 className="text-base font-black text-white drop-shadow-sm">{item.title}</h4>
                      <p className="text-[10px] text-slate-200 font-medium leading-snug mt-0.5 line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Safety / Assurance Protocol Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase text-emerald-900 tracking-wider">
            {labels.safetyTitle}
          </h4>
          <p className="text-[11px] text-emerald-800/90 font-medium leading-relaxed mt-0.5">
            {labels.safetyDesc}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlannerStepTransitPace;
