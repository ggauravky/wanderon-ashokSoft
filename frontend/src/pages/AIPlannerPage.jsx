import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import SEOHead from '../components/SEOHead';
import PlannerExpeditionHeader from '../components/planner/PlannerExpeditionHeader';
import PlannerExpeditionFooter from '../components/planner/PlannerExpeditionFooter';

import PlannerHeroDiscovery from '../components/planner/PlannerHeroDiscovery';
import PlannerStepBasics from '../components/planner/PlannerStepBasics';
import PlannerStepProfileInterests from '../components/planner/PlannerStepProfileInterests';
import PlannerStepTransitPace from '../components/planner/PlannerStepTransitPace';
import PlannerStepHospitalityDining from '../components/planner/PlannerStepHospitalityDining';
import PlannerStepComfortBudget from '../components/planner/PlannerStepComfortBudget';
import PlannerStepBookTransmit from '../components/planner/PlannerStepBookTransmit';
import PlannerStepSuccessDispatch from '../components/planner/PlannerStepSuccessDispatch';

import PlannerLiveSummary from '../components/planner/PlannerLiveSummary';
import AIItineraryWorkspace from '../components/workspace/AIItineraryWorkspace';

import { generateAIItinerary, extractTripInfoFromPrompt } from '../utils/aiPlannerEngine';
import { getAIItineraryByIdApi } from '../services/api.js';

const buildPlannerContext = (data = {}) => ({
  origin: data.origin || '',
  startDate: data.startDate || '',
  endDate: data.endDate || '',
  datesFlexible: data.datesFlexible !== false,
  flexibleMonth: data.flexibleMonth || '',
  travelersBreakdown: {
    adults: Number(data.travelers?.adults || 0),
    children: Number(data.travelers?.children || 0),
    infants: Number(data.travelers?.infants || 0),
    seniors: Number(data.travelers?.seniors || 0)
  },
  tripType: data.tripType || '',
  paceRhythm: data.paceRhythm || '',
  acclimatization: data.acclimatization || '',
  interests: Array.isArray(data.interests) ? data.interests : [],
  stayPreference: data.stayPreference || '',
  roomStyle: data.roomStyle || '',
  dietaryPreference: data.dietaryPreference || '',
  hotelRating: data.hotelRating || null,
  budgetTier: data.budgetTier || '',
  budgetAmount: data.budgetAmount || null,
  transportPreference: data.transportPreference || data.transitMode || '',
  mobilityConstraints: Array.isArray(data.mobilityConstraints) ? data.mobilityConstraints : [],
  mustInclude: Array.isArray(data.mustInclude) ? data.mustInclude : [],
  avoid: Array.isArray(data.avoid) ? data.avoid : [],
  customPreferences: data.customPreferences || ''
});

