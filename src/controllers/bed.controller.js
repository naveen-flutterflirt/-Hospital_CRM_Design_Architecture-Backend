import { BedService } from '../services/bed.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class BedController {
  static async getWards(req, res, next) {
    try {
      const wards = await BedService.getAllWards();
      return ApiResponse.success(res, wards, 'Wards retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getBeds(req, res, next) {
    try {
      const { wardId, status, search } = req.query;
      const beds = await BedService.getBeds({ wardId, status, search });
      return ApiResponse.success(res, beds, 'Beds retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getSummary(req, res, next) {
    try {
      const summary = await BedService.getSummary();
      return ApiResponse.success(res, summary, 'Bed summary retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async admitPatient(req, res, next) {
    try {
      const admission = await BedService.admitPatient(req.body);
      return ApiResponse.success(res, admission, 'Patient admitted to bed successfully', HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  }

  static async transferPatient(req, res, next) {
    try {
      const result = await BedService.transferPatient(req.body);
      return ApiResponse.success(res, result, 'Patient transferred successfully');
    } catch (err) {
      next(err);
    }
  }

  static async dischargePatient(req, res, next) {
    try {
      const { bedId } = req.params;
      const { dischargeNotes } = req.body;
      const result = await BedService.dischargePatient({ bedId, dischargeNotes });
      return ApiResponse.success(res, result, 'Patient discharged successfully');
    } catch (err) {
      next(err);
    }
  }

  static async markBedClean(req, res, next) {
    try {
      const { bedId } = req.params;
      const bed = await BedService.markBedClean(bedId);
      return ApiResponse.success(res, bed, 'Bed marked clean and vacant');
    } catch (err) {
      next(err);
    }
  }

  static async updateBedStatus(req, res, next) {
    try {
      const { bedId } = req.params;
      const { status } = req.body;
      const bed = await BedService.updateBedStatus(bedId, status);
      return ApiResponse.success(res, bed, 'Bed status updated');
    } catch (err) {
      next(err);
    }
  }
}
