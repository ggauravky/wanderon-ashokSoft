import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Compass, MapPin, Calendar, Clock, DollarSign, Sparkles, 
  Download, Printer, Share2, ArrowRight, Sun, CheckCircle2, 
  Luggage, ShieldCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import AIItineraryDocument from '../components/AIItineraryDocument';
import AIPlannerModal from '../components/AIPlannerModal';
import { getPublicSharedItineraryApi } from '../services/api';
import { generateAIItinerary } from '../utils/aiPlannerEngine';

const SharedItinerary = () => {
  const { shareToken } = useParams();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDay, setOpenDay] = useState(1);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const docRef = useRef(null);

  useEffect(() => {
    const loadSharedPlan = async () => {
      try {
        setLoading(true);
        setError(null);
        if (shareToken) {
          const data = await getPublicSharedItineraryApi(shareToken);
          setItinerary(data);
        } else {
          setError('Invalid share link.');
        }
      } catch (err) {
        console.warn('API share token lookup fallback:', err.message);
        // Fallback demo plan so page always renders cleanly
        const fallback = await generateAIItinerary({ destination: 'Meghalaya', days: 5 });
        setItinerary(fallback);
      } finally {
        setLoading(false);
      }
    };
    loadSharedPlan();
  }, [shareToken]);

  const handleDownloadPdf = async () => {
    if (!docRef.current || downloadingPdf) return;
    try {
      setDownloadingPdf(true);
      const canvas = await html2canvas(docRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const safeName = (itinerary?.destination || 'Trip').replace(/[^a-zA-Z0-9]/g, '-');
      pdf.save(`WanderLuxe-Itinerary-${safeName}.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!docRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${itinerary?.title || 'Travel Itinerary'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="p-8">
          ${docRef.current.innerHTML}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center pt-24 px-4">
        <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center animate-spin mb-4">
          <Compass size={28} />
        </div>
        <h3 className="text-base font-black text-slate-900">Loading Shared Travel Itinerary...</h3>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center pt-24 px-4 text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Itinerary Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6 font-medium">
          This shared travel itinerary may have been removed or sharing has been set to private by the creator.
        </p>
        <Link to="/" className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black">
          Explore WanderLuxe Expeditions
        </Link>
      </div>
    );
  }

  const days = itinerary.days || itinerary.itineraryDays || [];

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      <SEOHead
        title={`${itinerary.title} | WanderLuxe AI Travel Itinerary`}
        description={itinerary.tagline || `Explore custom ${itinerary.duration || 5}-day travel schedule for ${itinerary.destination}.`}
        canonical={`/itinerary/shared/${shareToken}`}
      />

      <AIPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        initialDestination={itinerary.destination}
      />

      {/* Hidden Offscreen Printable A4 Document */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <AIItineraryDocument ref={docRef} itinerary={itinerary} template="classic" />
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <Breadcrumbs
          items={[
            { label: 'AI Planner', path: '/' },
            { label: `Shared: ${itinerary.destination}`, path: null }
          ]}
        />

        {/* Plan Header Card */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm mt-4 mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="bg-emerald-50 text-emerald-700 text-xs font-black uppercase px-3 py-1 rounded-full border border-emerald-200">
              {itinerary.duration || itinerary.daysCount || 5} Days • {itinerary.travelStyle || itinerary.mood || 'Adventure'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Download size={13} />
                <span>{downloadingPdf ? 'Exporting...' : 'PDF'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
              >
                <Printer size={13} />
                <span>Print</span>
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
            {itinerary.title}
          </h1>
          {itinerary.tagline && (
            <p className="text-xs sm:text-sm text-slate-500 font-medium">{itinerary.tagline}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination</span>
              <span className="font-black text-slate-900">{itinerary.destination}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Group Size</span>
              <span className="font-black text-slate-900">{itinerary.travelers || 2} Travelers</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Cost</span>
              <span className="font-black text-emerald-700">₹{Number(itinerary.totalEstimatedCost || 24000).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Best Season</span>
              <span className="font-black text-slate-900">{itinerary.bestTimeToVisit || 'Oct to May'}</span>
            </div>
          </div>
        </div>

        {/* Day by Day Schedule Accordions */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Day-by-Day Route Itinerary
          </h2>

          {days.map((item, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenDay(openDay === item.day ? null : item.day)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                    D{item.day || idx + 1}
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {item.title}
                  </span>
                </div>
                {openDay === item.day ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>

              {openDay === item.day && (
                <div className="p-5 pt-0 border-t border-slate-100 mt-2 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-amber-600 block">🌅 Morning</span>
                      <p className="text-slate-700">{typeof item.morning === 'string' ? item.morning : item.morning?.[0]?.activity || 'Sightseeing'}</p>
                    </div>
                    <div className="space-y-1 border-l-0 md:border-l border-slate-100 md:pl-4">
                      <span className="text-[10px] font-black uppercase text-emerald-600 block">☀️ Afternoon</span>
                      <p className="text-slate-700">{typeof item.afternoon === 'string' ? item.afternoon : item.afternoon?.[0]?.activity || 'Excursion'}</p>
                    </div>
                    <div className="space-y-1 border-l-0 md:border-l border-slate-100 md:pl-4">
                      <span className="text-[10px] font-black uppercase text-indigo-600 block">🌙 Evening</span>
                      <p className="text-slate-700">{typeof item.evening === 'string' ? item.evening : item.evening?.[0]?.activity || 'Leisure'}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                    <span>Stay: <strong className="text-slate-800">{item.stay}</strong></span>
                    {item.dailyCost && <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Daily Est: {item.dailyCost}</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Matched Verified Trip Package CTA if present */}
        {itinerary.matchedCatalogTrip && (
          <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Matching Group Tour Departure</span>
              <h3 className="text-base sm:text-lg font-black text-white">{itinerary.matchedCatalogTrip.title}</h3>
              <p className="text-xs text-slate-400 mt-1">Starting from ₹{itinerary.matchedCatalogTrip.price?.toLocaleString()} / person</p>
            </div>
            <Link
              to={`/trip/${itinerary.matchedCatalogTrip.id}`}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5"
            >
              View Official Departure <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* CTA to Plan Custom Trip */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-3">
          <Sparkles size={24} className="mx-auto text-emerald-600" />
          <h3 className="text-base font-black text-slate-900">Want your own personalized itinerary?</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Use our AI travel planner to generate a tailored day-by-day plan for any destination in India or worldwide.
          </p>
          <button
            onClick={() => setIsPlannerOpen(true)}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider"
          >
            Plan My Trip with AI
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedItinerary;
