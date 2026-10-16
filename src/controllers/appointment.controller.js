import { AppointmentService } from '../services/appointment.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class AppointmentController {
  /**
   * Get appointments with filter
   */
  static async getAppointments(req, res, next) {
    try {
      const { search, status, doctor, date } = req.query;
      const appointments = await AppointmentService.getAllAppointments({ search, status, doctor, date });
      return ApiResponse.success(res, appointments, 'Appointments retrieved successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single appointment
   */
  static async getAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const appointment = await AppointmentService.getAppointmentById(id);
      return ApiResponse.success(res, appointment, 'Appointment retrieved successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Book appointment
   */
  static async bookAppointment(req, res, next) {
    try {
      const appointment = await AppointmentService.bookAppointment(req.validatedBody);
      return ApiResponse.success(res, appointment, 'Appointment booked successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update or Reschedule appointment
   */
  static async updateAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const appointment = await AppointmentService.updateAppointment(id, req.validatedBody);
      return ApiResponse.success(res, appointment, 'Appointment updated successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel / Delete appointment
   */
  static async deleteAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const result = await AppointmentService.deleteAppointment(id);
      return ApiResponse.success(res, result, 'Appointment cancelled successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }
}