const AIPlannerPage = () => {
  const { planId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlPrompt = searchParams.get('prompt') || searchParams.get('q') || '';
  const urlDest = searchParams.get('destination') || '';

  // Primary Views: 'DISCOVERY' | 'WIZARD' | 'GENERATING' | 'WORKSPACE' | 'SUCCESS_DISPATCH'
  const [viewState, setViewState] = useState((urlPrompt || urlDest) ? 'WORKSPACE' : 'DISCOVERY');
  // Wizard Steps: 2 (Profile/Interests) | 3 (Transit/Pace) | 4 (Stays/Dining) | 5 (Comfort/Budget) | 6 (Book/Transmit)
  const [currentStep, setCurrentStep] = useState(2);
  const [activeHeaderTab, setActiveHeaderTab] = useState('Overview');
  const [workspaceTab, setWorkspaceTab] = useState('overview');
  const [missingFields, setMissingFields] = useState([]);
  const [initialPromptText, setInitialPromptText] = useState(urlPrompt);

  // Form State
  const [formData, setFormData] = useState(() => {
    if (urlPrompt) {
      const parsed = extractTripInfoFromPrompt(urlPrompt);
      return {
        destination: parsed.destination || 'Spiti Valley',
        origin: 'Delhi NCR',
        startDate: '',
        endDate: '',
        datesFlexible: true,
        flexibleMonth: parsed.flexibleMonth || 'July 2026',
        duration: parsed.duration || 7,
        travelers: parsed.travelers || { adults: 2, children: 0, infants: 0, seniors: 0 },
        tripType: parsed.tripType || 'Couple',
        pace: parsed.pace || 'Balanced',
        paceRhythm: parsed.paceRhythm || 'Chill Starts (9:00 AM)',
        acclimatization: 'Keep it Gentle',
        interests: parsed.interests?.length ? parsed.interests : ['monasteries', 'stargazing', 'photography'],
        stayPreference: parsed.stayPreference || 'Homestay 🏡',
        roomStyle: 'Double Bed',
        dietaryPreference: 'Vegetarian',
        hotelRating: 4,
        budgetTier: parsed.budgetTier || 'Comfort',
        budgetAmount: parsed.budgetAmount || 45000,
        budgetLevel: parsed.budgetLevel || 'Moderate',
        customPreferences: urlPrompt,
        fullName: '',
        email: '',
        whatsappNumber: ''
      };
    }
    return {
      destination: urlDest || 'Spiti Valley',
      origin: 'Delhi NCR',
      startDate: '',
      endDate: '',
      datesFlexible: true,
      flexibleMonth: 'July 2026',
      duration: 7,
      travelers: { adults: 2, children: 0, infants: 0, seniors: 0 },
      tripType: 'Couple',
      pace: 'Balanced',
      paceRhythm: 'Chill Starts (9:00 AM)',
      acclimatization: 'Keep it Gentle',
      interests: ['monasteries', 'stargazing', 'photography'],
      stayPreference: 'Homestay 🏡',
      roomStyle: 'Double Bed',
      dietaryPreference: 'Vegetarian',
      hotelRating: 4,
      budgetTier: 'Comfort',
      budgetAmount: 45000,
      budgetLevel: 'Moderate',
      customPreferences: '',
      fullName: '',
      email: '',
      whatsappNumber: ''
    };
  });

  const [itinerary, setItinerary] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  const [isGeneratingOverview, setIsGeneratingOverview] = useState(false);

  // Auto-generate if prompt or destination param is present on mount
  useEffect(() => {
    const promptParam = searchParams.get('prompt') || searchParams.get('q');
    const destParam = searchParams.get('destination');
    if (!planId) {
      if (promptParam) {
        setInitialPromptText(promptParam);
        const parsed = extractTripInfoFromPrompt(promptParam);
        const initData = {
          ...formData,
          destination: parsed.destination || formData.destination,
          duration: parsed.duration || formData.duration,
          travelers: parsed.travelers || formData.travelers,
          tripType: parsed.tripType || formData.tripType,
          flexibleMonth: parsed.flexibleMonth || formData.flexibleMonth,
          budgetTier: parsed.budgetTier || formData.budgetTier,
          budgetAmount: parsed.budgetAmount || formData.budgetAmount,
          budgetLevel: parsed.budgetLevel || formData.budgetLevel,
          stayPreference: parsed.stayPreference || formData.stayPreference,
          interests: parsed.interests?.length ? parsed.interests : formData.interests,
          pace: parsed.pace || formData.pace,
          customPreferences: promptParam
        };
        setFormData(initData);
        setMissingFields(parsed.missingFields || []);
        handleQuickGenerateOverview('overview', initData);
      } else if (destParam) {
        const initData = { ...formData, destination: destParam };
        setFormData(initData);
        handleQuickGenerateOverview('overview', initData);
      }
    }
  }, [searchParams, planId]);

  // Load existing plan if planId is provided
  useEffect(() => {
    if (planId) {
      const loadPlan = async () => {
        try {
          const res = await getAIItineraryByIdApi(planId);
          if (res) {
            setItinerary(res);
            setViewState('WORKSPACE');
            setActiveHeaderTab('Overview');
          }
        } catch (err) {
          console.warn('Failed to load plan by id:', err.message);
        }
      };
      loadPlan();
    }
  }, [planId]);

  // Sync header tab based on current step or view
  useEffect(() => {
    if (viewState === 'WORKSPACE') {
      setActiveHeaderTab(workspaceTab === 'story' ? 'Story' : 'Overview');
    } else if (viewState === 'SUCCESS_DISPATCH') {
      setActiveHeaderTab('Book');
    } else if (viewState === 'WIZARD') {
      if (currentStep === 2 || currentStep === 3) setActiveHeaderTab('Vibe');
      else if (currentStep === 4 || currentStep === 5) setActiveHeaderTab('Stays');
      else if (currentStep === 6) setActiveHeaderTab('Book');
      else setActiveHeaderTab('Overview');
    }
  }, [viewState, currentStep, workspaceTab]);

  const updateFormData = (patch) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  // Header Tab Switching
  const handleHeaderTabClick = (tabId) => {
    setActiveHeaderTab(tabId);
    if (tabId === 'Overview') {
      setWorkspaceTab('overview');
      if (!itinerary || itinerary.destination !== formData.destination || itinerary.duration !== formData.duration) {
        handleQuickGenerateOverview('overview');
      } else {
        setViewState('WORKSPACE');
      }
    } else if (tabId === 'Vibe') {
      setViewState('WIZARD');
      setCurrentStep(2);
    } else if (tabId === 'Stays') {
      setViewState('WIZARD');
      setCurrentStep(4);
    } else if (tabId === 'Story') {
      setWorkspaceTab('story');
      if (!itinerary || itinerary.destination !== formData.destination || itinerary.duration !== formData.duration) {
        handleQuickGenerateOverview('story');
      } else {
        setViewState('WORKSPACE');
      }
    } else if (tabId === 'Book') {
      setViewState('WIZARD');
      setCurrentStep(6);
    }
  };

  // Fast synthesis of Overview Workspace
  const handleQuickGenerateOverview = async (targetTab = 'overview', overrideData = null) => {
    const dataToUse = overrideData || formData;
    setIsGeneratingOverview(true);
    setGenerationError(null);
    try {
      const totalTravelers = (dataToUse.travelers?.adults || 2) + 
                             (dataToUse.travelers?.children || 0) + 
                             (dataToUse.travelers?.infants || 0) + 
                             (dataToUse.travelers?.seniors || 0);

      const result = await generateAIItinerary({
        origin: dataToUse.origin || '',
        destination: dataToUse.destination,
        days: dataToUse.duration || 7,
        duration: dataToUse.duration || 7,
        travelers: totalTravelers,
        travelersBreakdown: dataToUse.travelers || {},
        pace: dataToUse.pace || 'Balanced',
        mood: dataToUse.tripType || 'Adventure',
        budgetLevel: dataToUse.budgetLevel || 'Moderate',
        budgetAmount: dataToUse.budgetAmount || null,
        interests: dataToUse.interests || [],
        dietary: dataToUse.dietaryPreference ? [dataToUse.dietaryPreference] : [],
        stayPreference: dataToUse.stayPreference || '',
        transportPreference: dataToUse.transportPreference || dataToUse.transitMode || '',
        mobilityConstraints: dataToUse.mobilityConstraints || [],
        mustInclude: dataToUse.mustInclude || [],
        avoid: dataToUse.avoid || [],
        customPreferences: dataToUse.customPreferences || '',
        plannerContext: buildPlannerContext(dataToUse)
      });

      if (result) {
        setItinerary({ ...result, plannerContext: result.plannerContext || buildPlannerContext(dataToUse) });
        setWorkspaceTab(targetTab);
        setViewState('WORKSPACE');
        setActiveHeaderTab(targetTab === 'story' ? 'Story' : 'Overview');
      }
    } catch (e) {
      console.warn('Overview generation note:', e);
      setGenerationError(e.message || 'We could not safely save your AI plan. Please retry generation.');
    } finally {
      setIsGeneratingOverview(false);
    }
  };

  // Handle conversational prompt submit
  const handlePromptSubmit = async (parsedData) => {
    const updated = {
      ...formData,
      destination: parsedData.destination || formData.destination,
      duration: parsedData.duration || formData.duration,
      travelers: parsedData.travelers || formData.travelers,
      tripType: parsedData.tripType || formData.tripType,
      flexibleMonth: parsedData.flexibleMonth || formData.flexibleMonth,
      budgetTier: parsedData.budgetTier || formData.budgetTier,
      budgetAmount: parsedData.budgetAmount || formData.budgetAmount,
      budgetLevel: parsedData.budgetLevel || formData.budgetLevel,
      stayPreference: parsedData.stayPreference || formData.stayPreference,
      interests: parsedData.interests?.length ? parsedData.interests : formData.interests,
      pace: parsedData.pace || formData.pace
    };
    setFormData(updated);
    setMissingFields(parsedData.missingFields || []);
    if (updated.destination) {
      navigate(`?destination=${encodeURIComponent(updated.destination)}`, { replace: true });
    }
    await handleQuickGenerateOverview('overview', updated);
  };

  // Step Navigation
  const handleNextStep = async () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 80, behavior: 'smooth' });
    } else if (currentStep === 5) {
      // Completed Stays, Dining & Budget -> Redirect to Story Chronicle first!
      await handleQuickGenerateOverview('story');
    } else {
      setViewState('SUCCESS_DISPATCH');
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 2) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 80, behavior: 'smooth' });
    } else {
      setViewState('WORKSPACE');
      setWorkspaceTab('overview');
    }
  };

  // Handle duration change from Overview days selector — full re-generation
  const handleRegenerateWithDuration = async (newDuration) => {
    const durNum = Math.max(1, Math.min(Number(newDuration) || 7, 30));
    const updated = { ...formData, duration: durNum, durationExplicit: true };
    setFormData(updated);
    setItinerary((prev) => (prev ? {
      ...prev,
      duration: durNum,
      daysCount: durNum
    } : null));
    await handleQuickGenerateOverview('overview', updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      <SEOHead
        title={`Nomad${formData.destination.replace(/\s+/g, '')} | AI Expedition & High-Altitude Circuit Architect`}
        description={`Design intelligent, vetted, day-by-day travel itineraries in seconds across high passes with verified photos and smart routing.`}
        canonical="/plan"
      />

      {/* 1. Global Nomad Expedition Header */}
      <PlannerExpeditionHeader
        activeTab={activeHeaderTab}
        destination={formData.destination}
        onTabClick={handleHeaderTabClick}
      />

      {/* 2. Main Page Content Container */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-6 pb-16 grow">
        {generationError && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{generationError}</span>
          </div>
        )}
        {/* ================================================================= */}
        {/* VIEW 1: CONVERSATIONAL PROMPT DISCOVERY HERO */}
        {/* ================================================================= */}
        {viewState === 'DISCOVERY' && (
          <PlannerHeroDiscovery
            initialPrompt={initialPromptText}
            onSelectDestination={(dest) => updateFormData({ destination: dest })}
            onPromptSubmit={handlePromptSubmit}
            onStartWizard={handlePromptSubmit}
          />
        )}

        {/* ================================================================= */}
        {/* VIEW 2: PROGRESSIVE 6-STEP EXPEDITION WIZARD */}
        {/* ================================================================= */}
        {viewState === 'WIZARD' && (
          <div className="space-y-6">
            {/* Wizard Step Progress Tracker */}
            {currentStep <= 5 && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>{currentStep === 2 ? 'Back to Overview' : 'Previous Step'}</span>
                </button>

                <div className="flex items-center gap-2">
                  {[
                    { step: 2, label: 'Vibe' },
                    { step: 3, label: 'Transit' },
                    { step: 4, label: 'Stays' },
                    { step: 5, label: 'Budget' }
                  ].map((s, idx) => (
                    <div key={s.step} className="flex items-center gap-2">
                      <div
                        onClick={() => setCurrentStep(s.step)}
                        className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-black transition-all cursor-pointer ${
                          currentStep === s.step
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : currentStep > s.step
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <span>{currentStep > s.step ? '✓' : idx + 1}.</span>
                        <span>{s.label}</span>
                      </div>
                      {idx < 3 && (
                        <div className={`w-4 sm:w-8 h-0.5 ${currentStep > s.step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  ))}
                </div>

                <span className="text-xs font-black text-slate-400 hidden sm:inline">Personalization</span>
              </div>
            )}

            {/* If Step 6 (Book & Transmit), Render Full-Width Form (Image 6) */}
            {currentStep === 6 ? (
              <PlannerStepBookTransmit
                formData={formData}
                updateFormData={updateFormData}
                destination={formData.destination}
                itinerary={itinerary}
                plannerContext={buildPlannerContext(formData)}
                onItinerarySaved={setItinerary}
                onTransmitSuccess={() => setViewState('SUCCESS_DISPATCH')}
              />
            ) : (
              /* Steps 1 to 5: 2-Column Split with Live Summary Rail */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Form Step Content (8 Cols on lg) */}
                <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <PlannerStepBasics formData={formData} updateFormData={updateFormData} />
                      </motion.div>
                    )}

                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <PlannerStepProfileInterests
                          formData={formData}
                          updateFormData={updateFormData}
                          destination={formData.destination}
                        />
                      </motion.div>
                    )}

                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <PlannerStepTransitPace
                          formData={formData}
                          updateFormData={updateFormData}
                          destination={formData.destination}
                        />
                      </motion.div>
                    )}

                    {currentStep === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <PlannerStepHospitalityDining
                          formData={formData}
                          updateFormData={updateFormData}
                          destination={formData.destination}
                        />
                      </motion.div>
                    )}

                    {currentStep === 5 && (
                      <motion.div
                        key="step5"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <PlannerStepComfortBudget
                          formData={formData}
                          updateFormData={updateFormData}
                          destination={formData.destination}
                        />
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
                      disabled={isGeneratingOverview}
                      className="px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span>
                        {isGeneratingOverview
                          ? 'Generating Story Chronicle...'
                          : currentStep === 1
                          ? `Explore & View ${formData.destination || 'Destination'} Overview`
                          : currentStep === 2
                          ? 'Next: Transit & Rhythm'
                          : currentStep === 3
                          ? 'Next: Stays & Food Dining'
                          : currentStep === 4
                          ? 'Next: Budget & Comfort'
                          : currentStep === 5
                          ? 'Explore Story & Confirm Booking →'
                          : 'Continue'}
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>

                {/* Desktop Live Side-Story Summary Rail (4 Cols on lg) */}
                <div className="hidden lg:block lg:col-span-4">
                  <PlannerLiveSummary formData={formData} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: DISPATCH CONFIRMATION (Image 7) */}
        {/* ================================================================= */}
        {viewState === 'SUCCESS_DISPATCH' && (
          <PlannerStepSuccessDispatch
            formData={formData}
            destination={formData.destination}
            onReset={() => {
              setViewState('WIZARD');
              setCurrentStep(1);
            }}
            onViewOverview={handleQuickGenerateOverview}
          />
        )}

        {/* ================================================================= */}
        {/* VIEW 4: FULL-PAGE EXPEDITION ITINERARY OVERVIEW WORKSPACE (Image 1) */}
        {/* ================================================================= */}
        {viewState === 'WORKSPACE' && itinerary && (
          <AIItineraryWorkspace
            itinerary={itinerary}
            activeTab={workspaceTab}
            formData={formData}
            updateFormData={updateFormData}
            missingFields={missingFields}
            onTabChange={(tab) => {
              setWorkspaceTab(tab);
              if (tab === 'story') setActiveHeaderTab('Story');
              else if (tab === 'overview') setActiveHeaderTab('Overview');
            }}
            onEditPreferences={() => {
              setViewState('WIZARD');
              setCurrentStep(2);
            }}
            onCustomize={() => {
              setViewState('WIZARD');
              setCurrentStep(2);
            }}
            onReserve={() => {
              setViewState('WIZARD');
              setCurrentStep(6);
            }}
            onUpdateItinerary={setItinerary}
            userTargetBudget={formData.budgetAmount}
            onRegenerate={handleRegenerateWithDuration}
          />
        )}
      </main>

      {/* 3. Global Status Footer */}
      <PlannerExpeditionFooter destination={formData.destination} />
    </div>
  );
};

export default AIPlannerPage;
