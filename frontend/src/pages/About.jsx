import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Compass, HeartHandshake, Users, Award, 
  Sparkles, CheckCircle2, ArrowRight, Globe, Mountain, MapPin 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TEAM_MEMBERS } from '../constants/mockData';

const About = () => {
  const stats = [
    { label: 'Happy Travelers', value: '50,000+' },
    { label: 'Handcrafted Departures', value: '200+' },
    { label: 'Average User Rating', value: '4.9 / 5.0' },
    { label: 'Repeat Adventurers', value: '78%' }
  ];

  const values = [
    {
      icon: <ShieldCheck size={32} className="text-brand-emerald" />,
      title: 'Uncompromised Safety',
      desc: 'Certified trip leads trained in wilderness first-aid, satellite communication, and high-altitude emergency protocols.'
    },
    {
      icon: <Compass size={32} className="text-brand-emerald" />,
      title: 'Curated Authentic Routes',
      desc: 'We bypass generic tourist traps to connect you with hidden waterfalls, pristine mountain lakes, and local homestays.'
    },
    {
      icon: <HeartHandshake size={32} className="text-brand-emerald" />,
      title: 'Community First',
      desc: 'Over 60% of our travelers join solo. We create an inclusive, friendly environment where strangers become lifelong friends.'
    },
    {
      icon: <Globe size={32} className="text-brand-emerald" />,
      title: 'Eco & Sustainable Travel',
      desc: 'Zero-single-use-plastic pledge on all Himalayan treks and supporting local indigenous mountain communities.'
    }
  ];

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      <div className="container mx-auto px-4 md:px-8">
        {/* Brand Story Hero */}
        <div className="bg-brand-navy rounded-3xl p-8 md:p-16 text-white mb-16 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-brand-emerald opacity-20 rounded-full blur-3xl" />
          <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-brand-teal opacity-20 rounded-full blur-2xl" />

          <div className="relative z-10 max-w-3xl">
            <span className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-brand-emerald inline-block mb-4 border border-white/10">
              Our Story & Philosophy
            </span>
            <h1 className="text-3xl md:text-6xl font-extrabold mb-6 leading-tight">
              Reimagining Group Travel for Modern Adventurers
            </h1>
            <p className="text-white/80 text-base md:text-xl font-medium leading-relaxed mb-8">
              Founded in 2024 by Gaurav Kumar Yadav, WanderLuxe was built to replace rigid commercial tours with fluid, community-driven group expeditions across North-East India, the Himalayas, and South-East Asia.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/destinations"
                className="px-8 py-4 bg-brand-emerald text-white font-extrabold rounded-2xl text-sm hover:bg-brand-teal transition-all shadow-lg shadow-brand-emerald/30 flex items-center gap-2"
              >
                Explore Upcoming Trips <ArrowRight size={18} />
              </Link>
              <Link
                to="/contact"
                className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl text-sm hover:bg-white/20 backdrop-blur-md transition-all border border-white/20"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>

        {/* Impact Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 md:p-8 text-center shadow-sm border border-gray-200/80">
              <span className="text-3xl md:text-5xl font-extrabold text-brand-navy block mb-2">{stat.value}</span>
              <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-emerald">Why We Are Different</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-navy leading-tight">
              Crafted for Solo Explorers & Adventure Enthusiasts
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">
              We believe travel is not about ticking off locations—it is about the shared laughs over campfires, the adrenaline of cliff jumping into emerald rivers, and watching the sun rise over high Himalayan passes.
            </p>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">
              Every WanderLuxe trip is led by a certified expedition captain who ensures total safety while fostering a warm, friendly atmosphere for solo travelers and groups alike.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm font-bold text-brand-navy">
                <CheckCircle2 size={20} className="text-brand-emerald shrink-0" />
                <span>Handpicked 4-Star Accommodations & Verified Homestays</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-brand-navy">
                <CheckCircle2 size={20} className="text-brand-emerald shrink-0" />
                <span>Oxygen Cylinders & Medical First Aid on High Altitude Expeditions</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-brand-navy">
                <CheckCircle2 size={20} className="text-brand-emerald shrink-0" />
                <span>Zero Hidden Costs & Flexible 20% Booking Advance</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3]">
              <img
                src="https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg"
                alt="Meghalaya group travel"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-brand-navy text-white p-6 rounded-3xl shadow-xl hidden md:block max-w-xs border border-white/10">
              <Sparkles size={24} className="text-brand-emerald mb-2" />
              <p className="text-xs font-bold leading-relaxed">
                "We don't just organize trips; we create memories that stay with you forever."
              </p>
            </div>
          </div>
        </div>

        {/* Core Values Grid */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-brand-navy mb-4">Our Core Values</h2>
            <p className="text-gray-500 text-sm font-medium">Built on safety, authenticity, and passionate community leadership.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200/80 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 rounded-2xl bg-brand-emerald/10 flex items-center justify-center mb-6">
                  {v.icon}
                </div>
                <h3 className="text-lg font-bold text-brand-navy mb-3">{v.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed font-medium">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Expedition Captains / Team Section */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-emerald">Meet the Captains</span>
            <h2 className="text-3xl font-extrabold text-brand-navy mt-1 mb-4">The People Behind Your Journey</h2>
            <p className="text-gray-500 text-sm font-medium">Experienced mountain leads, culture guides, and safety experts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200/80 group hover:shadow-xl transition-all">
                <div className="h-64 overflow-hidden relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute bottom-3 right-3 bg-brand-navy/90 text-brand-emerald font-extrabold text-[11px] px-3 py-1 rounded-full backdrop-blur-sm">
                    {member.tripsLed}
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-bold text-brand-navy mb-1">{member.name}</h3>
                  <p className="text-xs font-semibold text-brand-emerald mb-3">{member.role}</p>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-teal rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to Experience the World with Us?</h2>
          <p className="text-white/80 text-sm md:text-base font-medium max-w-xl mx-auto mb-8">
            Join our upcoming Himalayan departures, Meghalaya backpacking trips, or tropical Bali escapes.
          </p>
          <Link
            to="/destinations"
            className="px-8 py-4 bg-white text-brand-navy font-extrabold rounded-2xl text-sm hover:bg-gray-100 transition-all inline-block shadow-lg"
          >
            Browse All Upcoming Trips
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
