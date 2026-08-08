import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Contact = () => {
  const [name, setName] = useState('Gaurav Kumar Yadav');
  const [email, setEmail] = useState('kumar.gaurav.yadav2007@gmail.com');
  const [phone, setPhone] = useState('8542036499');
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
      a: 'Free cancellation up to 15 days before departure with 100% refund. Cancellations between 7-14 days get a credit voucher valid for 1 year.'
    },
    {
      q: 'Do you organize private or corporate custom trips?',
      a: 'Yes! We specialize in custom itineraries for private groups, honeymoons, family vacations, and corporate retreats.'
    }
  ];

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      {/* Floating WhatsApp CTA */}
      <a
        href="https://wa.me/918542036499"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2 font-bold text-xs"
      >
        <MessageSquare size={22} />
        <span className="hidden md:inline">Chat on WhatsApp</span>
      </a>

      <div className="container mx-auto px-4 md:px-8">
        {/* Banner */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="bg-brand-emerald/10 text-brand-emerald text-xs font-extrabold px-3.5 py-1.5 rounded-full inline-block mb-3 border border-brand-emerald/20">
            We're Here to Help
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-brand-navy mb-4">
            Get in Touch with Our Travel Captains
          </h1>
          <p className="text-gray-600 text-sm font-medium">
            Have questions about an upcoming departure or need a customized itinerary? Send us a message and our team will get back to you within 2 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
          {/* Left Column: Direct Info & Offices */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 space-y-5">
              <h2 className="text-lg font-bold text-brand-navy border-b border-gray-100 pb-3">Direct Contact Details</h2>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block">Call Support</span>
                  <p className="font-extrabold text-brand-navy text-sm">+91 8542036499</p>
                  <p className="text-[11px] text-gray-400">Mon - Sat (10:00 AM - 8:00 PM IST)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block">Email Inquiries</span>
                  <p className="font-extrabold text-brand-navy text-sm">kumar.gaurav.yadav2007@gmail.com</p>
                  <p className="text-[11px] text-gray-400">Response within 2 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block">Headquarters Address</span>
                  <p className="font-bold text-brand-navy text-xs leading-relaxed">
                    Lucknow, UP, India
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-brand-navy text-white rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-3">
              <Sparkles size={24} className="text-brand-emerald" />
              <h3 className="font-bold text-lg">Looking for a Private Group Trip?</h3>
              <p className="text-xs text-white/80 leading-relaxed">
                We design custom honeymoons, corporate offsites, and college reunions with private transport and dedicated guides.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200/80">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={36} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-brand-navy">Message Received!</h2>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Thank you, <span className="font-bold text-brand-navy">{name}</span>. One of our trip captains will contact you shortly on <span className="font-bold text-brand-navy">{phone || email}</span>.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 bg-brand-navy text-white rounded-2xl text-xs font-bold"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-2xl font-bold text-brand-navy mb-4">Send Us a Message</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-1.5">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Gaurav Kumar Yadav"
                        className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="kumar.gaurav.yadav2007@gmail.com"
                        className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-1.5">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="8542036499"
                        className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-1.5">
                        Inquiry Topic
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
                      >
                        <option value="Custom Trip Inquiry">Custom Trip / Private Departure</option>
                        <option value="Booking Query">Booking & Payment Query</option>
                        <option value="Corporate Offsite">Corporate Offsite Request</option>
                        <option value="Partnership">Media & Partnership</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-1.5">
                      Message / Special Requirements
                    </label>
                    <textarea
                      rows="4"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your preferred destination, travel dates, and group size..."
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-emerald"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-brand-emerald text-white font-extrabold rounded-2xl hover:bg-brand-teal transition-all shadow-xl shadow-brand-emerald/20 flex items-center justify-center gap-2"
                  >
                    <Send size={18} /> Send Inquiry Now
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200/80 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-brand-navy mb-6 text-center">Frequently Asked Questions</h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-4 text-left font-bold text-brand-navy text-sm md:text-base flex justify-between items-center bg-gray-50/50 hover:bg-gray-50"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-brand-emerald shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="p-4 bg-white text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
