import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Middleware factory for validating request body
 * @param {Function} validatorFn - Function returning { isValid, errors, data }
 */
export function validateBody(validatorFn) {
  return (req, res, next) => {
    const result = validatorFn(req.body);

    if (!result.isValid) {
      return ApiResponse.error(
        res,
        'Validation failed',
        HTTP_STATUS.BAD_REQUEST,
        result.errors
      );
    }

    req.validatedBody = result.data;
    next();
  };
}
