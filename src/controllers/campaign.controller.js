import { CampaignService } from '../services/campaign.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class CampaignController {
  static async getAll(req, res, next) {
    try {
      const { search, status, platform } = req.query;
      const data = await CampaignService.getAllCampaigns({ search, status, platform });
      return ApiResponse.success(res, data, 'Campaigns retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getSummary(req, res, next) {
    try {
      const summary = await CampaignService.getSummary();
      return ApiResponse.success(res, summary, 'Campaign summary retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const campaign = await CampaignService.createCampaign(req.body);
      return ApiResponse.success(res, campaign, 'Campaign created successfully', HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const campaign = await CampaignService.updateStatus(id, status);
      return ApiResponse.success(res, campaign, 'Campaign status updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const campaign = await CampaignService.updateCampaign(id, req.body);
      return ApiResponse.success(res, campaign, 'Campaign updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await CampaignService.deleteCampaign(id);
      return ApiResponse.success(res, result, 'Campaign deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
