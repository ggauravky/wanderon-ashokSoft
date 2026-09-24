import mongoose from 'mongoose';
import Lead from '../models/Lead.js';

export const canStaffAccessLead = (lead, user) => {
  const role = String(user?.role || '').toLowerCase();
  if (['super_admin', 'admin', 'operations'].includes(role)) return true;
  if (role !== 'sales') return false;
  return lead?.leadType === 'callback_request'
    || (lead?.leadType === 'trip_enquiry' && lead?.source === 'ai_planner');
};

export const loadAuthorizedLeadForStaff = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error('A valid lead is required.'), { status: 422 });
  }
  const lead = await Lead.findById(id);
  if (!lead) throw Object.assign(new Error('Lead not found.'), { status: 404 });
  if (!canStaffAccessLead(lead, user)) {
    throw Object.assign(new Error('You cannot access this lead.'), { status: 403 });
  }
  return lead;
};
