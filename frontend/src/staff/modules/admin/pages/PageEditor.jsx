import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MediaLibraryModal from '../../../../components/MediaLibraryModal.jsx';
import { createPageApi, getAdminPageByIdApi, updatePageApi } from '../../../../services/api.js';
import PageBasicForm from './components/PageBasicForm.jsx';
import PageContentForm from './components/PageContentForm.jsx';
import PageSeoForm from './components/PageSeoForm.jsx';
import PagePublishingPanel from './components/PagePublishingPanel.jsx';
import { createEmptyPage, normalizePageSlug } from './pageHelpers.js';

const PageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(createEmptyPage);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mediaOpen, setMediaOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getAdminPageByIdApi(id).then((result) => setPage({ ...createEmptyPage(), ...result, seo: { ...createEmptyPage().seo, ...(result.seo || {}) }, sections: result.sections || [] })).catch((loadError) => setError(loadError.message || 'Unable to load page.')).finally(() => setLoading(false));
  }, [id]);

  const change = (key, value) => { setPage((current) => ({ ...current, [key]: key === 'slug' ? normalizePageSlug(value) : value })); if (key === 'slug') setSlugTouched(true); };
  const changeTitle = (title) => setPage((current) => ({ ...current, title, ...(!slugTouched ? { slug: normalizePageSlug(title) } : {}) }));
  const changeSeo = (key, value) => setPage((current) => ({ ...current, seo: { ...current.seo, [key]: value } }));
  const save = async () => {
    setBusy(true); setError('');
    try {
      const payload = { ...page, title: page.title.trim(), slug: normalizePageSlug(page.slug || page.title) };
      const saved = id ? await updatePageApi(id, payload) : await createPageApi(payload);
      navigate(`/staff/admin/pages/${saved._id}/edit`, { replace: true, state: { saved: true } });
      setPage({ ...createEmptyPage(), ...saved, seo: { ...createEmptyPage().seo, ...(saved.seo || {}) }, sections: saved.sections || [] });
    } catch (saveError) { setError(saveError.message || 'Unable to save page.'); }
    finally { setBusy(false); }
  };

  if (loading) return <section className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" />Loading page…</section>;
  return <div className="space-y-5"><header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Link to="/staff/admin/pages" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft size={15} />Pages</Link><h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{id ? 'Edit CMS page' : 'Create CMS page'}</h1><p className="mt-2 text-sm text-slate-600">MongoDB remains the source of truth; public visibility follows the saved publishing state.</p></header>{error && <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]"><div className="space-y-5"><PageBasicForm page={page} onChange={change} onTitleChange={changeTitle} /><PageContentForm page={page} onChange={change} /><PageSeoForm seo={page.seo} onChange={changeSeo} onOpenMedia={() => setMediaOpen(true)} /></div><div className="xl:sticky xl:top-5 xl:self-start"><PagePublishingPanel page={page} busy={busy} onStatusChange={(status) => change('status', status)} onSave={save} /></div></div><MediaLibraryModal isOpen={mediaOpen} onClose={() => setMediaOpen(false)} onSelectMedia={(media) => { changeSeo('ogImage', media.url); if (!page.seo.twitterImage) changeSeo('twitterImage', media.url); setMediaOpen(false); }} /></div>;
};

export default PageEditor;

