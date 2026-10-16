import { DashboardService } from '../services/dashboard.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class DashboardController {
  /**
   * Get real dashboard metrics and feeds
   */
  static async getOverview(req, res, next) {
    try {
      const data = await DashboardService.getDashboardOverview();
      return ApiResponse.success(res, data, 'Live dashboard metrics fetched');
    } catch (error) {
      next(error);
    }
  }
}
