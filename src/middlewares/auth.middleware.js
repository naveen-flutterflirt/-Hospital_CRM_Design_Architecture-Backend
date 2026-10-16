import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { verifyAccessToken } from '../utils/jwt.utils.js';
import { query } from '../config/db.js';

/**
 * Verify JWT Access Token and authenticate user
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.error(
        res,
        'Authentication required. Please provide a Bearer token.',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      const message = err.name === 'TokenExpiredError' 
        ? 'Authentication token has expired. Please refresh token.' 
        : 'Invalid authentication token.';
      return ApiResponse.error(res, message, HTTP_STATUS.UNAUTHORIZED);
    }

    // Query database using raw SQL (NO ORM)
    const userResult = await query(
      `SELECT id, email, name, role, department, phone, avatar_url, is_active 
       FROM users 
       WHERE id = $1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return ApiResponse.error(
        res,
        'User belonging to this token no longer exists.',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return ApiResponse.error(
        res,
        'Account is deactivated. Contact hospital management.',
        HTTP_STATUS.FORBIDDEN
      );
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Access Control (RBAC) Guard
 * @param  {...string} allowedRoles
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Unauthorized access.', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `Forbidden. Access requires one of: [${allowedRoles.join(', ')}]`,
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
}
