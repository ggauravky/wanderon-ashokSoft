import React, { useEffect, useState } from 'react';
import {
  X, Upload, Check, AlertCircle,
  RefreshCw, Camera
} from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadImageApi, createMediaAssetApi, createQuotationHotelMediaAssetApi } from '../services/api.js';
import { validateImageUploadFile } from '../utils/uploadResult.js';

export default function UploadLocationImageModal({
  isOpen,
  onClose,
  onAssetCreated,
  initialDestination = '',
  initialLocationName = '',
  initialCity = '',
  purpose = 'generic'
}) {
  const isHotel = purpose === 'hotel';
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'

  const [destination, setDestination] = useState(initialDestination || '');
  const [locality, setLocality] = useState(initialLocationName || '');
  const [poi, setPoi] = useState(initialLocationName || '');
  const [city, setCity] = useState(initialCity || '');
  const [state] = useState('');
  const [country] = useState('India');
  const [title, setTitle] = useState(initialLocationName ? (isHotel ? initialLocationName : `${initialLocationName} View`) : '');
  const [caption] = useState('');
  const [altText, setAltText] = useState('');
  const [category, setCategory] = useState('Hotel');
  const [credit, setCredit] = useState(isHotel ? 'WanderLuxe Staff Upload' : 'WanderLuxe Archival Collection');
  const [tags, setTags] = useState('');
  const [featured, setFeatured] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadedFileData, setUploadedFileData] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    if (isHotel) {
      setFile(null);
      setFilePreview('');
      setUploadedFileData(null);
      setErrorMsg('');
      setDestination(initialDestination || '');
      setCity(initialCity || '');
      setLocality(initialLocationName || '');
      setPoi(initialLocationName || '');
      setTitle(initialLocationName || '');
      setAltText('');
      setCategory('Hotel');
    } else {
      setDestination((value) => value || initialDestination || '');
      setCity((value) => value || initialCity || '');
      setLocality((value) => value || initialLocationName || '');
      setPoi((value) => value || initialLocationName || '');
      setTitle((value) => value || (initialLocationName ? `${initialLocationName} View` : ''));
    }
  }, [initialCity, initialDestination, initialLocationName, isHotel, isOpen]);

  useEffect(() => () => {
    if (filePreview.startsWith('blob:')) URL.revokeObjectURL(filePreview);
  }, [filePreview]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const validationError = validateImageUploadFile(selected);
      if (validationError) {
        setFile(null);
        setErrorMsg(validationError);
        return;
      }
      if (filePreview && filePreview.startsWith('blob:')) {
        try { URL.revokeObjectURL(filePreview); } catch {}
      }
      setFile(selected);
      setUploadedFileData(null);
      setErrorMsg('');
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

    let finalImageUrl = isHotel ? '' : directUrl.trim();
    let publicId = '';
    let width = 1600;
    let height = 900;
    let format = 'jpg';
    let bytes = 0;

    if (isHotel || uploadMode === 'file') {
      if (!file) {
        setErrorMsg('Please select an image file to upload.');
        return;
      }

      try {
        setUploading(true);
        const uploadRes = uploadedFileData || await uploadImageApi(file, isHotel ? 'wanderluxe/quotation-hotels' : 'wanderluxe/locations');
        setUploadedFileData(uploadRes);
        finalImageUrl = uploadRes.secureUrl;
        publicId = uploadRes.publicId;
        if (uploadRes.width) width = uploadRes.width;
        if (uploadRes.height) height = uploadRes.height;
        if (uploadRes.format) format = uploadRes.format;
        if (uploadRes.bytes) bytes = uploadRes.bytes;
      } catch (uploadError) {
        setUploading(false);
        setErrorMsg(uploadError.message || 'Unable to upload image. Please try again.');
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

    const resolvedDestination = isHotel
      ? (city.trim() || locality.trim() || initialDestination.trim() || destination.trim())
      : destination.trim();

    if (!title.trim() || !resolvedDestination) {
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
        altText: altText.trim() || `${poi || locality || title}, ${resolvedDestination}`,
        storage: {
          provider: publicId ? 'cloudinary' : 'external',
          secureUrl: finalImageUrl,
          publicId,
          width,
          height,
          format,
          bytes
        },
        geography: {
          country: country.trim() || 'India',
          state: state.trim(),
          destination: resolvedDestination,
          city: city.trim(),
          locality: locality.trim(),
          poi: poi.trim()
        },
        hotel: isHotel ? {
          city: city.trim(),
          location: locality.trim() || poi.trim()
        } : undefined,
        quotationDestination: isHotel ? initialDestination.trim() : undefined,
        destination: resolvedDestination,
        location: {
          country: country.trim() || 'India',
          state: state.trim(),
          destination: resolvedDestination,
          city: city.trim(),
          locality: locality.trim(),
          poi: poi.trim()
        },
        source: {
          sourceType: isHotel ? 'STAFF_UPLOAD' : 'ADMIN_UPLOAD',
          attribution: credit.trim() || 'WanderLuxe Staff Upload'
        },
        tags: isHotel ? [...new Set([...tagArray, 'hotel', 'property'])] : tagArray,
        categories: isHotel ? [category] : undefined,
        usage: isHotel ? { itinerary: false, destination: false, tripCard: false, hero: false, gallery: true, hotel: true } : undefined,
        featured,
        active: true
      };

      const newAsset = isHotel
        ? await createQuotationHotelMediaAssetApi(assetPayload)
        : await createMediaAssetApi(assetPayload);
      if (onAssetCreated) {
        onAssetCreated(newAsset);
      }
      onClose();
    } catch (createErr) {
      setErrorMsg(isHotel
        ? (createErr.message || 'Image uploaded, but it could not be added to the media library. Please try again.')
        : 'Failed to register media asset in database: ' + createErr.message);
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
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] z-60"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">{isHotel ? 'Upload Hotel Image' : 'Index Location Media Asset'}</h2>
              <p className="text-xs text-slate-400 font-medium">
                {isHotel ? 'Add approved property imagery for this quotation' : 'Add verified photography to canonical database for matching'}
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
          {!isHotel && <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
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
          </div>}

          {/* File Upload Zone */}
          {isHotel || uploadMode === 'file' ? (
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Select Image *</label>
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center bg-slate-50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
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

          {isHotel && <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">Alt Text *</label>
            <input type="text" required value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Deluxe hotel room with mountain view" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500" />
          </div>}

          {/* Geographic Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Destination *</label>
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
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">{isHotel ? 'Property / Location Name' : 'Exact POI / Attraction Name'}</label>
              <input
                type="text"
                value={poi}
                onChange={(e) => setPoi(e.target.value)}
                placeholder="e.g. Nohkalikai Falls, Solang Valley, Dal Lake"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {isHotel && <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1">Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500">
              {['Hotel', 'Resort', 'Room', 'Property', 'Boutique Hotel', 'Luxury Hotel', 'Mountain Resort', 'Beach Resort', 'Homestay', 'Villa'].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>}

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
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">{isHotel ? 'City / Location (optional)' : 'City / Base Camp'}</label>
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

          {!isHotel && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>}

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
                  <RefreshCw size={14} className="animate-spin" /> {isHotel ? 'Uploading…' : 'Indexing Asset...'}
                </>
              ) : (
                <>
                  <Check size={14} /> {isHotel ? 'Upload & Use' : 'Save & Index Asset'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
