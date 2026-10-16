import { query } from '../config/db.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class AppointmentService {
  /**
   * Format database appointment record to frontend model
   */
  static formatAppointmentRecord(a) {
    return {
      id: a.appointment_code || a.id,
      uuid: a.id,
      code: a.appointment_code,
      patient: a.patient_name,
      patientName: a.patient_name,
      patientUhid: a.patient_uhid,
      patientId: a.patient_id,
      doctor: a.doctor_name,
      doctorName: a.doctor_name,
      doctorId: a.doctor_id,
      dept: a.department,
      department: a.department,
      date: a.appointment_date,
      time: a.time_slot,
      timeSlot: a.time_slot,
      source: a.source || 'Walk-in',
      status: a.status || 'Booked',
      statusType: a.status_type || 'neutral',
      notes: a.notes,
      createdAt: a.created_at,
    };
  }

  /**
   * Get all appointments with filtering by date, status, doctor, search
   */
  static async getAllAppointments({ search = '', status = 'All', doctor = 'All', date } = {}) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search && search.trim() !== '') {
      conditions.push(`(
        patient_name ILIKE $${paramIndex} OR 
        patient_uhid ILIKE $${paramIndex} OR 
        appointment_code ILIKE $${paramIndex} OR
        doctor_name ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (status && status !== 'All') {
      conditions.push(`status ILIKE $${paramIndex}`);
      params.push(`%${status.trim()}%`);
      paramIndex++;
    }

    if (doctor && doctor !== 'All') {
      conditions.push(`doctor_name ILIKE $${paramIndex}`);
      params.push(`%${doctor.trim()}%`);
      paramIndex++;
    }

    if (date && date.trim() !== '') {
      conditions.push(`appointment_date = $${paramIndex}`);
      params.push(date.trim());
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM appointments ${whereClause} ORDER BY created_at DESC`;

    const result = await query(sql, params);
    return result.rows.map(AppointmentService.formatAppointmentRecord);
  }

  /**
   * Get appointment by ID or code
   */
  static async getAppointmentById(identifier) {
    const res = await query(
      `SELECT * FROM appointments WHERE id::text = $1 OR appointment_code = $1 LIMIT 1`,
      [identifier]
    );

    if (res.rows.length === 0) {
      throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
    }

    return AppointmentService.formatAppointmentRecord(res.rows[0]);
  }

  /**
   * Book a new appointment
   */
  static async bookAppointment(data) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const appointmentCode = `APP-${randomSuffix}`;

    const dateVal = data.appointmentDate || new Date().toISOString().split('T')[0];

    const statusTypeMap = {
      'Booked': 'neutral',
      'Checked in': 'success',
      'Waiting': 'warning',
      'In consult': 'primary',
      'Completed': 'neutral',
      'No-show': 'alert',
      'Cancelled': 'alert',
    };

    const statusType = data.statusType || statusTypeMap[data.status] || 'neutral';

    // 1. Resolve or auto-register patient in patients table
    let resolvedPatientId = data.patientId || null;
    let resolvedUhid = data.patientUhid || null;

    if (resolvedUhid) {
      const pCheck = await query('SELECT id, name, uhid FROM patients WHERE uhid = $1 LIMIT 1', [resolvedUhid]);
      if (pCheck.rows.length > 0) {
        resolvedPatientId = pCheck.rows[0].id;
      }
    } else if (data.patientName) {
      const pCheck = await query('SELECT id, name, uhid FROM patients WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1', [data.patientName]);
      if (pCheck.rows.length > 0) {
        resolvedPatientId = pCheck.rows[0].id;
        resolvedUhid = pCheck.rows[0].uhid;
      } else {
        // Auto-register new patient in Master Patient Directory
        const newUhid = 'BLR-00' + Math.floor(10000 + Math.random() * 90000);
        const newCode = 'P-' + Math.floor(1000 + Math.random() * 9000);
        const nameParts = data.patientName.trim().split(' ');
        const fName = nameParts[0] || 'Patient';
        const lName = nameParts.slice(1).join(' ') || '';

        const newP = await query(
          `INSERT INTO patients (patient_code, uhid, first_name, last_name, name, gender, phone, status, department, source)
           VALUES ($1, $2, $3, $4, $5, 'M', '+91 9800000000', 'OPD - Registered', $6, $7)
           RETURNING id, uhid`,
          [newCode, newUhid, fName, lName, data.patientName.trim(), data.department || 'General Medicine', data.source || 'Walk-in']
        );
        if (newP.rows.length > 0) {
          resolvedPatientId = newP.rows[0].id;
          resolvedUhid = newP.rows[0].uhid;
        }
      }
    }

    const res = await query(
      `INSERT INTO appointments (
        appointment_code, patient_name, patient_uhid, patient_id,
        doctor_name, doctor_id, department, appointment_date, time_slot,
        source, status, status_type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        appointmentCode,
        data.patientName,
        resolvedUhid,
        resolvedPatientId,
        data.doctorName,
        data.doctorId || null,
        data.department || 'General Medicine',
        dateVal,
        data.timeSlot || '09:30 AM',
        data.source || 'Walk-in',
        data.status || 'Booked',
        statusType,
        data.notes || null,
      ]
    );

    return AppointmentService.formatAppointmentRecord(res.rows[0]);
  }

  /**
   * Update or Reschedule appointment (status, timeSlot, date)
   */
  static async updateAppointment(identifier, data) {
    const existing = await query(
      `SELECT * FROM appointments WHERE id::text = $1 OR appointment_code = $1 LIMIT 1`,
      [identifier]
    );

    if (existing.rows.length === 0) {
      throw new AppError('Appointment not found to update', HTTP_STATUS.NOT_FOUND);
    }

    const current = existing.rows[0];

    let statusType = current.status_type;
    if (data.status) {
      const statusTypeMap = {
        'Booked': 'neutral',
        'Checked in': 'success',
        'Waiting': 'warning',
        'In consult': 'primary',
        'Completed': 'neutral',
        'No-show': 'alert',
        'Cancelled': 'alert',
      };
      statusType = data.statusType || statusTypeMap[data.status] || 'neutral';
    }

    const res = await query(
      `UPDATE appointments
       SET status = $1,
           status_type = $2,
           appointment_date = $3,
           time_slot = $4,
           doctor_name = $5,
           notes = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        data.status !== undefined ? data.status : current.status,
        statusType,
        data.appointmentDate !== undefined ? data.appointmentDate : current.appointment_date,
        data.timeSlot !== undefined ? data.timeSlot : current.time_slot,
        data.doctorName !== undefined ? data.doctorName : current.doctor_name,
        data.notes !== undefined ? data.notes : current.notes,
        current.id,
      ]
    );

    return AppointmentService.formatAppointmentRecord(res.rows[0]);
  }

  /**
   * Cancel / Delete an appointment
   */
  static async deleteAppointment(identifier) {
    const res = await query(
      `DELETE FROM appointments WHERE id::text = $1 OR appointment_code = $1 RETURNING id, appointment_code, patient_name`,
      [identifier]
    );

    if (res.rows.length === 0) {
      throw new AppError('Appointment not found to delete', HTTP_STATUS.NOT_FOUND);
    }

    return res.rows[0];
  }
}
