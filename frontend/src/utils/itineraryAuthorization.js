export const mergeSavedItinerary = (currentItinerary = {}, savedItinerary = {}) => {
  const savedId = savedItinerary?._id || savedItinerary?.id;
  const merged = {
    ...currentItinerary,
    ...savedItinerary,
    ...(savedId ? { _id: savedId, id: savedId } : {})
  };

  // Save/update responses refresh guest credentials. Preserve the current
  // credentials only when an unrelated response omits the field entirely.
  if (!Object.hasOwn(savedItinerary || {}, 'guestAuthorization') && currentItinerary?.guestAuthorization) {
    merged.guestAuthorization = currentItinerary.guestAuthorization;
  }

  return merged;
};

export const isGuestItinerary = (itinerary) => !itinerary?.user;

export const getFreshGuestHandoffToken = (savedItinerary) => {
  if (!isGuestItinerary(savedItinerary)) return '';
  const token = savedItinerary?.guestAuthorization?.handoffToken;
  return typeof token === 'string' ? token : '';
};
