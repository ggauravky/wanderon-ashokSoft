import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, MapPin, Calendar, CheckCircle2, ShieldCheck, ArrowRight, UserCheck, Star, Camera, Heart, DollarSign } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';

const CreatorTrip = () => {
  const { username, tripSlug } = useParams();

  const creatorData = {
    name: 'Gaurav Kumar Yadav',
    handle: '@gaurav_explores',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
    bio: 'Travel creator & outdoor photographer documenting offbeat Himalayan trails, waterfalls, and culture across India & SE Asia.',
    followers: '124K Followers',
    tripTitle: 'Meghalaya Abode of Clouds Expedition with Gaurav',
    location: 'Meghalaya, India',
    duration: '5 Days / 4 Nights',
    price: 18500,
    discountCode: 'GAURAV15',
    discountAmount: '15% OFF (Save ₹2,775)',
    heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1200',
    highlights: [
      'Double Decker Living Root Bridges Trek in Nongriat',
      'Cliff Jumping & Kayaking in Crystal-Clear Dawki River',
      'Exploring Bamboo Trail in Mawryngkhang',
      'Private bonfire night & local Khasi feast'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Guwahati to Shillong Lake Sightseeing', desc: 'Pickup from airport, scenic drive through Umiam Lake, check-in at Shillong boutique stay.' },
      { day: 2, title: 'Cherrapunji Waterfalls & Arwah Cave Exploration', desc: 'Visit Nohkalikai Falls, Wei Sawdong 3-tier falls, and Arwah limestone caves.' },
      { day: 3, title: 'Nongriat Double Decker Root Bridge Trek', desc: 'Descend 3,000 steps into deep tropical valleys to swim in turquoise natural pools.' },
      { day: 4, title: 'Dawki Glass River & Mawlynnong Cleanest Village', desc: 'Boating on Umngot River at Indo-Bangladesh border and village walk.' },
      { day: 5, title: 'Laitlum Canyons Sunset & Guwahati Drop', desc: 'Panoramic canyon views and airport transfer with lifelong memories.' }
    ],
    budgetBreakdown: [
      { category: 'Accommodation', detail: '4-Star Boutique Homestays & Eco Cottages' },
      { category: 'Transport', detail: 'Private Tempo Traveler with Certified Captain' },
      { category: 'Meals', detail: 'Breakfast & Khasi Traditional Dinners Included' },
      { category: 'Activities', detail: 'Dawki Boating, Entry Permits & Trekking Guide Included' }
    ]
  };

  const schemaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Trip',
    name: creatorData.tripTitle,
    description: `Join travel creator ${creatorData.name} on a 5-day Meghalaya expedition to Living Root Bridges, Dawki glass river, and Laitlum canyons.`,
    itinerary: {
      '@type': 'ItemList',
      itemListElement: creatorData.itinerary.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `Day ${item.day}: ${item.title}`,
        description: item.desc
      }))
    },
    offers: {
      '@type': 'Offer',
      price: creatorData.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `https://wanderluxe.in/creators/${username}/${tripSlug}`
    }
  };

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      <SEOHead
        title={`${creatorData.tripTitle} | Travel with ${creatorData.name}`}
        description={`Join ${creatorData.name} (${creatorData.handle}) on a 5-day Meghalaya travel expedition with 15% discount using code GAURAV15.`}
        canonical={`/creators/${username}/${tripSlug}`}
        ogImage={creatorData.heroImage}
        jsonLd={schemaJsonLd}
      />

      <div className="container mx-auto px-4 md:px-8">
        <Breadcrumbs
          items={[
            { name: 'Creators', path: '/influencer/login' },
            { name: creatorData.name, path: `/creators/${username}/${tripSlug}` }
          ]}
        />

        {/* Creator Header Banner */}
        <div className="bg-brand-navy text-white rounded-3xl p-6 md:p-10 shadow-2xl mb-8 relative overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-emerald/20 border border-brand-emerald/30 text-brand-emerald text-xs font-extrabold">
              <Sparkles size={14} /> Official Creator Expedition
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-white">
              {creatorData.tripTitle}
            </h1>
            <p className="text-white/80 text-xs md:text-sm font-medium leading-relaxed">
              Curated by <span className="font-extrabold text-white">{creatorData.name}</span> in partnership with WanderLuxe Captains.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl font-bold">
                <MapPin size={14} className="text-brand-emerald" /> {creatorData.location}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl font-bold">
                <Calendar size={14} className="text-brand-emerald" /> {creatorData.duration}
              </span>
              <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1.5 rounded-xl font-extrabold">
                Code {creatorData.discountCode}: {creatorData.discountAmount}
              </span>
            </div>
          </div>

          {/* Creator Profile Card */}
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 text-center space-y-3">
            <img src={creatorData.avatar} alt={creatorData.name} className="w-20 h-20 rounded-full border-2 border-brand-emerald mx-auto object-cover shadow-lg" />
            <h2 className="text-lg font-bold text-white">{creatorData.name}</h2>
            <span className="text-xs text-brand-emerald font-mono block">{creatorData.handle} • {creatorData.followers}</span>
            <p className="text-xs text-white/70">{creatorData.bio}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Detailed Itinerary & Budget */}
          <div className="lg:col-span-2 space-y-8">
            {/* Highlights */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200/80 space-y-4">
              <h3 className="text-xl font-extrabold text-brand-navy flex items-center gap-2">
                <Star size={20} className="text-brand-emerald" /> Creator Trip Highlights
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold text-gray-700">
                {creatorData.highlights.map((h, index) => (
                  <li key={index} className="flex items-start gap-2 bg-brand-light p-3 rounded-2xl border border-gray-200">
                    <CheckCircle2 size={16} className="text-brand-emerald shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Day by Day Itinerary */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200/80 space-y-6">
              <h3 className="text-xl font-extrabold text-brand-navy">Detailed Day-by-Day Itinerary</h3>
              <div className="space-y-4">
                {creatorData.itinerary.map((item) => (
                  <div key={item.day} className="p-4 bg-brand-light rounded-2xl border border-gray-200 space-y-1">
                    <span className="text-xs font-extrabold text-brand-emerald uppercase">Day {item.day}</span>
                    <h4 className="text-sm font-extrabold text-brand-navy">{item.title}</h4>
                    <p className="text-xs text-gray-600 font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Breakdown */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200/80 space-y-4">
              <h3 className="text-xl font-extrabold text-brand-navy flex items-center gap-2">
                <DollarSign size={20} className="text-brand-emerald" /> Transparent Trip Budget & Inclusions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {creatorData.budgetBreakdown.map((b, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="font-extrabold text-brand-navy block">{b.category}</span>
                    <span className="text-gray-600">{b.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-200 space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block">Exclusive Creator Pricing</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-brand-emerald">₹{creatorData.price.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 line-through">₹21,275</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mt-2 border border-emerald-200">
                  Use Promo Code: <span className="font-extrabold uppercase">{creatorData.discountCode}</span>
                </span>
              </div>

              <div className="space-y-3 text-xs text-gray-600 font-medium">
                <div className="flex items-center gap-2">
                  <UserCheck size={16} className="text-brand-emerald" /> Verified WanderLuxe Trip Captain
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-brand-emerald" /> 100% Guaranteed Departures
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-brand-emerald" /> Small Group (Max 12 Adventurers)
                </div>
              </div>

              <Link
                to="/checkout"
                state={{
                  tripTitle: creatorData.tripTitle,
                  tripImage: creatorData.heroImage,
                  location: creatorData.location,
                  duration: creatorData.duration,
                  totalAmount: creatorData.price,
                  occupancy: 'Double Sharing'
                }}
                className="w-full py-4 bg-brand-emerald text-white rounded-2xl font-extrabold text-sm hover:bg-brand-teal transition-all shadow-xl shadow-brand-emerald/30 flex items-center justify-center gap-2"
              >
                Book Creator Trip Now <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorTrip;
