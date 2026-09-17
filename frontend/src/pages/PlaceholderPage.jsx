import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, FileText, RefreshCw, HelpCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';

const PlaceholderPage = () => {
  const location = useLocation();
  const path = location.pathname.replace('/', '').toLowerCase();

  const getPageData = () => {
    switch (path) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          subtitle: 'How WanderLuxe protects your personal and payment data',
          icon: ShieldCheck,
          sections: [
            {
              heading: '1. Information We Collect',
              text: 'We collect your name, email address, phone number, government ID (when required for high-altitude trekking permits), and encrypted payment transaction references.'
            },
            {
              heading: '2. Payment Security & Encryption',
              text: 'All online transactions and advance deposits are processed through PCI-DSS Level 1 certified gateways (Razorpay). We do not store raw card numbers, CVVs, or banking credentials.'
            },
            {
              heading: '3. Data Sharing & Third Parties',
              text: 'Your details are shared only with certified local trip captains, forest departments for trekking permits, and emergency transport providers.'
            }
          ]
        };
      case 'terms':
        return {
          title: 'Terms of Service',
          subtitle: 'Rules and conditions governing group tours and expeditions',
          icon: FileText,
          sections: [
            {
              heading: '1. Group Tour Code of Conduct',
              text: 'WanderLuxe expeditions foster inclusive, friendly, and respectful group environments. Disruptive behavior, harassment, or non-compliance with safety instructions from trip captains may result in removal from the tour without refund.'
            },
            {
              heading: '2. Itinerary Changes & Unforeseen Events',
              text: 'Himalayan and rainforest expeditions may experience sudden weather shifts, road closures, or landslides. In such events, certified captains have full authority to reroute itineraries for traveler safety.'
            },
            {
              heading: '3. Medical Fitness & Personal Responsibility',
              text: 'Travelers are responsible for assessing their physical fitness for trekking itineraries (e.g. Spiti Valley or Double Decker Root Bridge). First-aid kits are carried on all trips.'
            }
          ]
        };
      case 'cancellation':
        return {
          title: 'Cancellation & Refund Policy',
          subtitle: 'Transparent policies for cancellations, rollovers, and refunds',
          icon: RefreshCw,
          sections: [
            {
              heading: '1. 15+ Days Before Departure',
              text: 'Receive 100% full refund credit voucher or transfer your reservation to any future scheduled batch without any rebooking penalty.'
            },
            {
              heading: '2. 7 to 14 Days Before Departure',
              text: '50% refund credit voucher or 70% rollover credit to another expedition within 12 months.'
            },
            {
              heading: '3. Less Than 7 Days Before Departure',
              text: 'Due to advance resort reservations, permits, and private vehicle bookings, cancellations within 7 days of departure are non-refundable. However, you may transfer your seat to a friend.'
            }
          ]
        };
      default:
        return {
          title: 'Frequently Asked Questions',
          subtitle: 'Everything you need to know about traveling with WanderLuxe',
          icon: HelpCircle,
          sections: [
            {
              heading: 'Are WanderLuxe trips safe for solo female travelers?',
              text: 'Yes! More than 60% of our travelers join solo, with a high proportion of female adventurers. Our captains ensure safe, separate hotel rooms and respectful camaraderie.'
            },
            {
              heading: 'What is the average group size?',
              text: 'We maintain small, curated groups of 10 to 14 travelers to ensure personal attention, flexible stops, and genuine bonding.'
            },
            {
              heading: 'How do I receive my booking voucher and QR code?',
              text: 'Immediately upon completing your test payment or advance checkout, an official QR-coded Boarding Pass is generated in your Profile and sent to your email.'
            }
          ]
        };
    }
  };

  const data = getPageData();
  const IconComponent = data.icon;

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-20">
      <SEOHead
        title={`${data.title} | WanderLuxe Travels`}
        description={`${data.title} for WanderLuxe group expeditions, tour packages, and travel booking.`}
        canonical={`/${path}`}
      />

      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <Breadcrumbs items={[{ name: data.title, path: `/${path}` }]} />

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200/80 space-y-8">
          <div className="text-center space-y-3 pb-6 border-b border-slate-100">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <IconComponent size={28} />
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900">{data.title}</h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium max-w-md mx-auto">{data.subtitle}</p>
          </div>

          <div className="space-y-6">
            {data.sections.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  {s.heading}
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed pl-6">
                  {s.text}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-black text-slate-700 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Homepage
            </Link>
            <Link
              to="/contact"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
