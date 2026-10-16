import { IntegrationService } from '../services/integration.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class IntegrationController {
  /**
   * GET /api/v1/settings/integrations
   */
  static async getAll(req, res, next) {
    try {
      const integrations = await IntegrationService.getAllIntegrations();
      return ApiResponse.success(res, integrations, 'Integrations retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/settings/integrations/:id/toggle
   */
  static async toggle(req, res, next) {
    try {
      const { is_enabled } = req.body;
      const updated = await IntegrationService.toggleIntegration(req.params.id, is_enabled);
      return ApiResponse.success(res, updated, `Integration ${is_enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/settings/integrations/:id/config
   */
  static async updateConfig(req, res, next) {
    try {
      const updated = await IntegrationService.updateConfig(req.params.id, req.body);
      return ApiResponse.success(res, updated, 'Integration configuration saved and verified');
    } catch (err) {
      next(err);
    }
  }
}
