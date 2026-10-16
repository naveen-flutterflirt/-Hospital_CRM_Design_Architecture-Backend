import { UserManagementService } from '../services/userManagement.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class UserManagementController {
  /**
   * GET /api/v1/settings/users
   */
  static async getAllUsers(req, res, next) {
    try {
      const users = await UserManagementService.getAllUsers();
      return ApiResponse.success(res, users, 'Users retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/settings/users
   */
  static async createUserAccess(req, res, next) {
    try {
      const user = await UserManagementService.createUserAccess(req.body);
      return ApiResponse.success(res, user, 'User access created and invitation email dispatched', HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/settings/users/:id
   */
  static async updateUserRole(req, res, next) {
    try {
      const user = await UserManagementService.updateUserRole(req.params.id, req.body);
      return ApiResponse.success(res, user, 'User role updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/settings/users/:id
   */
  static async deleteUser(req, res, next) {
    try {
      const result = await UserManagementService.deleteUser(req.params.id);
      return ApiResponse.success(res, result, 'User deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
