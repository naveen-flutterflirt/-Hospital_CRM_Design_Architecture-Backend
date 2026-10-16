import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class AuthController {
  /**
   * Handle user login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.validatedBody;
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const result = await AuthService.login({
        email,
        password,
        ipAddress,
      });

      return ApiResponse.success(res, result, 'Login successful', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle new user registration (e.g. by Admin)
   */
  static async register(req, res, next) {
    try {
      const newUser = await AuthService.register(req.validatedBody);
      return ApiResponse.success(
        res,
        newUser,
        'User registered successfully',
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle refresh access token
   */
  static async refresh(req, res, next) {
    try {
      const { refreshToken } = req.validatedBody;
      const result = await AuthService.refreshAccessToken(refreshToken);
      return ApiResponse.success(res, result, 'Token refreshed successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle user logout
   */
  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body || {};
      await AuthService.logout(refreshToken);
      return ApiResponse.success(res, null, 'Logged out successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch current authenticated user's profile
   */
  static async getMe(req, res, next) {
    try {
      const user = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        department: req.user.department,
        phone: req.user.phone,
        avatarUrl: req.user.avatar_url,
        isActive: req.user.is_active,
      };

      return ApiResponse.success(res, user, 'Profile retrieved successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }
}
