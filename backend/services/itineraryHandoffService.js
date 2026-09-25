import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/environment.js';

export const ITINERARY_TOKEN_PURPOSES = Object.freeze({
  LEAD_HANDOFF: 'ai_itinerary_lead_handoff',
  GUEST_EDIT: 'ai_itinerary_guest_edit'
});

const signToken = (purpose, itineraryId, expiresIn) => jwt.sign(
  { purpose, itineraryId: String(itineraryId) },
  getJwtSecret(),
  { expiresIn }
);

const verifyToken = (token, itineraryId, purpose) => {
  if (typeof token !== 'string' || !token) return false;
  try {
    const claims = jwt.verify(token, getJwtSecret());
    return claims.purpose === purpose && claims.itineraryId === String(itineraryId);
  } catch {
    return false;
  }
};

export const signItineraryHandoffToken = (itineraryId) => signToken(
  ITINERARY_TOKEN_PURPOSES.LEAD_HANDOFF,
  itineraryId,
  '20m'
);

export const verifyItineraryHandoffToken = (token, itineraryId) => verifyToken(
  token,
  itineraryId,
  ITINERARY_TOKEN_PURPOSES.LEAD_HANDOFF
);

export const signItineraryGuestEditToken = (itineraryId) => signToken(
  ITINERARY_TOKEN_PURPOSES.GUEST_EDIT,
  itineraryId,
  '12h'
);

export const verifyItineraryGuestEditToken = (token, itineraryId) => verifyToken(
  token,
  itineraryId,
  ITINERARY_TOKEN_PURPOSES.GUEST_EDIT
);
