import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, Trash2, CheckCircle2, Star, Eye, AlertCircle, 
  RefreshCw, Image as ImageIcon, Plus, X 
} from 'lucide-react';
import { uploadVehicleImageApi } from '../services/quotationService';

export default function VehicleMediaManager({
  media = [],
  onChange = () => {},
  readOnly = false
}) {
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    if (readOnly || !files || files.length === 0) return;

    const fileList = Array.from(files);
    const validFiles = fileList.filter(f => {
      const isImg = f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(f.name);
      const isUnderLimit = f.size <= 10 * 1024 * 1024;
      return isImg && isUnderLimit;
    });

    if (validFiles.length < fileList.length) {
      alert('Some files were ignored. Only JPG, PNG, WEBP images up to 10MB are supported.');
    }
    if (validFiles.length === 0) return;

    // Track active upload states
    const uploadTasks = validFiles.map(f => ({
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      progress: 20,
      status: 'uploading' // 'uploading' | 'completed' | 'failed'
    }));

    setUploadingFiles(prev => [...prev, ...uploadTasks]);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const taskId = uploadTasks[i].id;

      try {
        setUploadingFiles(prev => prev.map(t => t.id === taskId ? { ...t, progress: 60 } : t));
        const uploadRes = await uploadVehicleImageApi(file);
        
        const newMediaItem = {
          id: `vm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          url: uploadRes.secure_url || uploadRes.url,
          publicId: uploadRes.public_id || '',
          caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          isPrimary: media.length === 0 && i === 0, // Auto-select primary if first
          uploadedAt: new Date().toISOString(),
          size: file.size
        };

        setUploadingFiles(prev => prev.map(t => t.id === taskId ? { ...t, progress: 100, status: 'completed' } : t));
        
        // Append to parent media state
        onChange(prevMedia => {
          const current = Array.isArray(prevMedia) ? prevMedia : [];
          return [...current, newMediaItem];
        });

        // Clear task after short delay
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(t => t.id !== taskId));
        }, 1200);

      } catch (err) {
        console.error('Vehicle image upload failed:', err);
        setUploadingFiles(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed', error: err.message } : t));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSetPrimary = (index) => {
    if (readOnly) return;
    const updated = (media || []).map((item, i) => ({
      ...item,
      isPrimary: i === index
    }));
    onChange(updated);
  };

  const handleDelete = (index) => {
    if (readOnly) return;
    const updated = (media || []).filter((_, i) => i !== index);
    // If we deleted the primary and items remain, make first one primary
    if (updated.length > 0 && !updated.some(item => item.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleCaptionChange = (index, val) => {
    if (readOnly) return;
    const updated = [...(media || [])];
    updated[index] = { ...updated[index], caption: val };
    onChange(updated);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Camera size={13} className="text-indigo-600" /> Vehicle & Transit Photos
        </label>
        <span className="text-[10px] font-bold text-slate-400">
          {(media || []).length} photo{media.length === 1 ? '' : 's'} added
        </span>
      </div>

      {/* Upload Dropzone */}
      {!readOnly && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
            dragOver 
              ? 'border-indigo-500 bg-indigo-50/50 shadow-inner' 
              : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <div className="flex flex-col items-center gap-1.5 pointer-events-none">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Upload size={18} />
            </div>
            <div className="text-xs font-bold text-slate-800">
              Drop vehicle photos here, or <span className="text-indigo-600 underline">browse</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Exterior, interior, seating layout • JPG, PNG, WEBP up to 10MB
            </p>
          </div>
        </div>
      )}

      {/* Uploading Tasks Indicator */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-1.5">
          {uploadingFiles.map(task => (
            <div 
              key={task.id} 
              className="p-2.5 rounded-xl border bg-slate-50 flex items-center justify-between text-xs gap-3 border-slate-200 animate-pulse"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <ImageIcon size={14} className="text-slate-400 shrink-0" />
                <span className="font-bold text-slate-700 truncate">{task.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0">{formatSize(task.size)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {task.status === 'uploading' && (
                  <span className="text-[10px] font-black text-indigo-600 flex items-center gap-1">
                    <RefreshCw size={11} className="animate-spin" /> Uploading {task.progress}%
                  </span>
                )}
                {task.status === 'completed' && (
                  <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Uploaded
                  </span>
                )}
                {task.status === 'failed' && (
                  <span className="text-[10px] font-black text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} /> Failed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Thumbnails Grid */}
      {(media || []).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
          {media.map((item, idx) => (
            <div 
              key={item.id || idx}
              className={`group relative rounded-2xl overflow-hidden border bg-white shadow-xs transition-all flex flex-col ${
                item.isPrimary ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
              }`}
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                <img
                  src={item.url}
                  alt={item.caption || 'Vehicle Photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Primary Badge */}
                {item.isPrimary ? (
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Star size={10} className="fill-white" /> Primary
                  </span>
                ) : !readOnly ? (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-slate-900/70 hover:bg-emerald-600 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer"
                    title="Set as Primary Vehicle Photo"
                  >
                    <Star size={10} /> Set Primary
                  </button>
                ) : null}

                {/* Preview Overlay Button */}
                <button
                  type="button"
                  onClick={() => setPreviewImage(item.url)}
                  className="absolute bottom-1.5 right-1.5 p-1 rounded-lg bg-slate-900/70 hover:bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="View full image"
                >
                  <Eye size={12} />
                </button>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {/* Caption / Label */}
              <div className="p-2 border-t border-slate-100 bg-white">
                {readOnly ? (
                  <p className="text-[10px] font-bold text-slate-700 truncate">{item.caption || 'Vehicle photo'}</p>
                ) : (
                  <input
                    type="text"
                    value={item.caption || ''}
                    onChange={(e) => handleCaptionChange(idx, e.target.value)}
                    placeholder="Photo caption (e.g. Front/Interior)"
                    className="w-full text-[10px] font-bold text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-indigo-400 placeholder:text-slate-400"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white bg-slate-800/80 rounded-full"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="Vehicle preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}
