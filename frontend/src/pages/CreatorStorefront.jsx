import React from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle2, Tag, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import TripCard from '../components/TripCard';
import { UPCOMING_TRIPS } from '../constants/mockData';

const CreatorStorefront = () => {
  const { username } = useParams();

  const creator = {
    name: 'Gaurav Kumar Yadav',
    username: username || 'gaurav',
    handle: '@wanderer_gaurav',
    avatar: 'https://kommodo.ai/i/a002dp67vtAEhL4IfgAX',
    verified: true,
    bio: 'Travel Architect & Mountain Explorer. Curating hand-picked group departures across Meghalaya, Spiti Valley, & Bali for curious souls.',
    stats: {
      tripsLed: '150+',
      followers: '85,000+',
      communityRating: '4.9 ★'
    },
    activeCoupons: []
  };

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      <SEOHead
        title={`${creator.name} (${creator.handle}) Official Travel Creator Storefront | WanderLuxe`}
        description={`Explore ${creator.name}'s curated travel departures and group trips on WanderLuxe.`}
        canonical={`/creator/${creator.username}`}
      />

      <div className="container mx-auto px-4 md:px-8">
        <Breadcrumbs
          items={[
            { name: 'Creators', path: '/creator' },
            { name: creator.name, path: `/creator/${creator.username}` }
          ]}
        />

        {/* Creator Hero Card */}
        <div className="bg-brand-navy text-white rounded-3xl p-8 md:p-12 shadow-2xl mb-12 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-brand-emerald opacity-20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-brand-emerald shadow-2xl shrink-0"
            />

            <div className="space-y-3 text-center md:text-left flex-grow">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="bg-brand-emerald text-white text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={14} /> Official Creator Partner
                </span>
                <span className="text-xs text-white/60 font-mono">{creator.handle}</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold">{creator.name}</h1>
              <p className="text-white/80 text-sm md:text-base font-medium max-w-2xl">{creator.bio}</p>

              <div className="flex items-center justify-center md:justify-start gap-6 pt-2 text-xs font-extrabold">
                <div>
                  <span className="text-brand-emerald text-lg block">{creator.stats.tripsLed}</span>
                  <span className="text-white/60 font-normal uppercase text-[10px]">Expeditions Led</span>
                </div>
                <div className="border-x border-white/20 px-6">
                  <span className="text-brand-emerald text-lg block">{creator.stats.followers}</span>
                  <span className="text-white/60 font-normal uppercase text-[10px]">Community Members</span>
                </div>
                <div>
                  <span className="text-amber-400 text-lg block">{creator.stats.communityRating}</span>
                  <span className="text-white/60 font-normal uppercase text-[10px]">Average Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Creator's Active Discount Coupons */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2">
                <Tag size={24} className="text-brand-emerald" /> {creator.name}'s Exclusive Promo Codes
              </h2>
              <p className="text-xs text-gray-500 font-medium">Use these verified coupon codes at checkout for instant discounts.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {creator.activeCoupons.length === 0 && <div className="md:col-span-2 rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">No active creator coupons are currently published.</div>}
          </div>
        </div>

        {/* Creator's Curated Trips */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2">
              <Sparkles size={24} className="text-brand-emerald" /> {creator.name}'s Selected Expeditions
            </h2>
            <p className="text-xs text-gray-500 font-medium">Hand-picked departures led by certified captains.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {UPCOMING_TRIPS.slice(0, 3).map((trip) => (
              <div key={trip.id} className="relative group">
                <TripCard trip={trip} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorStorefront;
