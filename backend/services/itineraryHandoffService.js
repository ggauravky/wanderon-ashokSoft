import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/environment.js';
import { toObjectIdOrNull } from '../utils/mongoId.js';

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

/**
 * Authorizes the resource handoff only. Customer relationship linking is a
 * separate concern and must continue to use resolveCustomerUserObjectId.
 */
export const authorizeItineraryLeadHandoff = ({ requester, itinerary, handoffToken }) => {
  const requesterUserId = toObjectIdOrNull(requester?._id || requester?.id);
  const ownedByAuthenticatedAccount = Boolean(
    requesterUserId
    && itinerary?.user
    && String(itinerary.user) === String(requesterUserId)
  );
  const guestHandoffProofValid = Boolean(
    itinerary
    && !itinerary.user
    && verifyItineraryHandoffToken(handoffToken, itinerary._id)
  );

  return {
    requesterUserId,
    ownedByAuthenticatedAccount,
    guestHandoffProofValid,
    authorized: ownedByAuthenticatedAccount || guestHandoffProofValid
  };
};
