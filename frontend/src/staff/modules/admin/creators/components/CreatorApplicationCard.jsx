import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreatorStatusBadge from './CreatorStatusBadge.jsx';
import { creatorProfileLabel, formatCreatorDate } from '../creatorAdminHelpers.js';

const CreatorApplicationCard = ({ user }) => <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold text-slate-950">{user.name}</h2><p className="mt-1 truncate text-xs text-slate-500">{user.email}</p></div><CreatorStatusBadge status={user.influencerStatus} /></div><dl className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-xs"><div><dt className="text-slate-400">Profile</dt><dd className="mt-1 text-slate-700">{creatorProfileLabel(user.influencerApplication)}</dd></div><div><dt className="text-slate-400">Reach</dt><dd className="mt-1 text-slate-700">{user.influencerApplication?.followerCount || 'Not provided'}</dd></div><div className="col-span-2"><dt className="text-slate-400">Applied</dt><dd className="mt-1 text-slate-700">{formatCreatorDate(user.influencerApplication?.appliedAt)}</dd></div></dl><Link to={`/staff/admin/creators/${user._id}`} className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">Review application <ArrowRight size={14} /></Link></article>;

export default CreatorApplicationCard;

