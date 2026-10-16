import { ReferralService } from '../services/referral.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class ReferralController {
  /**
   * GET /api/v1/referrals
   */
  static async getDoctors(req, res, next) {
    try {
      const { search, specialty, status } = req.query;
      const list = await ReferralService.getAllReferringDoctors({ search, specialty, status });
      return ApiResponse.success(res, list, 'Referring doctors retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/referrals/summary
   */
  static async getSummary(_req, res, next) {
    try {
      const summary = await ReferralService.getSummary();
      return ApiResponse.success(res, summary, 'Referral network summary fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/referrals/:id
   */
  static async getDoctor(req, res, next) {
    try {
      const doctor = await ReferralService.getDoctorById(req.params.id);
      return ApiResponse.success(res, doctor, 'Referring doctor details retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/referrals
   */
  static async createDoctor(req, res, next) {
    try {
      const newDoctor = await ReferralService.createDoctor(req.body);
      return ApiResponse.success(
        res,
        newDoctor,
        `Doctor ${newDoctor.name} added to referral network`,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/referrals/:id
   */
  static async updateDoctor(req, res, next) {
    try {
      const updated = await ReferralService.updateDoctor(req.params.id, req.body);
      return ApiResponse.success(res, updated, 'Doctor details updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/referrals/:id/cases (Log referred patient bill & calculate commission)
   */
  static async logCase(req, res, next) {
    try {
      const result = await ReferralService.logReferralCase(req.params.id, req.body);
      return ApiResponse.success(
        res,
        result,
        `Referred patient recorded! Doctor honorarium: ₹${result.calculatedCommission}`,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/referrals/:id
   */
  static async deleteDoctor(req, res, next) {
    try {
      const result = await ReferralService.deleteDoctor(req.params.id);
      return ApiResponse.success(res, result, 'Doctor removed successfully');
    } catch (error) {
      next(error);
    }
  }
}
