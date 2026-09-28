import { API_BASE_URL, getHeaders, parseApiResponse, request, toQueryString } from './apiConfig.js';

const hotelRequest = async (path, { method = 'GET', body } = {}) => {
  const response = await request(`${API_BASE_URL}/hotels${path}`, { method, headers: getHeaders(), ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Hotel catalog request failed.');
  return data;
};

export const listHotelsApi = (filters = {}) => hotelRequest(`/?${toQueryString(filters)}`);
export const getHotelApi = (id) => hotelRequest(`/${encodeURIComponent(id)}`);
export const createHotelApi = (hotel) => hotelRequest('/', { method: 'POST', body: hotel });
export const updateHotelApi = (id, hotel) => hotelRequest(`/${encodeURIComponent(id)}`, { method: 'PATCH', body: hotel });
export const setHotelStatusApi = (id, status, catalogVersion) => hotelRequest(`/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status, catalogVersion } });
export const listHotelVendorsApi = async () => {
  const response = await request(`${API_BASE_URL}/operations/vendors?type=HOTEL&limit=50`, { headers: getHeaders() });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data?.message || 'Unable to load hotel suppliers.');
  return data.data || [];
};
