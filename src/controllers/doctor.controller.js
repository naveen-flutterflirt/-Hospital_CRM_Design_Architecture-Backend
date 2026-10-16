import { DoctorService } from '../services/doctor.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class DoctorController {
  /**
   * Get all doctors
   */
  static async getDoctors(req, res, next) {
    try {
      const { search, department, status } = req.query;
      const doctors = await DoctorService.getAllDoctors({ search, department, status });
      return ApiResponse.success(res, doctors, 'Doctors retrieved successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single doctor
   */
  static async getDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const doctor = await DoctorService.getDoctorById(id);
      return ApiResponse.success(res, doctor, 'Doctor retrieved successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add new doctor
   */
  static async createDoctor(req, res, next) {
    try {
      const doctor = await DoctorService.createDoctor(req.validatedBody);
      return ApiResponse.success(res, doctor, 'Doctor added successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update doctor
   */
  static async updateDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const doctor = await DoctorService.updateDoctor(id, req.validatedBody);
      return ApiResponse.success(res, doctor, 'Doctor details updated successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete doctor
   */
  static async deleteDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const result = await DoctorService.deleteDoctor(id);
      return ApiResponse.success(res, result, 'Doctor removed successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }
}
