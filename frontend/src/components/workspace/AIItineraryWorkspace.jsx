import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Share2, Download, Sliders, Check, BookmarkCheck, FileText, ChevronDown, Copy
} from 'lucide-react';
import WorkspaceOverviewTab from './WorkspaceOverviewTab';
import WorkspaceStoryTab from './WorkspaceStoryTab';
import WorkspaceItineraryTab from './WorkspaceItineraryTab';
import WorkspaceMapTab from './WorkspaceMapTab';
import WorkspaceBudgetTab from './WorkspaceBudgetTab';
import ShareItineraryModal from '../ShareItineraryModal';
import AIItineraryDocument from '../AIItineraryDocument';
import { exportElementToPdf } from '../../utils/pdfGenerator';
import { saveAIItineraryApi, updateAIItineraryApi } from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { buildQuotationReadyExport } from '../../staff/modules/sales/quotations/quotationSmartBuilder.js';
import { mergeSavedItinerary } from '../../utils/itineraryAuthorization.js';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'story', label: 'Story & Narrative' },
  { id: 'itinerary', label: 'Daily Schedule' },
  { id: 'map', label: 'Route Map' },
  { id: 'budget', label: 'Budget' }
];

const AIItineraryWorkspace = ({
  itinerary,
  initialTab = 'overview',
  activeTab: controlledActiveTab,
  onTabChange,
  onEditPreferences,
  onCustomize,
  onReserve,
  onRegenerateDay,
  regeneratingDayIdx,
  onUpdateItinerary,
  userTargetBudget,
  formData = {},
  updateFormData,
  missingFields = [],
  onRegenerate
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(initialTab || 'overview');
  const activeTab = controlledActiveTab || internalActiveTab;

  const handleTabClick = (tabId) => {
    setInternalActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  useEffect(() => {
    if (controlledActiveTab && controlledActiveTab !== internalActiveTab) {
      setInternalActiveTab(controlledActiveTab);
    }
  }, [controlledActiveTab, internalActiveTab]);

  const [saveStatus, setSaveStatus] = useState(() => itinerary?.persistence?.persisted ? 'saved' : 'idle');
  const { user } = useAuth();
  const navigate = useNavigate();
  const isQuotationStaff = ['sales', 'admin', 'super_admin'].includes(String(user?.role || '').toLowerCase());
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfTemplate, setPdfTemplate] = useState('classic');
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const [quotationCopyStatus, setQuotationCopyStatus] = useState('');

  // Undo revision history for Copilot edits
  const [historyStack, setHistoryStack] = useState([]);

  const printDocRef = useRef(null);

  const destination = itinerary?.destination || 'Meghalaya';
  const duration = itinerary?.duration || itinerary?.daysCount || (itinerary?.days?.length || 5);
  const travelers = itinerary?.travelers || 2;
  const pace = itinerary?.pace || 'Balanced';

  // Save Plan Action
  const handleSavePlan = async () => {
    setSaveStatus('saving');
    try {
      const payload = {
        ...itinerary,
        title: itinerary.title,
        destination: itinerary.destination,
        days: itinerary.days || itinerary.itineraryDays,
        guestEditToken: itinerary?.guestAuthorization?.editToken || ''
      };
      let res;
      if (itinerary._id) {
        res = await updateAIItineraryApi(itinerary._id, payload);
      } else {
        res = await saveAIItineraryApi(payload);
      }
      if (res && (res._id || res.id)) {
        onUpdateItinerary(mergeSavedItinerary(itinerary, res));
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3500);
    } catch (err) {
      console.warn('Save itinerary error:', err.message);
      setSaveStatus('failed');
    }
  };

  // Trigger PDF Export
  const handleDownloadPdf = async (templateName = pdfTemplate) => {
    setPdfTemplate(templateName);
    setPdfMenuOpen(false);
    setDownloadingPdf(true);
    try {
      if (printDocRef.current) {
        await exportElementToPdf(printDocRef.current, {
          filename: `WanderLuxe-${destination}-${duration}Day-Itinerary.pdf`
        });
      }
    } catch (err) {
      console.warn('PDF export error:', err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExportForQuotation = () => {
    const exportPayload = buildQuotationReadyExport(itinerary, formData?.plannerContext);
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanDestination = String(destination || 'Itinerary').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
    link.href = url;
    link.download = `WanderLuxe_AI_Plan_${cleanDestination || 'Itinerary'}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopyForQuotation = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildQuotationReadyExport(itinerary, formData?.plannerContext), null, 2));
      setQuotationCopyStatus('Quotation-ready plan copied');
      window.setTimeout(() => setQuotationCopyStatus(''), 3000);
    } catch {
      setQuotationCopyStatus('Clipboard access was blocked. Use Export for Quotation instead.');
    }
  };

  const handleCreateQuotation = async () => {
    setSaveStatus('saving');
    try {
      const payload = { ...itinerary, days: itinerary?.days || itinerary?.itineraryDays || [], guestEditToken: itinerary?.guestAuthorization?.editToken || '' };
      let saved;
      if (itinerary?._id) {
        saved = await updateAIItineraryApi(itinerary._id, payload);
      } else saved = await saveAIItineraryApi(payload);
      const id = saved?._id || saved?.id;
      if (!id) throw new Error('Saved plan has no identifier.');
      onUpdateItinerary?.(mergeSavedItinerary(itinerary, saved));
      navigate(`/staff/sales/quotations/new?itineraryId=${encodeURIComponent(id)}`);
    } catch (err) {
      console.warn('Unable to create quotation from plan:', err.message);
      setSaveStatus('idle');
    }
  };

  // Copilot Apply & Undo Engine
  const handleApplyCopilotChanges = (actionPayload) => {
    if (!actionPayload) return;
    // Push previous snapshot to history
    setHistoryStack((prev) => [...prev, JSON.parse(JSON.stringify(itinerary))]);

    const updated = JSON.parse(JSON.stringify(itinerary));
    if (actionPayload.dayIndex !== undefined && updated.days && updated.days[actionPayload.dayIndex]) {
      const targetDay = updated.days[actionPayload.dayIndex];
      if (actionPayload.patch) {
        Object.assign(targetDay, actionPayload.patch);
      }
      if (actionPayload.refinement) {
        targetDay.tips = [actionPayload.refinement, ...(targetDay.tips || [])];
      }
    } else if (actionPayload.patch) {
      Object.assign(updated, actionPayload.patch);
    }
    onUpdateItinerary(updated);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previousSnapshot = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    onUpdateItinerary(previousSnapshot);
  };

  return (
    <div className="space-y-6">
      {/* Hidden Offscreen Printable High-Fidelity A4 Document */}
      <div style={{ position: 'fixed', top: 0, left: 0, opacity: 0, pointerEvents: 'none', zIndex: -100, width: '794px', background: '#ffffff' }}>
        <AIItineraryDocument ref={printDocRef} itinerary={itinerary} template={pdfTemplate} />
      </div>

      {/* Share Modal Dialog */}
      <ShareItineraryModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        itinerary={itinerary}
        onDownloadPdf={handleDownloadPdf}
        onItineraryUpdated={onUpdateItinerary}
      />

      {/* =================================================================== */}
      {/* WORKSPACE MAIN HEADER BAR */}
      {/* =================================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-black uppercase text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-lg">
              {destination} Expedition
            </span>
            <span className="text-xs text-slate-400 font-bold">
              • {duration} Days • {travelers} Adults • {pace} Pace
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {itinerary?.title || `${duration}-Day Expedition for ${destination}`}
          </h1>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Edit Preferences */}
          <button
            type="button"
            onClick={onEditPreferences}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="Modify destination, dates or budget preferences"
          >
            <Sliders size={13} />
            <span className="hidden sm:inline">Edit Preferences</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSavePlan}
            disabled={saveStatus === 'saving'}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
              saveStatus === 'saved'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {saveStatus === 'saved' ? <BookmarkCheck size={13} /> : <Save size={13} />}
            <span>{saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving plan…' : saveStatus === 'failed' ? 'Retry saving plan' : 'Save Plan'}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={handleExportForQuotation}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText size={13} />
            <span>Export for Quotation</span>
          </button>

          <button
            type="button"
            onClick={handleCopyForQuotation}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Copy size={13} />
            <span>Copy for Quotation</span>
          </button>
          <span className="sr-only" role="status" aria-live="polite">{quotationCopyStatus}</span>

          {isQuotationStaff && <button type="button" onClick={handleCreateQuotation} disabled={saveStatus === 'saving'} className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"><FileText size={13} />Create quotation from this plan</button>}

          {/* Download PDF Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPdfMenuOpen(!pdfMenuOpen)}
              disabled={downloadingPdf}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download size={13} />
              <span>{downloadingPdf ? 'Exporting...' : 'PDF'}</span>
              <ChevronDown size={11} />
            </button>

            {pdfMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 block">
                  Select Print Layout
                </span>
                {['classic', 'visual', 'compact'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleDownloadPdf(t)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 font-bold text-slate-700 capitalize flex items-center justify-between cursor-pointer"
                  >
                    <span>{t} Layout</span>
                    {pdfTemplate === t && <Check size={12} className="text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 5 PRIMARY WORKSPACE TABS */}
      {/* =================================================================== */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-px overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`px-5 py-2.5 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 border-x border-slate-200/80 shadow-2xs -mb-px'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =================================================================== */}
      {/* TAB CONTENT PANELS */}
      {/* =================================================================== */}
      <div>
        {activeTab === 'overview' && (
          <WorkspaceOverviewTab
            itinerary={itinerary}
            formData={formData}
            updateFormData={updateFormData}
            missingFields={missingFields}
            onSwitchTab={handleTabClick}
            onCustomize={onCustomize}
            onReserve={onReserve}
            onUpdateItinerary={onUpdateItinerary}
            onRegenerate={onRegenerate}
          />
        )}

        {activeTab === 'story' && (
          <WorkspaceStoryTab
            itinerary={itinerary}
            onSwitchTab={handleTabClick}
            onReserve={onReserve}
            onDownloadPdf={handleDownloadPdf}
          />
        )}

        {activeTab === 'itinerary' && (
          <WorkspaceItineraryTab
            itinerary={itinerary}
            onRegenerateDay={onRegenerateDay}
            regeneratingDayIdx={regeneratingDayIdx}
            onApplyCopilotChanges={handleApplyCopilotChanges}
            onUndoCopilotChanges={handleUndo}
            canUndoCopilot={historyStack.length > 0}
          />
        )}

        {activeTab === 'map' && (
          <WorkspaceMapTab itinerary={itinerary} />
        )}

        {activeTab === 'budget' && (
          <WorkspaceBudgetTab
            itinerary={itinerary}
            userTargetBudget={userTargetBudget}
            onTriggerCopilot={(_prompt) => {
              handleTabClick('itinerary');
              handleApplyCopilotChanges({
                patch: {
                  totalEstimatedCost: Math.round((itinerary?.totalEstimatedCost || 45000) * 0.88)
                }
              });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AIItineraryWorkspace;
