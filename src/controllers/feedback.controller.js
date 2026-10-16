import { FeedbackService } from '../services/feedback.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class FeedbackController {
  /**
   * Get all feedbacks and aggregated NPS KPIs
   */
  static async getAll(req, res, next) {
    try {
      const { search, category, department } = req.query;
      const data = await FeedbackService.getAllFeedbacks({ search, category, department });
      return ApiResponse.success(res, data, 'Patient feedbacks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new patient feedback entry
   */
  static async create(req, res, next) {
    try {
      const result = await FeedbackService.createFeedback(req.body);
      return ApiResponse.success(res, result, 'Feedback recorded successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send survey trigger via Email/WhatsApp
   */
  static async sendSurvey(req, res, next) {
    try {
      const result = await FeedbackService.sendSurvey(req.body);
      return ApiResponse.success(res, result, 'Survey sent successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update feedback status (e.g. resolve grievance)
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const result = await FeedbackService.updateStatus(id, req.body);
      return ApiResponse.success(res, result, 'Feedback status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
