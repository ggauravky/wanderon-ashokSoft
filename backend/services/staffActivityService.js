import mongoose from 'mongoose';
import StaffActivityEvent from '../models/StaffActivityEvent.js';

const safeText = (value, max = 240) => String(value || '').trim().slice(0, max);

const getActor = (req) => {
  const rawId = req.user?._id || req.user?.id || req.authContext?.mongoUserId;
  if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) return null;
  return {
    actorId: new mongoose.Types.ObjectId(String(rawId)),
    actorRole: safeText(req.user?.role || req.authContext?.role || 'staff', 40)
  };
};

// Secondary operational telemetry: a failure is logged, but never rolls back the
// successful business mutation that produced it.
export const recordStaffActivity = async ({ req, department, action, entityType, entityId = null, entityKey = '', entityLabel = '', metadata = {} }) => {
  try {
    const actor = getActor(req);
    if (!actor || mongoose.connection?.readyState !== 1) return null;
    return await StaffActivityEvent.create({
      ...actor,
      department,
      action: safeText(action, 80),
      entityType: safeText(entityType, 80),
      entityId: entityId && mongoose.Types.ObjectId.isValid(entityId) ? entityId : null,
      entityKey: safeText(entityKey),
      entityLabel: safeText(entityLabel),
      metadata
    });
  } catch (error) {
    console.error('Staff activity write failed:', error.message);
    return null;
  }
};
