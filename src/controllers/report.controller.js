import { ReportService } from '../services/report.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class ReportController {
  /**
   * GET /api/v1/reports/financial
   */
  static async getFinancial(req, res, next) {
    try {
      const { dateRange, department } = req.query;
      const data = await ReportService.getFinancialReport({ dateRange, department });
      return ApiResponse.success(res, data, 'Financial report generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reports/operational
   */
  static async getOperational(_req, res, next) {
    try {
      const data = await ReportService.getOperationalReport();
      return ApiResponse.success(res, data, 'Operational report generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reports/marketing
   */
  static async getMarketing(_req, res, next) {
    try {
      const data = await ReportService.getMarketingReport();
      return ApiResponse.success(res, data, 'Marketing ROI report generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reports/executive
   */
  static async getExecutive(_req, res, next) {
    try {
      const data = await ReportService.getExecutiveSummary();
      return ApiResponse.success(res, data, 'Executive performance summary generated');
    } catch (error) {
      next(error);
    }
  }
}
