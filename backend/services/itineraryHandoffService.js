import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/environment.js';

const PURPOSE = 'ai_itinerary_lead_handoff';

export const signItineraryHandoffToken = (itineraryId) => jwt.sign(
  { purpose: PURPOSE, itineraryId: String(itineraryId) },
  getJwtSecret(),
  { expiresIn: '20m' }
);

export const verifyItineraryHandoffToken = (token, itineraryId) => {
  if (typeof token !== 'string' || !token) return false;
  try {
    const claims = jwt.verify(token, getJwtSecret());
    return claims.purpose === PURPOSE && claims.itineraryId === String(itineraryId);
  } catch {
    return false;
  }
};
