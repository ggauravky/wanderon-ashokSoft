const isProduction = process.env.NODE_ENV === 'production';

export const sendErrorResponse = (res, error, fallbackMessage, fallbackStatus = 500, extra = {}) => {
  const candidateStatus = Number(error?.status || error?.statusCode || fallbackStatus);
  const status = Number.isInteger(candidateStatus) && candidateStatus >= 400 && candidateStatus <= 599
    ? candidateStatus
    : fallbackStatus;
  const message = status >= 500 && isProduction
    ? fallbackMessage
    : (error?.message || fallbackMessage);
  return res.status(status).json({ success: false, ...extra, message });
};
