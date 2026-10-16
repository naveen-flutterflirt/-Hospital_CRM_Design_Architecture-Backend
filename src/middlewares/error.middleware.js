import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ApiResponse, AppError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

/**
 * 404 Not Found handler for undefined routes
 */
export function notFoundHandler(req, res) {
  return ApiResponse.error(
    res,
    `Endpoint not found: ${req.method} ${req.originalUrl}`,
    HTTP_STATUS.NOT_FOUND
  );
}

/**
 * Global Error Handler
 */
export function errorHandler(err, req, res, next) {
  // Operational AppError
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  // PostgreSQL unique violation error (e.g. duplicate email)
  if (err.code === '23505') {
    const detail = err.detail || 'A record with this unique value already exists.';
    return ApiResponse.error(
      res,
      'Duplicate record conflict: ' + detail,
      HTTP_STATUS.CONFLICT
    );
  }

  // PostgreSQL syntax / connection errors
  if (err.code && err.code.startsWith('08')) {
    return ApiResponse.error(
      res,
      'Database connection failure. Please check your Neon DB connection.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  // Log unknown server errors
  console.error('Unhandled Application Error:', err);

  const responseMessage = env.NODE_ENV === 'production' 
    ? 'Internal server error occurred.' 
    : err.message || 'Internal server error';

  return ApiResponse.error(
    res,
    responseMessage,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
}
