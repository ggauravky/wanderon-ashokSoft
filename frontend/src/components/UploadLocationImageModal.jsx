import React, { useState } from 'react';
import { 
  X, Upload, Image as ImageIcon, MapPin, Tag, Check, AlertCircle, 
  Sparkles, RefreshCw, FileText, Camera
} from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadImageApi, createMediaAssetApi } from '../services/api.js';

export default function UploadLocationImageModal({
  isOpen,
  onClose,
  onAssetCreated,
  initialDestination = '',
  initialLocationName = ''
}) {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'

  const [destination, setDestination] = useState(initialDestination || '');
  const [locality, setLocality] = useState(initialLocationName || '');
  const [poi, setPoi] = useState(initialLocationName || '');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [title, setTitle] = useState(initialLocationName ? `${initialLocationName} View` : '');
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [credit, setCredit] = useState('WanderLuxe Archival Collection');
  const [tags, setTags] = useState('');
  const [featured, setFeatured] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (filePreview && filePreview.startsWith('blob:')) {
        try { URL.revokeObjectURL(filePreview); } catch (_) {}
      }
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
      if (!title) {
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    let finalImageUrl = directUrl.trim();
    let publicId = '';
    let width = 1600;
    let height = 900;

    if (uploadMode === 'file') {
      if (!file) {
        setErrorMsg('Please select an image file to upload.');
        return;
      }

      try {
        setUploading(true);
        const uploadRes = await uploadImageApi(file, 'wanderluxe/locations');
        finalImageUrl = uploadRes.secure_url || uploadRes.url;
        publicId = uploadRes.public_id || '';
        if (uploadRes.width) width = uploadRes.width;
        if (uploadRes.height) height = uploadRes.height;
      } catch (uploadErr) {
        setUploading(false);
        setErrorMsg('Image upload failed: ' + uploadErr.message);
        return;
      }
    } else {
      if (!finalImageUrl) {
        setErrorMsg('Please provide a valid image URL.');
        return;
      }
    }

    if (!finalImageUrl) {
      setErrorMsg('No image URL generated. Please try again.');
      setUploading(false);
      return;
    }

    if (!title.trim() || !destination.trim()) {
      setErrorMsg('Title and Destination are required.');
      setUploading(false);
      return;
    }

    try {
      setUploading(true);
      const tagArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const assetPayload = {
        title: title.trim(),
        caption: caption.trim() || title.trim(),
        altText: altText.trim() || `${poi || locality || title}, ${destination}`,
        storage: {
          provider: 'cloudinary',
          secureUrl: finalImageUrl,
          publicId,
          width,
          height,
          format: 'webp'
        },
        geography: {
          country: country.trim() || 'India',
          state: state.trim(),
          destination: destination.trim(),
          city: city.trim(),
          locality: locality.trim(),
          poi: poi.trim()
        },
        location: {
          country: country.trim() || 'India',
          state: state.trim(),
          destination: destination.trim(),
          city: city.trim(),
          locality: locality.trim(),
          poi: poi.trim()
        },
        source: {
          sourceType: 'ADMIN_UPLOAD',
          attribution: credit.trim() || 'WanderLuxe Archival Collection'
        },
        tags: tagArray,
        featured,
        active: true
      };

      const newAsset = await createMediaAssetApi(assetPayload);
      if (onAssetCreated) {
        onAssetCreated(newAsset);
      }
      onClose();
    } catch (createErr) {
      setErrorMsg('Failed to register media asset in database: ' + createErr.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Index Location Media Asset</h2>
              <p className="text-xs text-slate-400 font-medium">
                Add verified photography to canonical database for matching
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                uploadMode === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Upload Local File
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('url')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                uploadMode === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Enter Direct Image URL
            </button>
          </div>

          {/* File Upload Zone */}
          {uploadMode === 'file' ? (
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Select Image *</label>
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center bg-slate-50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {filePreview ? (
                  <div className="flex items-center justify-center gap-4">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-20 h-14 object-cover rounded-xl shadow-xs"
                    />
                    <div className="text-left text-xs">
                      <span className="font-black text-slate-900 block truncate max-w-xs">{file?.name}</span>
                      <span className="text-slate-400 font-medium">Click or drag another image to replace</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Camera size={24} className="mx-auto text-slate-400" />
                    <span className="text-xs font-bold text-slate-700 block">Click to upload photo or drag & drop</span>
                    <span className="text-[11px] text-slate-400 block">JPG, PNG, WebP up to 10MB</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Direct Secure Image URL *</label>
              <input
                type="url"
                required={uploadMode === 'url'}
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/... or https://..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Asset Title */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">Asset Title / Scene Name *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Double Decker Living Root Bridge Waterfall Stream"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Geographic Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Destination Region / State *</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Meghalaya, Manali, Spiti Valley, Kashmir"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Exact POI / Attraction Name</label>
              <input
                type="text"
                value={poi}
                onChange={(e) => setPoi(e.target.value)}
                placeholder="e.g. Nohkalikai Falls, Solang Valley, Dal Lake"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Locality / Village / Town</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Cherrapunji, Nongriat, Old Manali, Gulmarg"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">City / Base Camp</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Shillong, Manali, Leh, Srinagar"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Tags & Caption */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">Search Tags (Comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. waterfall, trek, bridge, nature, rainforest, root bridge"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Photo Credit / Attribution</label>
              <input
                type="text"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                placeholder="WanderLuxe Archival Collection"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2 text-xs font-black text-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                Mark as Featured Destination Asset
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              {uploading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Indexing Asset...
                </>
              ) : (
                <>
                  <Check size={14} /> Save & Index Asset
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
