import mongoose from 'mongoose';
import { OperationsDomainError } from '../services/operationsExecutionService.js';

export const operationsActor = (req) => ({ id: req.user._id, name: req.user.name || '', role: req.user.role });
export const sameInstant = (left, right) => Boolean(left && right) && new Date(left).getTime() === new Date(right).getTime();
export const ensureOperationsDatabase = (res) => {
  if (mongoose.connection?.readyState === 1) return true;
  res.status(503).json({ message: 'Operations is temporarily unavailable.' });
  return false;
};
export const operationsFailure = (res, status, message, code) => res.status(status).json({ message, ...(code ? { code } : {}) });
export const handleOperationsError = (res, error, fallback) => {
  if (error instanceof OperationsDomainError) return operationsFailure(res, error.status || 400, error.message, error.code);
  if (error?.name === 'VersionError') return operationsFailure(res, 409, 'This record changed while you were editing it. Refresh and try again.');
  if (error?.name === 'ValidationError') return operationsFailure(res, 400, Object.values(error.errors || {})[0]?.message || 'Invalid Operations record.');
  if (error?.code === 11000) return operationsFailure(res, 409, 'An Operations record with this identity already exists.');
  console.error(fallback, error?.message || error);
  if (mongoose.connection?.readyState !== 1) return operationsFailure(res, 503, 'Operations is temporarily unavailable.');
  return operationsFailure(res, 500, fallback);
};
