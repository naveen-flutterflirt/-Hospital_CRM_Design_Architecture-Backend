import { LeadService } from '../services/lead.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class LeadController {
  /**
   * GET /api/v1/leads
   */
  static async getLeads(req, res, next) {
    try {
      const { search, stage, source, priority, kanban } = req.query;

      if (kanban === 'true') {
        const board = await LeadService.getKanbanBoard({ search, source });
        return ApiResponse.success(res, board, 'Kanban board fetched successfully');
      }

      const leads = await LeadService.getAllLeads({ search, stage, source, priority });
      return ApiResponse.success(res, leads, 'Leads fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/leads/board
   */
  static async getKanbanBoard(req, res, next) {
    try {
      const { search, source } = req.query;
      const board = await LeadService.getKanbanBoard({ search, source });
      return ApiResponse.success(res, board, 'Kanban board fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/leads/:id
   */
  static async getLead(req, res, next) {
    try {
      const lead = await LeadService.getLeadById(req.params.id);
      return ApiResponse.success(res, lead, 'Lead details retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/leads
   */
  static async createLead(req, res, next) {
    try {
      const newLead = await LeadService.createLead(req.body);
      return ApiResponse.success(res, newLead, 'Lead created successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/leads/:id
   */
  static async updateLead(req, res, next) {
    try {
      const updated = await LeadService.updateLead(req.params.id, req.body);
      return ApiResponse.success(res, updated, 'Lead updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/leads/:id/stage (Quick drag-and-drop or stage transition)
   */
  static async updateStage(req, res, next) {
    try {
      const { stage } = req.body;
      const updated = await LeadService.updateLead(req.params.id, { stage });
      return ApiResponse.success(res, updated, 'Lead stage updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/leads/:id/convert (Convert Lead into Registered Patient)
   */
  static async convertToPatient(req, res, next) {
    try {
      const result = await LeadService.convertToPatient(req.params.id, req.body);
      return ApiResponse.success(
        res,
        result,
        `Lead converted successfully! Assigned UHID: ${result.patient.uhid}`,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/leads/webhook (Public Ad Webhook Endpoint for Meta/Google/Websites)
   */
  static async ingestWebhook(req, res, next) {
    try {
      const newLead = await LeadService.ingestWebhookLead(req.body);
      return ApiResponse.success(res, newLead, 'Ad lead ingested automatically', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }


  /**
   * DELETE /api/v1/leads/:id
   */
  static async deleteLead(req, res, next) {
    try {
      const result = await LeadService.deleteLead(req.params.id);
      return ApiResponse.success(res, result, 'Lead removed successfully');
    } catch (error) {
      next(error);
    }
  }
}
