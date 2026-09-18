import mongoose from 'mongoose';
import { getMarketingLeadAnalytics, getMarketingLeadAnalyticsOptions } from '../services/marketingLeadAnalyticsService.js';

const available = () => mongoose.connection?.readyState === 1;
const fail = (res, error) => {
  console.error('Marketing lead analytics error:', error);
  return res.status(error?.status || 500).json({ success: false, message: error?.status ? error.message : 'Marketing conversion analytics are temporarily unavailable.' });
};

export const marketingLeadAnalytics = async (req, res) => {
  if (!available()) return res.status(503).json({ success: false, message: 'Marketing conversion analytics are temporarily unavailable.' });
  try { return res.json(await getMarketingLeadAnalytics(req.query)); } catch (error) { return fail(res, error); }
};

export const marketingLeadAnalyticsOptions = async (_req, res) => {
  if (!available()) return res.status(503).json({ success: false, message: 'Marketing conversion analytics are temporarily unavailable.' });
  try { return res.json(await getMarketingLeadAnalyticsOptions()); } catch (error) { return fail(res, error); }
};

