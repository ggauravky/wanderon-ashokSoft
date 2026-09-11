import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, ArrowRight, Check, Compass, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';

import PlannerHeroDiscovery from '../components/planner/PlannerHeroDiscovery';
import PlannerStepBasics from '../components/planner/PlannerStepBasics';
import PlannerStepStyle from '../components/planner/PlannerStepStyle';
import PlannerStepDetails from '../components/planner/PlannerStepDetails';
import PlannerLiveSummary from '../components/planner/PlannerLiveSummary';
import PlannerGeneratingScreen from '../components/planner/PlannerGeneratingScreen';

import AIItineraryWorkspace from '../components/workspace/AIItineraryWorkspace';

import { generateAIItinerary } from '../utils/aiPlannerEngine';
import * as apiService from '../services/api.js';

const getAIItineraryByIdApi = async (...args) => (apiService.getAIItineraryByIdApi || apiService.default?.getAIItineraryByIdApi)?.(...args);
const regenerateDayApi = async (...args) => (apiService.regenerateDayApi || apiService.default?.regenerateDayApi)?.(...args);

const AIPlannerPage = () => {
  const { planId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Page States: 'DISCOVERY' | 'WIZARD' | 'GENERATING' | 'WORKSPACE'
  const [viewState, setViewState] = useState('DISCOVERY');
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3

  // Core Form Data
  const [formData, setFormData] = useState({
    destination: searchParams.get('destination') || 'Meghalaya',
    origin: 'Lucknow',
    startDate: '',
    endDate: '',
    datesFlexible: true,
    flexibleMonth: 'October',
    duration: 5,
    travelers: { adults: 2, children: 0, infants: 0, seniors: 0 },
    tripType: 'Couple',
    pace: 'Balanced',
    interests: ['Nature', 'Photography'],
    budgetTier: 'Comfortable',
    budgetAmount: 45000,
    budgetLevel: 'Moderate',
    customPreferences: '',
    stayPreference: 'Comfortable Stays',
    transportPreference: 'Private vehicle',
    dietaryPreference: 'No preference',
    mobilityConstraints: [],
    mustInclude: [],
    avoid: [],
    existingReservations: ''
  });

  // Generated Plan State
  const [itinerary, setItinerary] = useState(null);
  const [regeneratingDayIdx, setRegeneratingDayIdx] = useState(null);
  const [generationError, setGenerationError] = useState(null);

  // If a planId was provided in the route, fetch it
  useEffect(() => {
    if (planId) {
      const loadPlan = async () => {
        try {
          const res = await getAIItineraryByIdApi(planId);
          if (res) {
            setItinerary(res);
            setViewState('WORKSPACE');
          }
        } catch (err) {
          console.warn('Failed to load plan by id:', err.message);
        }
      };
      loadPlan();
    }
  }, [planId]);

  const updateFormData = (patch) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  // Step Transitions
  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } else {
      handleCreateItinerary();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } else {
      setViewState('DISCOVERY');
    }
  };

  // Generate Itinerary Execution
  const handleCreateItinerary = async () => {
    setViewState('GENERATING');
    setGenerationError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const result = await generateAIItinerary({
        destination: formData.destination,
        days: formData.duration || 5,
        travelers: (formData.travelers?.adults || 2) + (formData.travelers?.children || 0),
        pace: formData.pace || 'Balanced',
        mood: formData.tripType || 'Adventure',
        budgetLevel: formData.budgetLevel || 'Moderate',
        customPreferences: formData.customPreferences || ''
      });

      if (result) {
        setItinerary(result);
        setViewState('WORKSPACE');
      } else {
        throw new Error('No itinerary returned.');
      }
    } catch (err) {
      console.error('Itinerary generation failure:', err);
      setGenerationError(err.message || 'Failed to synthesize travel itinerary.');
      setViewState('WIZARD');
    }
  };

  // Day Regeneration
  const handleRegenerateDay = async (dayNumber) => {
    setRegeneratingDayIdx(dayNumber);
    try {
      const regenerated = await regenerateDayApi({
        destination: itinerary?.destination || formData.destination,
        dayNumber: dayNumber,
        pace: itinerary?.pace || formData.pace,
        mood: itinerary?.travelStyle || formData.tripType
      });

      if (regenerated) {
        const updatedDays = (itinerary?.days || []).map((d) => (d.day === dayNumber ? regenerated : d));
        setItinerary((prev) => ({ ...prev, days: updatedDays, itineraryDays: updatedDays }));
      }
    } catch (err) {
      console.warn('Failed to regenerate day:', err.message);
    } finally {
      setRegeneratingDayIdx(null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light pt-20 pb-24 text-slate-800">
      <SEOHead
        title="AI Travel Planner & Custom Route Architect | WanderLuxe"
        description="Design intelligent, day-by-day travel itineraries in seconds with verified destination photos, smart routing, and conversational AI refinement."
        canonical="/plan"
      />

      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        {/* Breadcrumb Navigation */}
        <div className="py-3">
          <Breadcrumbs
            items={[
              { label: 'Home', path: '/' },
              { label: 'AI Planner 2.0', path: '/plan' },
              ...(viewState === 'WORKSPACE' ? [{ label: `${formData.destination} Expedition`, path: null }] : [])
            ]}
          />
        </div>

        {/* ================================================================= */}
        {/* VIEW 1: DISCOVERY HERO */}
        {/* ================================================================= */}
        {viewState === 'DISCOVERY' && (
          <PlannerHeroDiscovery
            onSelectDestination={(dest) => updateFormData({ destination: dest })}
            onStartWizard={() => {
              setViewState('WIZARD');
              setCurrentStep(1);
            }}
          />
        )}

        {/* ================================================================= */}
        {/* VIEW 2: PROGRESSIVE 3-STEP WIZARD */}
        {/* ================================================================= */}
        {viewState === 'WIZARD' && (
          <div className="space-y-6">
            {/* Wizard Step Progress Tracker */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>{currentStep === 1 ? 'Change Destination' : 'Back'}</span>
              </button>

              <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                        currentStep === s
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : currentStep > s
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {currentStep > s ? '✓' : s}
                    </div>
                    {s < 3 && <div className={`w-8 sm:w-12 h-0.5 ${currentStep > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                  </div>
                ))}
              </div>

              <span className="text-xs font-black text-slate-400">Step {currentStep} of 3</span>
            </div>

            {generationError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{generationError}</span>
              </div>
            )}

            {/* 2-Column Desktop Wizard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form Step Content (8 Cols on lg) */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <PlannerStepBasics formData={formData} updateFormData={updateFormData} />
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <PlannerStepStyle formData={formData} updateFormData={updateFormData} />
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <PlannerStepDetails formData={formData} updateFormData={updateFormData} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step Bottom Controls */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{currentStep === 3 ? 'CREATE MY ITINERARY' : 'CONTINUE'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>

              {/* Desktop Live Summary Rail (4 Cols on lg) */}
              <div className="hidden lg:block lg:col-span-4">
                <PlannerLiveSummary formData={formData} />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: CALM PROCESS GENERATION */}
        {/* ================================================================= */}
        {viewState === 'GENERATING' && (
          <PlannerGeneratingScreen destination={formData.destination} formData={formData} />
        )}

        {/* ================================================================= */}
        {/* VIEW 4: FULL-PAGE AI ITINERARY WORKSPACE */}
        {/* ================================================================= */}
        {viewState === 'WORKSPACE' && itinerary && (
          <AIItineraryWorkspace
            itinerary={itinerary}
            onEditPreferences={() => {
              setViewState('WIZARD');
              setCurrentStep(1);
            }}
            onRegenerateDay={handleRegenerateDay}
            regeneratingDayIdx={regeneratingDayIdx}
            onUpdateItinerary={setItinerary}
            userTargetBudget={formData.budgetAmount}
          />
        )}
      </div>
    </div>
  );
};

export default AIPlannerPage;
