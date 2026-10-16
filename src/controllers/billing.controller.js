import { BillingService } from '../services/billing.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class BillingController {
  static async getAll(req, res, next) {
    try {
      const { search, status, type, page, limit } = req.query;
      const data = await BillingService.getAllInvoices({ search, status, type, page, limit });
      return ApiResponse.success(res, data, 'Invoices retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getSummary(req, res, next) {
    try {
      const summary = await BillingService.getSummary();
      return ApiResponse.success(res, summary, 'Billing summary retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const invoice = await BillingService.createInvoice(req.body);
      return ApiResponse.success(res, invoice, 'Invoice created successfully', HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await BillingService.updateInvoiceStatus(id, req.body);
      return ApiResponse.success(res, invoice, 'Invoice status updated successfully');
    } catch (err) {
      next(err);
    }
  }
}
