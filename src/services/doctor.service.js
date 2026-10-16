import { query } from '../config/db.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class DoctorService {
  /**
   * Format database doctor row to frontend model
   */
  static formatDoctorRecord(d) {
    return {
      id: d.doctor_code || d.id,
      uuid: d.id,
      doctorCode: d.doctor_code,
      name: d.name,
      specialty: d.specialty,
      department: d.department,
      qualification: d.qualification,
      registrationNo: d.registration_no,
      phone: d.phone,
      email: d.email,
      opdRoom: d.opd_room,
      consultationFee: Number(d.consultation_fee) || 500,
      availableTiming: d.available_timing,
      status: d.status || 'Active',
      patientsAttended: Number(d.patients_attended) || 0,
      createdAt: d.created_at,
    };
  }

  /**
   * Get list of doctors with filtering and search
   */
  static async getAllDoctors({ search = '', department = 'All', status = 'All' } = {}) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search && search.trim() !== '') {
      conditions.push(`(
        name ILIKE $${paramIndex} OR 
        specialty ILIKE $${paramIndex} OR 
        department ILIKE $${paramIndex} OR
        phone ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (department && department !== 'All') {
      conditions.push(`department ILIKE $${paramIndex}`);
      params.push(`%${department.trim()}%`);
      paramIndex++;
    }

    if (status && status !== 'All') {
      conditions.push(`status = $${paramIndex}`);
      params.push(status.trim());
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM doctors ${whereClause} ORDER BY name ASC`;

    const result = await query(sql, params);
    return result.rows.map(DoctorService.formatDoctorRecord);
  }

  /**
   * Get single doctor by ID or doctor_code
   */
  static async getDoctorById(identifier) {
    const res = await query(
      `SELECT * FROM doctors WHERE id::text = $1 OR doctor_code = $1 LIMIT 1`,
      [identifier]
    );

    if (res.rows.length === 0) {
      throw new AppError('Doctor not found', HTTP_STATUS.NOT_FOUND);
    }

    return DoctorService.formatDoctorRecord(res.rows[0]);
  }

  /**
   * Create a new doctor
   */
  static async createDoctor(data) {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const doctorCode = `DOC-${randomNum}`;

    const res = await query(
      `INSERT INTO doctors (
        doctor_code, name, specialty, department, qualification, registration_no,
        phone, email, opd_room, consultation_fee, available_timing, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        doctorCode,
        data.name,
        data.specialty,
        data.department || 'General Medicine',
        data.qualification || '',
        data.registrationNo || '',
        data.phone,
        data.email || null,
        data.opdRoom || 'Room 101',
        data.consultationFee || 500,
        data.availableTiming || 'Mon - Sat (09:00 AM - 01:00 PM)',
        data.status || 'Active',
      ]
    );

    return DoctorService.formatDoctorRecord(res.rows[0]);
  }

  /**
   * Update doctor details
   */
  static async updateDoctor(identifier, data) {
    const existing = await query(
      `SELECT * FROM doctors WHERE id::text = $1 OR doctor_code = $1 LIMIT 1`,
      [identifier]
    );

    if (existing.rows.length === 0) {
      throw new AppError('Doctor not found to update', HTTP_STATUS.NOT_FOUND);
    }

    const current = existing.rows[0];

    const res = await query(
      `UPDATE doctors
       SET name = $1,
           specialty = $2,
           department = $3,
           qualification = $4,
           registration_no = $5,
           phone = $6,
           email = $7,
           opd_room = $8,
           consultation_fee = $9,
           available_timing = $10,
           status = $11,
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        data.name !== undefined ? data.name : current.name,
        data.specialty !== undefined ? data.specialty : current.specialty,
        data.department !== undefined ? data.department : current.department,
        data.qualification !== undefined ? data.qualification : current.qualification,
        data.registrationNo !== undefined ? data.registrationNo : current.registration_no,
        data.phone !== undefined ? data.phone : current.phone,
        data.email !== undefined ? data.email : current.email,
        data.opdRoom !== undefined ? data.opdRoom : current.opd_room,
        data.consultationFee !== undefined ? data.consultationFee : current.consultation_fee,
        data.availableTiming !== undefined ? data.availableTiming : current.available_timing,
        data.status !== undefined ? data.status : current.status,
        current.id,
      ]
    );

    return DoctorService.formatDoctorRecord(res.rows[0]);
  }

  /**
   * Delete a doctor
   */
  static async deleteDoctor(identifier) {
    const res = await query(
      `DELETE FROM doctors WHERE id::text = $1 OR doctor_code = $1 RETURNING id, name`,
      [identifier]
    );

    if (res.rows.length === 0) {
      throw new AppError('Doctor not found to delete', HTTP_STATUS.NOT_FOUND);
    }

    return res.rows[0];
  }
}
