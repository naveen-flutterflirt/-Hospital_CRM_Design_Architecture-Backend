import { query } from '../config/db.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class ReferralService {
  /**
   * Format database row into frontend Doctor referral model
   */
  static formatDoctorRecord(r) {
    return {
      id: r.doctor_code || r.id,
      uuid: r.id,
      doctorCode: r.doctor_code,
      name: r.name,
      specialty: r.specialty,
      clinic: r.clinic_name,
      phone: r.phone,
      email: r.email,
      city: r.city || 'Mumbai',
      patientsReferred: Number(r.patients_referred) || 0,
      revenueGenerated: Number(r.revenue_generated) || 0,
      commissionRate: Number(r.commission_rate) || 10,
      status: r.status || 'Active',
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  /**
   * Get all referring doctors with optional filtering & search
   */
  static async getAllReferringDoctors({ search, specialty, status } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (search && search.trim() !== '') {
      conditions.push(`(name ILIKE $${idx} OR clinic_name ILIKE $${idx} OR specialty ILIKE $${idx} OR phone ILIKE $${idx} OR doctor_code ILIKE $${idx})`);
      params.push(`%${search.trim()}%`);
      idx++;
    }

    if (specialty && specialty !== 'All' && specialty !== 'All Specialties') {
      conditions.push(`specialty ILIKE $${idx}`);
      params.push(`%${specialty.trim()}%`);
      idx++;
    }

    if (status && status !== 'All' && status !== 'All Statuses') {
      conditions.push(`status = $${idx}`);
      params.push(status.trim());
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM referring_doctors ${whereClause} ORDER BY revenue_generated DESC, created_at DESC`;

    const res = await query(sql, params);
    return res.rows.map(this.formatDoctorRecord);
  }

  /**
   * Get referral network KPIs summary
   */
  static async getSummary() {
    const sql = `
      SELECT 
        COUNT(*) AS total_doctors,
        COALESCE(SUM(patients_referred), 0) AS total_patients_referred,
        COALESCE(SUM(revenue_generated), 0) AS total_revenue_generated,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) AS active_doctors,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) AS pending_doctors,
        COUNT(CASE WHEN status = 'Inactive' THEN 1 END) AS inactive_doctors
      FROM referring_doctors
    `;
    const res = await query(sql);
    const row = res.rows[0];

    // Find top performer
    const topDocRes = await query(`
      SELECT name, clinic_name, patients_referred, revenue_generated
      FROM referring_doctors 
      WHERE status = 'Active'
      ORDER BY revenue_generated DESC 
      LIMIT 1
    `);

    return {
      totalDoctors: Number(row.total_doctors) || 0,
      totalPatientsReferred: Number(row.total_patients_referred) || 0,
      totalRevenueGenerated: Number(row.total_revenue_generated) || 0,
      activeDoctors: Number(row.active_doctors) || 0,
      pendingDoctors: Number(row.pending_doctors) || 0,
      inactiveDoctors: Number(row.inactive_doctors) || 0,
      topPerformer: topDocRes.rows[0] || null,
    };
  }

  /**
   * Get single referring doctor by code or UUID with recent referral cases
   */
  static async getDoctorById(id) {
    const sql = `SELECT * FROM referring_doctors WHERE id::text = $1 OR doctor_code = $1 LIMIT 1`;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) {
      throw new AppError('Referring doctor not found', HTTP_STATUS.NOT_FOUND);
    }

    const doctor = this.formatDoctorRecord(res.rows[0]);

    // Fetch patient referral transactions
    const casesSql = `
      SELECT id, patient_name, procedure_name, bill_amount, referral_fee, referral_date, status
      FROM patient_referrals
      WHERE referring_doctor_id = $1::uuid
      ORDER BY referral_date DESC
      LIMIT 10
    `;
    const casesRes = await query(casesSql, [doctor.uuid]);
    doctor.recentCases = casesRes.rows;

    return doctor;
  }

  /**
   * Create a new referring doctor
   */
  static async createDoctor(data) {
    // Generate doctor code
    const codeCheck = await query(`SELECT COUNT(*) FROM referring_doctors`);
    const count = parseInt(codeCheck.rows[0].count, 10) + 1;
    const doctorCode = `DR-${String(count).padStart(3, '0')}`;

    const sql = `
      INSERT INTO referring_doctors (
        doctor_code, name, specialty, clinic_name, phone, email, city, status, commission_rate, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      doctorCode,
      data.name.trim(),
      data.specialty.trim(),
      data.clinic ? data.clinic.trim() : (data.clinicName ? data.clinicName.trim() : 'Private Clinic'),
      data.phone.trim(),
      data.email?.trim() || null,
      data.city?.trim() || 'Mumbai',
      data.status || 'Active',
      data.commissionRate ? Number(data.commissionRate) : 10.0,
      data.notes?.trim() || null,
    ];

    const res = await query(sql, values);
    return this.formatDoctorRecord(res.rows[0]);
  }

  /**
   * Update referring doctor details or status
   */
  static async updateDoctor(id, updates) {
    const existing = await this.getDoctorById(id);

    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = {
      name: 'name',
      specialty: 'specialty',
      clinic: 'clinic_name',
      clinicName: 'clinic_name',
      phone: 'phone',
      email: 'email',
      city: 'city',
      status: 'status',
      commissionRate: 'commission_rate',
      notes: 'notes',
    };

    for (const [k, v] of Object.entries(updates)) {
      if (allowed[k] !== undefined && v !== undefined) {
        fields.push(`${allowed[k]} = $${idx}`);
        values.push(v);
        idx++;
      }
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push(`updated_at = NOW()`);
    values.push(existing.uuid);

    const sql = `
      UPDATE referring_doctors
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    const res = await query(sql, values);
    return this.formatDoctorRecord(res.rows[0]);
  }

  /**
   * Log a new referral case for a doctor, calculate commission, and update doctor's revenue & patients_referred
   */
  static async logReferralCase(doctorId, data) {
    const doctor = await this.getDoctorById(doctorId);
    const billAmount = Number(data.billAmount) || 0;
    const commissionPercent = data.commissionRate !== undefined && data.commissionRate !== null 
      ? Number(data.commissionRate) 
      : (doctor.commissionRate || 10);
    
    // Calculate doctor's exact commission honorarium
    const calculatedFee = (billAmount * commissionPercent) / 100;

    const sql = `
      INSERT INTO patient_referrals (
        referring_doctor_id, patient_id, patient_name, procedure_name, bill_amount, referral_fee, referral_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      doctor.uuid,
      data.patientId || null,
      data.patientName.trim(),
      data.procedureName ? data.procedureName.trim() : 'OPD Consultation / Procedure',
      billAmount,
      calculatedFee,
      data.referralDate || new Date().toISOString().slice(0, 10),
      data.status || 'Admitted',
    ];

    const caseRes = await query(sql, values);

    // Update doctor's lifetime revenue_generated and patients_referred
    await query(`
      UPDATE referring_doctors
      SET 
        patients_referred = patients_referred + 1,
        revenue_generated = revenue_generated + $1,
        updated_at = NOW()
      WHERE id = $2
    `, [billAmount, doctor.uuid]);

    const updatedDoctor = await this.getDoctorById(doctor.uuid);

    return {
      referralCase: caseRes.rows[0],
      doctor: updatedDoctor,
      calculatedCommission: calculatedFee,
    };
  }

  /**
   * Delete referring doctor
   */
  static async deleteDoctor(id) {
    const existing = await this.getDoctorById(id);
    await query('DELETE FROM referring_doctors WHERE id = $1', [existing.uuid]);
    return { success: true, message: `Doctor ${existing.name} removed from referral network` };
  }
}
