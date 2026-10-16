import { HTTP_STATUS } from '../constants/httpStatus.js';

export class ApiResponse {
  /**
   * Send standard success response
   */
  static success(res, data = null, message = 'Operation successful', statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Send standard error response
   */
  static error(
    res,
    message = 'Internal server error',
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors = null
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
    });
  }
}

export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.BAD_REQUEST, errors = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
