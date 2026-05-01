import { sendError } from '../utils/response.js';

export const notFoundHandler = (req, res) => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};


export const globalErrorHandler = (err, req, res, _next) => {
  console.error('Unhandled Error:', err);

  if (err.isJoi) {
    const details = err.details.map(d => d.message).join('; ');
    return sendError(res, `Validation error: ${details}`, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired.', 401);
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return sendError(res, 'A record with this value already exists.', 409, err.detail);
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return sendError(res, 'Referenced record does not exist.', 400, err.detail);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  sendError(res, message, statusCode, process.env.NODE_ENV !== 'production' ? err.stack : undefined);
};
