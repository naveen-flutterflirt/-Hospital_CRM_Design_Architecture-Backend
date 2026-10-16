import { HospitalProfileService } from '../services/hospitalProfile.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class HospitalProfileController {
  /**
   * GET /api/v1/settings/hospital-profile
   */
  static async getProfile(req, res, next) {
    try {
      const profile = await HospitalProfileService.getProfile();
      return ApiResponse.success(res, profile, 'Hospital profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/settings/hospital-profile
   */
  static async updateProfile(req, res, next) {
    try {
      const updated = await HospitalProfileService.updateProfile(req.body);
      return ApiResponse.success(res, updated, 'Hospital profile updated successfully', HTTP_STATUS.OK);
    } catch (err) {
      next(err);
    }
  }
}
