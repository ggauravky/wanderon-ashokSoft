import React, { useCallback, useState, useEffect } from 'react';
import {
  X, Search, Image as ImageIcon, Check, Eye,
  Sparkles, RefreshCw, Upload, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { listMediaAssetsApi } from '../services/api.js';

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelectMedia,
  initialDestination = '',
  initialLocation: _initialLocation = '',
  currentSelectedAssetId = null,
  onOpenUpload = null,
  purpose = 'generic',
  keepOpenOnUpload = false,
  pendingAsset = null
}) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [destinationFilter, setDestinationFilter] = useState(initialDestination || '');
  const [destinationsList, setDestinationsList] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [error, setError] = useState('');
  const [fallbackNotice, setFallbackNotice] = useState('');
  const [brokenAssets, setBrokenAssets] = useState(() => new Set());
  const isHotel = purpose === 'hotel';
  const copy = isHotel ? {
    title: 'Hotel & Resort Media',
    subtitle: 'Choose approved hotel, resort, room or property imagery.',
    search: 'Search hotels, resorts, rooms or property styles...',
    emptyTitle: 'No Hotel or Resort Media Found',
    emptyBody: 'No approved hotel imagery matches this search. Upload a property photo to add it to the library.',
    selectHint: 'Choose an image above to use for this hotel option',
    confirm: 'Use for Hotel'
  } : {
    title: 'Location Media Library',
    subtitle: 'Select real, database-driven photography for this itinerary day',
    search: 'Search POI, location, attraction or tags...',
    emptyTitle: 'No Location Images Found',
    emptyBody: 'No canonical media matches your search query or destination filter. Upload a new photo to index this location.',
    selectHint: 'Click on an image above to attach to this itinerary day',
    confirm: 'Attach to Day'
  };

  const fetchAssets = useCallback(async (searchValue = '', destinationValue = '') => {
    try {
      setLoading(true);
      setError('');
      const params = { limit: 60 };
      if (isHotel) {
        params.type = 'IMAGE';
        params.usage = 'hotel';
      }
      if (searchValue.trim()) params.search = searchValue.trim();
      const hasDestination = destinationValue && destinationValue !== 'ALL';
      if (hasDestination) {
        params.destination = destinationValue;
        if (isHotel) params.destinationExact = 'true';
      }

      let res = await listMediaAssetsApi(params);
      let usedFallback = false;
      if (isHotel && hasDestination && (!res.data || res.data.length === 0)) {
        const fallbackParams = { ...params };
        delete fallbackParams.destination;
        delete fallbackParams.destinationExact;
        res = await listMediaAssetsApi(fallbackParams);
        usedFallback = true;
      }
      if (res.data) {
        setAssets(res.data);
        setFallbackNotice(usedFallback && res.data.length
          ? 'No destination-specific hotel media found. Showing approved hotel inspiration.'
          : '');
        if (res.destinations) {
          setDestinationsList(res.destinations);
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to load media assets.');
    } finally {
      setLoading(false);
    }
  }, [isHotel]);

  useEffect(() => {
    if (!isOpen) return;
    setDestinationFilter(initialDestination || '');
    setSearch('');
    setSelectedAsset(null);
    setBrokenAssets(new Set());
  }, [initialDestination, isOpen, purpose]);

  useEffect(() => {
    if (!isOpen) return;
    fetchAssets('', destinationFilter);
  }, [destinationFilter, fetchAssets, isOpen]);

  useEffect(() => {
    if (!isOpen || !pendingAsset?._id) return;
    setAssets((current) => [pendingAsset, ...current.filter((asset) => asset._id !== pendingAsset._id)]);
    setSelectedAsset(pendingAsset);
    setFallbackNotice('');
  }, [isOpen, pendingAsset]);

  const openUpload = () => {
    if (!keepOpenOnUpload) onClose();
    onOpenUpload?.();
  };

  const markBroken = (assetId) => {
    setBrokenAssets((current) => new Set([...current, assetId]));
    setSelectedAsset((current) => current?._id === assetId ? null : current);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchAssets(search, destinationFilter);
  };

  const handleConfirmSelect = () => {
    if (!selectedAsset) return;
    onSelectMedia({
      assetId: selectedAsset._id,
      url: selectedAsset.storage?.secureUrl || selectedAsset.url,
      altText: selectedAsset.altText || `${selectedAsset.title}, ${selectedAsset.geography?.destination || ''}`,
      caption: selectedAsset.caption || selectedAsset.title,
      width: selectedAsset.storage?.width || 1600,
      height: selectedAsset.storage?.height || 900,
      credit: selectedAsset.source?.attribution || '',
      locationName: selectedAsset.geography?.poi || selectedAsset.geography?.locality || selectedAsset.geography?.city || selectedAsset.title,
      destination: selectedAsset.geography?.destination || ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ImageIcon size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">{copy.title}</h2>
              <p className="text-xs text-slate-400 font-medium">
                {copy.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenUpload && (
              <button
                type="button"
                onClick={openUpload}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload size={13} /> {isHotel ? 'Upload from device' : 'Upload New'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Filters Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={copy.search}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="">All Destinations</option>
              {destinationsList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => fetchAssets(search, destinationFilter)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Refresh Media List"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Media Asset Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!error && fallbackNotice && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">{fallbackNotice}</div>}
          {error ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-rose-700 space-y-3"><AlertCircle size={24} /><p className="text-sm font-semibold">{error}</p><button type="button" onClick={() => fetchAssets(search, destinationFilter)} className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white">Retry</button></div>
          ) : loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw size={24} className="animate-spin text-emerald-600" />
              <span className="text-xs font-bold">Scanning canonical media repository...</span>
            </div>
          ) : assets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm">{copy.emptyTitle}</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                  {copy.emptyBody}
                </p>
              </div>
              {onOpenUpload && (
                <button
                  type="button"
                  onClick={openUpload}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  {isHotel ? 'Upload Hotel Image' : 'Upload First Photo for this Location'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {assets.map((asset) => {
                const isSelected = selectedAsset?._id === asset._id || currentSelectedAssetId === asset._id;
                const imgUrl = asset.storage?.secureUrl || asset.url;
                const poi = asset.geography?.poi || asset.title;
                const dest = asset.geography?.destination;

                return (
                  <div
                    key={asset._id}
                    onClick={() => { if (!brokenAssets.has(asset._id)) setSelectedAsset(asset); }}
                    className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all bg-slate-900 ${
                      isSelected
                        ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-lg scale-[1.02]'
                        : 'border-slate-200 hover:border-slate-400 hover:shadow-md'
                    }`}
                  >
                    <div className="aspect-16/10 overflow-hidden bg-slate-100">
                      {brokenAssets.has(asset._id) ? <div className="flex h-full items-center justify-center bg-slate-100 text-center text-[11px] font-semibold text-slate-400"><span><ImageIcon size={22} className="mx-auto mb-1"/>Image unavailable</span></div> : <img
                        src={imgUrl}
                        alt={asset.altText || poi}
                        loading="lazy"
                        onError={() => markBroken(asset._id)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />}
                    </div>

                    {/* Overlay info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-2.5 text-white pointer-events-none">
                      <div className="flex justify-between items-start">
                        {asset.featured ? (
                          <span className="bg-amber-400 text-slate-950 font-black text-[9px] uppercase px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Sparkles size={10} /> Featured
                          </span>
                        ) : <span />}

                        {isSelected && (
                          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md">
                            <Check size={14} />
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block truncate">
                          {dest}
                        </span>
                        <h4 className="text-xs font-black text-white leading-tight truncate">
                          {poi}
                        </h4>
                      </div>
                    </div>

                    {/* Preview Button */}
                    {!brokenAssets.has(asset._id) && <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewAsset(asset);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Preview Full Photo"
                    >
                      <Eye size={13} />
                    </button>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Selected Metadata & Confirm CTA */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 truncate max-w-md">
            {selectedAsset ? (
              <div>
                <strong className="text-slate-900 font-black">{selectedAsset.title}</strong>
                <span className="text-slate-500 block truncate">
                  📍 {selectedAsset.geography?.poi || selectedAsset.geography?.locality || selectedAsset.geography?.destination} • {selectedAsset.storage?.width}x{selectedAsset.storage?.height}px
                </span>
              </div>
            ) : (
              <span className="text-slate-400 font-medium">{copy.selectHint}</span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSelect}
              disabled={!selectedAsset}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Check size={14} /> {copy.confirm}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Full Photo Preview Modal */}
      <AnimatePresence>
        {previewAsset && (
          <div 
            onClick={() => setPreviewAsset(null)}
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <div className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3">
              <img
                src={previewAsset.storage?.secureUrl || previewAsset.url}
                alt={previewAsset.title}
                className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain"
              />
              <div className="text-white text-center">
                <h3 className="font-black text-sm">{previewAsset.title}</h3>
                <p className="text-xs text-slate-400">
                  {previewAsset.geography?.destination} • {previewAsset.source?.attribution || 'WanderLuxe Media'}
                </p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
