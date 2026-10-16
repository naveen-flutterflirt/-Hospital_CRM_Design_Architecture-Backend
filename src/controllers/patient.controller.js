import { PatientService } from '../services/patient.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class PatientController {
  /**
   * Get patients list with filters and pagination
   */
  static async getPatients(req, res, next) {
    try {
      const { search, status, page, limit } = req.query;
      const result = await PatientService.getAllPatients({
        search: search ? String(search) : '',
        status: status ? String(status) : 'All',
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
      });

      return ApiResponse.success(res, result, 'Patients fetched successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single patient by ID or UHID
   */
  static async getPatient(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await PatientService.getPatientById(id);
      return ApiResponse.success(res, patient, 'Patient retrieved successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get complete 360 profile with visits, bills, admissions, and timeline
   */
  static async getPatientProfile360(req, res, next) {
    try {
      const { id } = req.params;
      const profile = await PatientService.getPatientProfile360(id);
      return ApiResponse.success(res, profile, 'Patient 360 profile retrieved successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register a new patient
   */
  static async createPatient(req, res, next) {
    try {
      const patient = await PatientService.createPatient(req.validatedBody);
      return ApiResponse.success(
        res,
        patient,
        'Patient registered successfully',
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing patient
   */
  static async updatePatient(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await PatientService.updatePatient(id, req.validatedBody);
      return ApiResponse.success(res, updated, 'Patient details updated successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a patient
   */
  static async deletePatient(req, res, next) {
    try {
      const { id } = req.params;
      const result = await PatientService.deletePatient(id);
      return ApiResponse.success(res, result, 'Patient removed successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }
}
