import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Compass, HeartHandshake, Users, Award, 
  Sparkles, CheckCircle2, ArrowRight, Globe, Mountain, MapPin 
} from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { getOrganizationSchema } from '../utils/seoSchemas';
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
      title: 'Community First Culture',
      desc: 'Screened small-group departures designed for meaningful conversations, lifelong friendships, and inclusive vibes.'
    },
    {
      icon: <Award size={32} className="text-brand-emerald" />,
      title: 'Luxury at Accessibility',
      desc: 'Boutique stays, private transfers, and top-tier hospitality available with flexible 0% No-Cost EMI plans.'
    }
  ];

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      <SEOHead
        title="About WanderLuxe | India's #1 Luxury Group Travel Community"
        description="Learn about WanderLuxe Travels. Over 50,000+ happy travelers, certified captains, boutique stays, and curated group expeditions."
        canonical="/about"
        jsonLd={getOrganizationSchema()}
      />

      <div className="container mx-auto px-4 md:px-8">
        <Breadcrumbs items={[{ name: 'About Us', path: '/about' }]} />

        {/* Hero Banner */}
        <div className="bg-brand-navy rounded-3xl p-8 md:p-16 text-white mb-16 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-brand-emerald opacity-15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-extrabold text-brand-emerald inline-block border border-white/10">
              Redefining Modern Travel
            </span>
            <h1 className="text-3xl md:text-6xl font-extrabold leading-tight">
              We Craft Extraordinary Journeys for Curious Souls
            </h1>
            <p className="text-white/80 text-sm md:text-lg font-medium leading-relaxed">
              WanderLuxe was born out of a passion to bridge authentic local exploration with luxury comfort. We build small-group expeditions led by certified captains who care as much about safety as unforgettable moments.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200/80 text-center space-y-2">
              <h2 className="text-3xl md:text-5xl font-extrabold text-brand-emerald">{stat.value}</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Core Values */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-emerald">Our Core Pillars</span>
            <h2 className="text-3xl font-extrabold text-brand-navy mt-1">Why 50,000+ Adventurers Travel With Us</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200/80 text-center space-y-4 hover:shadow-lg transition-all">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                  {v.icon}
                </div>
                <h3 className="text-xl font-extrabold text-brand-navy">{v.title}</h3>
                <p className="text-gray-500 text-xs font-medium leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Leadership Team */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200/80">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-emerald">The Expedition Leaders</span>
            <h2 className="text-3xl font-extrabold text-brand-navy mt-1">Meet Our Founder & Captains</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.id} className="text-center space-y-4 p-6 bg-brand-light rounded-2xl border border-gray-200">
                <img src={member.image || member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'} alt={member.name} className="w-24 h-24 rounded-full object-cover border-2 border-brand-emerald mx-auto shadow-md" />
                <div>
                  <h3 className="text-lg font-extrabold text-brand-navy">{member.name}</h3>
                  <p className="text-xs font-bold text-brand-emerald">{member.role}</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
