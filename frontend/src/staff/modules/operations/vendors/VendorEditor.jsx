import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createOperationsVendorApi, getOperationsVendorApi, updateOperationsVendorApi } from '../../../../services/api.js';
import VendorForm from './components/VendorForm.jsx';

export default function VendorEditor() {
  const { id } = useParams(); const navigate = useNavigate(); const editing = Boolean(id); const [vendor, setVendor] = useState(null); const [loading, setLoading] = useState(editing); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (!editing) return; getOperationsVendorApi(id).then((response) => setVendor(response.data)).catch((requestError) => setError(requestError.message || 'Unable to load Vendor.')).finally(() => setLoading(false)); }, [editing, id]);
  const save = async (payload) => { setBusy(true); setError(''); try { const response = editing ? await updateOperationsVendorApi(id, payload) : await createOperationsVendorApi(payload); navigate(`/staff/operations/vendors/${response.data._id}`); } catch (requestError) { setError(requestError.message || 'Unable to save Vendor.'); } finally { setBusy(false); } };
  if (loading) return <div className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 className="mr-2 animate-spin" size={18}/>Loading Vendor…</div>;
  if (editing && !vendor) return <div className="rounded-xl border border-rose-200 bg-white p-8 text-center text-sm text-rose-800">{error || 'Vendor not found.'}</div>;
  return <div className="mx-auto max-w-4xl space-y-5"><header className="rounded-xl border border-slate-200 bg-white p-5"><Link to={editing ? `/staff/operations/vendors/${id}` : '/staff/operations/vendors'} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600"><ArrowLeft size={15}/>Vendors</Link><p className="mt-4 text-xs font-semibold uppercase tracking-[.12em] text-emerald-700">Operations · Vendor directory</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{editing ? `Edit ${vendor.name}` : 'Create Vendor'}</h1><p className="mt-2 text-sm text-slate-600">Maintain factual capability, contact, service-area and reference terms for reusable execution assignments.</p></header><VendorForm vendor={vendor} busy={busy} error={error} onSubmit={save}/></div>;
}
