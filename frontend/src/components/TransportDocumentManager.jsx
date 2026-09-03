import React, { useState, useRef } from 'react';
import { 
  FileText, Upload, Trash2, Eye, Download, ShieldCheck, Lock, 
  CheckCircle2, AlertCircle, RefreshCw, Plus, Paperclip, Plane, 
  Train, Bus, Ticket, Receipt, User
} from 'lucide-react';
import { uploadQuotationDocumentApi, DOCUMENT_TYPES } from '../services/quotationService';
import DocumentPreviewModal from './DocumentPreviewModal';

export default function TransportDocumentManager({
  documents = [],
  onChange = () => {},
  readOnly = false,
  isSuperOrAdmin = false
}) {
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [selectedType, setSelectedType] = useState('TRANSPORT_VOUCHER');
  const [selectedVisibility, setSelectedVisibility] = useState('CUSTOMER_VISIBLE');
  const fileInputRef = useRef(null);

  const formatSize = (bytes) => {
    if (!bytes) return '';
    return bytes < 1024 * 1024 
      ? `${(bytes / 1024).toFixed(0)} KB` 
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocTypeInfo = (typeValue) => {
    return DOCUMENT_TYPES.find(d => d.value === typeValue) || {
      value: typeValue,
      label: typeValue ? typeValue.replace(/_/g, ' ') : 'Travel Document',
      icon: 'FileText'
    };
  };

  const handleFiles = async (files) => {
    if (readOnly || !files || files.length === 0) return;

    const fileList = Array.from(files);
    const validFiles = fileList.filter(f => {
      const ext = (f.name || '').toLowerCase().split('.').pop();
      const validExt = ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext);
      const underLimit = f.size <= 20 * 1024 * 1024;
      return validExt && underLimit;
    });

    if (validFiles.length < fileList.length) {
      alert('Some files were ignored. Only PDF, JPG, PNG, WEBP files up to 20MB are supported.');
    }
    if (validFiles.length === 0) return;

    const uploadTasks = validFiles.map(f => ({
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      progress: 25,
      status: 'uploading'
    }));

    setUploadingFiles(prev => [...prev, ...uploadTasks]);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const taskId = uploadTasks[i].id;

      try {
        setUploadingFiles(prev => prev.map(t => t.id === taskId ? { ...t, progress: 65 } : t));
        const uploadRes = await uploadQuotationDocumentApi(file);

        // Auto-assign default visibility based on category
        const targetType = selectedType;
        const targetVisibility = targetType === 'SUPPLIER_INVOICE' ? 'INTERNAL_ONLY' : selectedVisibility;

        const newDocItem = {
          id: `tdoc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: targetType,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          fileName: file.name,
          mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          size: file.size,
          storageProvider: 'cloudinary',
          publicId: uploadRes.public_id || '',
          secureUrl: uploadRes.secure_url || uploadRes.url,
          visibility: targetVisibility,
          passengerName: '',
          bookingReference: '',
          uploadedAt: new Date().toISOString()
        };

        setUploadingFiles(prev => prev.map(t => t.id === taskId ? { ...t, progress: 100, status: 'completed' } : t));

        onChange(prevDocs => {
          const current = Array.isArray(prevDocs) ? prevDocs : [];
          return [...current, newDocItem];
        });

        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(t => t.id !== taskId));
        }, 1200);

      } catch (err) {
        console.error('Document upload failed:', err);
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

  const handleDelete = (docId) => {
    if (readOnly) return;
    const updated = (documents || []).filter(d => d.id !== docId);
    onChange(updated);
  };

  const handleUpdateField = (docId, field, value) => {
    if (readOnly) return;
    const updated = (documents || []).map(d => {
      if (d.id === docId) {
        return { ...d, [field]: value };
      }
      return d;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <FileText size={13} className="text-emerald-600" /> Tickets, Vouchers & Travel Documents
        </label>
        <span className="text-[10px] font-bold text-slate-400">
          {(documents || []).length} document{documents.length === 1 ? '' : 's'} attached
        </span>
      </div>

      {/* Upload Controls & Settings */}
      {!readOnly && (
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Document Category for Next Upload
              </label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  if (e.target.value === 'SUPPLIER_INVOICE') {
                    setSelectedVisibility('INTERNAL_ONLY');
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                {DOCUMENT_TYPES.map(dt => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Customer Visibility Policy
              </label>
              <select
                value={selectedVisibility}
                disabled={selectedType === 'SUPPLIER_INVOICE'}
                onChange={(e) => setSelectedVisibility(e.target.value)}
                className={`w-full bg-white border rounded-xl px-3 py-1.5 text-xs font-black outline-none cursor-pointer ${
                  selectedVisibility === 'INTERNAL_ONLY' 
                    ? 'border-rose-300 text-rose-700 bg-rose-50/30' 
                    : 'border-emerald-300 text-emerald-700 bg-emerald-50/30'
                }`}
              >
                <option value="CUSTOMER_VISIBLE">Customer Visible (Proposal & Itinerary)</option>
                <option value="INTERNAL_ONLY">Internal Only (Staff & Operations)</option>
              </select>
            </div>
          </div>

          {selectedType === 'SUPPLIER_INVOICE' && (
            <div className="text-[10px] font-bold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200 flex items-center gap-1.5">
              <Lock size={12} /> Supplier Invoices are strictly locked to Internal Only and will NEVER be visible to the customer.
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
              dragOver 
                ? 'border-emerald-500 bg-emerald-50/50 shadow-inner' 
                : 'border-slate-200 hover:border-emerald-400 hover:bg-white'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
              multiple
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <div className="flex flex-col items-center gap-1.5 pointer-events-none">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Upload size={18} />
              </div>
              <div className="text-xs font-bold text-slate-800">
                Drop PDF Tickets or Documents here, or <span className="text-emerald-600 underline">browse files</span>
              </div>
              <p className="text-[10px] text-slate-400">
                E-tickets, transit vouchers, confirmations • PDF, JPG, PNG, WEBP up to 20MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Upload Tasks */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-1.5">
          {uploadingFiles.map(task => (
            <div 
              key={task.id} 
              className="p-2.5 rounded-xl border bg-slate-50 flex items-center justify-between text-xs gap-3 border-slate-200 animate-pulse"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Paperclip size={14} className="text-slate-400 shrink-0" />
                <span className="font-bold text-slate-700 truncate">{task.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0">{formatSize(task.size)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {task.status === 'uploading' && (
                  <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
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

      {/* Attached Documents List */}
      {(documents || []).length > 0 && (
        <div className="space-y-2 pt-1">
          {documents.map((doc, idx) => {
            const isInternal = doc.visibility === 'INTERNAL_ONLY';
            const typeInfo = getDocTypeInfo(doc.type);
            const isPdf = doc.mimeType === 'application/pdf' || (doc.fileName || '').toLowerCase().endsWith('.pdf');

            return (
              <div 
                key={doc.id || idx}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  isInternal 
                    ? 'bg-rose-50/20 border-rose-200/80' 
                    : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                }`}
              >
                {/* File Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    isPdf ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  }`}>
                    <FileText size={16} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900 truncate">
                        {doc.title || doc.fileName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                        {typeInfo.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase flex items-center gap-1 ${
                        isInternal 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isInternal ? <Lock size={9} /> : <ShieldCheck size={9} />}
                        {isInternal ? 'Internal Only' : 'Customer Visible'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="truncate">{doc.fileName}</span>
                      {doc.size > 0 && <span>• {formatSize(doc.size)}</span>}
                      {doc.passengerName && <span>• Pax: {doc.passengerName}</span>}
                      {doc.bookingReference && <span>• Ref: {doc.bookingReference}</span>}
                    </div>
                  </div>
                </div>

                {/* Metadata Editors (Non-Readonly) & Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  {!readOnly && (
                    <select
                      value={doc.visibility || 'CUSTOMER_VISIBLE'}
                      disabled={doc.type === 'SUPPLIER_INVOICE'}
                      onChange={(e) => handleUpdateField(doc.id, 'visibility', e.target.value)}
                      className={`text-[10px] font-black rounded-lg px-2 py-1 outline-none border cursor-pointer ${
                        doc.visibility === 'INTERNAL_ONLY' 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <option value="CUSTOMER_VISIBLE">Customer Visible</option>
                      <option value="INTERNAL_ONLY">Internal Only</option>
                    </select>
                  )}

                  {doc.secureUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Preview Document"
                    >
                      <Eye size={12} />
                      <span>Preview</span>
                    </button>
                  )}

                  {doc.secureUrl && (
                    <a
                      href={doc.secureUrl}
                      download={doc.fileName || 'travel_document.pdf'}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Download"
                    >
                      <Download size={14} />
                    </a>
                  )}

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDoc)}
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
