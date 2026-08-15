import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { getFAQSchema } from '../utils/seoSchemas';
import { useAuth } from '../contexts/AuthContext';

const Contact = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [subject, setSubject] = useState('Custom Trip Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  const faqs = [
    {
      q: 'How do I confirm my booking?',
      a: 'You can confirm your slot by paying a 20% advance via our checkout page. Once payment is completed, an E-Ticket voucher is instantly issued.'
    },
    {
      q: 'Can solo travelers join group departures?',
      a: 'Absolutely! Over 60% of our community members are solo travelers. We match you with same-gender room partners or offer single occupancy options.'
    },
    {
      q: 'What is your cancellation & refund policy?',
      a: 'Cancellations made 15 days prior to departure receive 100% full credit refund or free seat rollover to any future departure date.'
    }
  ];

  const faqSchema = getFAQSchema(faqs);

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      <SEOHead
        title="Contact WanderLuxe | Custom Trip Planner & Concierge Support"
        description="Contact WanderLuxe travel concierges. Book custom private group trips, ask departure questions, or request custom itineraries."
        canonical="/contact"
        jsonLd={faqSchema}
      />

      <div className="container mx-auto px-4 md:px-8">
        <Breadcrumbs items={[{ name: 'Contact Concierge', path: '/contact' }]} />

        {/* Hero Section */}
        <div className="bg-brand-navy rounded-3xl p-8 md:p-12 text-white mb-12 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-80 h-80 bg-brand-emerald opacity-20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-extrabold text-brand-emerald inline-block mb-4 border border-white/10">
              24/7 Concierge & Custom Trips
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              We'd Love to Hear From You
            </h1>
            <p className="text-white/80 text-sm md:text-base font-medium">
              Have questions about an upcoming group trip or want to build a custom private itinerary? Our travel captains are ready to help.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Contact Cards */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80 space-y-4">
              <div className="w-12 h-12 bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-brand-navy">Headquarters</h3>
                <p className="text-gray-500 text-xs font-medium mt-1">WanderLuxe Travels HQ, Lucknow, Uttar Pradesh, India</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80 space-y-4">
              <div className="w-12 h-12 bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-brand-navy">Phone / WhatsApp</h3>
                <p className="text-gray-500 text-xs font-medium mt-1">+91 8542036499 (Mon - Sun, 9am - 9pm)</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80 space-y-4">
              <div className="w-12 h-12 bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-brand-navy">Email Support</h3>
                <p className="text-gray-500 text-xs font-medium mt-1">kumar.gaurav.yadav2007@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact & Custom Trip Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200/80">
              <h2 className="text-2xl font-extrabold text-brand-navy mb-2">Send Us a Message</h2>
              <p className="text-gray-500 text-xs font-medium mb-6">Fill in your details below and our expedition team will contact you within 2 hours.</p>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-6 text-center space-y-2">
                  <CheckCircle2 size={40} className="text-emerald-600 mx-auto" />
                  <h3 className="text-lg font-bold">Message Received!</h3>
                  <p className="text-xs text-emerald-800 font-medium">Thank you {name}. Our trip captain will reach out to you shortly at {phone}.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Your Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Gaurav Kumar Yadav"
                        className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-emerald text-brand-navy"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="kumar.gaurav.yadav2007@gmail.com"
                        className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-emerald text-brand-navy"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Phone / WhatsApp</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="8542036499"
                        className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-emerald text-brand-navy"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Inquiry Subject</label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy"
                      >
                        <option value="Custom Trip Inquiry">Custom Private Trip Inquiry</option>
                        <option value="Upcoming Group Departure">Upcoming Group Departure Question</option>
                        <option value="Corporate / Campus Booking">Corporate / Campus Booking</option>
                        <option value="Influencer Collaboration">Influencer Collaboration</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Your Message or Custom Itinerary Request</label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us your destination preferences, dates, and group size..."
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-brand-emerald text-brand-navy"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-brand-emerald text-white rounded-2xl font-extrabold text-sm hover:bg-brand-teal transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    Send Message to Captains <Send size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
