import { query } from '../config/db.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class BedService {
  /**
   * Get all wards with occupancy stats
   */
  static async getAllWards() {
    const sql = `
      SELECT 
        w.id,
        w.ward_code,
        w.name,
        w.floor,
        w.ward_type,
        w.department,
        w.daily_rate,
        COUNT(b.id)::int as total_beds,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END)::int as occupied_count,
        COUNT(CASE WHEN b.status = 'vacant' THEN 1 END)::int as vacant_count,
        COUNT(CASE WHEN b.status = 'cleaning' THEN 1 END)::int as cleaning_count,
        COUNT(CASE WHEN b.status = 'discharge' THEN 1 END)::int as discharge_count,
        COUNT(CASE WHEN b.status = 'critical' THEN 1 END)::int as critical_count
      FROM wards w
      LEFT JOIN beds b ON b.ward_id = w.id
      GROUP BY w.id
      ORDER BY w.name ASC
    `;
    const res = await query(sql);
    return res.rows.map(r => ({
      id: r.id,
      code: r.ward_code,
      name: r.name,
      floor: r.floor,
      wardType: r.ward_type,
      department: r.department,
      dailyRate: Number(r.daily_rate),
      totalBeds: r.total_beds,
      occupied: r.occupied_count,
      vacant: r.vacant_count,
      cleaning: r.cleaning_count,
      dischargeToday: r.discharge_count,
      critical: r.critical_count,
    }));
  }

  /**
   * Get beds for a specific ward or all beds, enriched with active admission & patient details
   */
  static async getBeds({ wardId = '', status = '', search = '' } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (wardId) {
      conditions.push(`b.ward_id = $${idx++}::uuid`);
      params.push(wardId);
    }

    if (status && status !== 'all') {
      conditions.push(`b.status = $${idx++}`);
      params.push(status);
    }

    if (search && search.trim() !== '') {
      conditions.push(`(
        b.bed_number ILIKE $${idx} OR
        p.name ILIKE $${idx} OR
        p.uhid ILIKE $${idx} OR
        w.name ILIKE $${idx}
      )`);
      params.push(`%${search.trim()}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        b.id,
        b.bed_number,
        b.status,
        b.daily_rate,
        b.created_at,
        w.id as ward_id,
        w.name as ward_name,
        w.ward_code,
        w.floor,
        w.ward_type,
        w.department,
        a.id as admission_id,
        a.admission_number,
        a.admitted_at,
        a.expected_discharge,
        a.primary_diagnosis,
        a.doctor_name,
        p.id as patient_id,
        p.name as patient_name,
        p.uhid as patient_uhid,
        p.gender as patient_gender,
        p.dob as patient_dob,
        p.phone as patient_contact
      FROM beds b
      JOIN wards w ON b.ward_id = w.id
      LEFT JOIN admissions a ON a.bed_id = b.id AND a.status = 'admitted'
      LEFT JOIN patients p ON a.patient_id = p.id
      ${whereClause}
      ORDER BY b.bed_number ASC
    `;

    const res = await query(sql, params);
    return res.rows.map(r => ({
      id: r.id,
      bedNumber: r.bed_number,
      status: r.status,
      dailyRate: Number(r.daily_rate || 0),
      wardId: r.ward_id,
      wardName: r.ward_name,
      wardCode: r.ward_code,
      floor: r.floor,
      wardType: r.ward_type,
      department: r.department,
      admission: r.admission_id ? {
        id: r.admission_id,
        admissionNumber: r.admission_number,
        admittedAt: r.admitted_at,
        expectedDischarge: r.expected_discharge,
        diagnosis: r.primary_diagnosis,
        doctorName: r.doctor_name,
        patient: {
          id: r.patient_id,
          name: r.patient_name,
          uhid: r.patient_uhid,
          gender: r.patient_gender,
          contact: r.patient_contact,
        }
      } : null
    }));
  }

  /**
   * Summary overview of bed capacity hospital-wide
   */
  static async getSummary() {
    const sql = `
      SELECT 
        COUNT(b.id)::int as total_beds,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END)::int as occupied,
        COUNT(CASE WHEN b.status = 'vacant' THEN 1 END)::int as vacant,
        COUNT(CASE WHEN b.status = 'cleaning' THEN 1 END)::int as cleaning,
        COUNT(CASE WHEN b.status = 'discharge' THEN 1 END)::int as discharge_today,
        COUNT(CASE WHEN b.status = 'critical' THEN 1 END)::int as critical
      FROM beds b
    `;
    const res = await query(sql);
    const row = res.rows[0];
    const total = row.total_beds || 0;
    const occupied = (row.occupied || 0) + (row.critical || 0) + (row.discharge_today || 0);
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return {
      totalBeds: total,
      occupied: row.occupied || 0,
      vacant: row.vacant || 0,
      cleaning: row.cleaning || 0,
      dischargeToday: row.discharge_today || 0,
      critical: row.critical || 0,
      occupancyRate: `${occupancyRate}%`
    };
  }

  /**
   * Admit patient into a bed
   */
  static async admitPatient({ bedId, patientId, doctorId, doctorName, diagnosis, notes, expectedDischarge }) {
    // 1. Check bed availability
    const bedCheck = await query('SELECT id, status, ward_id FROM beds WHERE id = $1', [bedId]);
    if (bedCheck.rows.length === 0) {
      throw new AppError('Bed not found', HTTP_STATUS.NOT_FOUND);
    }
    if (bedCheck.rows[0].status === 'occupied' || bedCheck.rows[0].status === 'critical') {
      throw new AppError('Bed is currently occupied', HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Check patient exists (support UUID, patient_code e.g. 'SK-4876', or UHID)
    const ptCheck = await query(
      `SELECT id, name, uhid FROM patients 
       WHERE id::text = $1 OR patient_code = $1 OR uhid = $1
       LIMIT 1`,
      [patientId]
    );
    if (ptCheck.rows.length === 0) {
      throw new AppError('Patient not found', HTTP_STATUS.NOT_FOUND);
    }
    const realPatient = ptCheck.rows[0];

    // Optional doctor lookup to resolve valid doctor_id UUID
    let validDoctorId = null;
    if (doctorId) {
      const docCheck = await query(
        `SELECT id, name FROM doctors WHERE id::text = $1 OR doctor_code = $1 LIMIT 1`,
        [doctorId]
      );
      if (docCheck.rows.length > 0) {
        validDoctorId = docCheck.rows[0].id;
        if (!doctorName) doctorName = docCheck.rows[0].name;
      }
    }

    const admCode = `ADM-${Date.now().toString().slice(-6)}`;

    // 3. Create admission
    const admRes = await query(
      `INSERT INTO admissions (
        admission_number, patient_id, bed_id, doctor_id, doctor_name, status, primary_diagnosis, notes, expected_discharge
      ) VALUES ($1, $2, $3, $4, $5, 'admitted', $6, $7, $8) RETURNING *`,
      [admCode, realPatient.id, bedId, validDoctorId, doctorName || 'Attending Physician', diagnosis || 'General Inpatient Care', notes || '', expectedDischarge || null]
    );

    // 4. Update bed status
    await query("UPDATE beds SET status = 'occupied', updated_at = NOW() WHERE id = $1", [bedId]);

    // 5. Update patient status to IPD
    await query("UPDATE patients SET status = 'IPD - Admitted', status_type = 'primary' WHERE id = $1", [realPatient.id]);

    return admRes.rows[0];
  }

  /**
   * Transfer patient to another bed
   */
  static async transferPatient({ currentBedId, newBedId, notes }) {
    // 1. Get current admission
    const admCheck = await query(
      "SELECT id, patient_id FROM admissions WHERE bed_id = $1 AND status = 'admitted'",
      [currentBedId]
    );
    if (admCheck.rows.length === 0) {
      throw new AppError('No active admission found for this bed', HTTP_STATUS.NOT_FOUND);
    }
    const admission = admCheck.rows[0];

    // 2. Check new bed is vacant
    const targetBed = await query('SELECT id, status FROM beds WHERE id = $1', [newBedId]);
    if (targetBed.rows.length === 0) {
      throw new AppError('Target bed not found', HTTP_STATUS.NOT_FOUND);
    }
    if (targetBed.rows[0].status !== 'vacant') {
      throw new AppError('Target bed is not vacant', HTTP_STATUS.BAD_REQUEST);
    }

    // 3. Move admission to new bed
    await query(
      "UPDATE admissions SET bed_id = $1, notes = COALESCE(notes, '') || E'\\n' || $2, updated_at = NOW() WHERE id = $3",
      [newBedId, `Transferred from bed on ${new Date().toLocaleDateString()}: ${notes || ''}`, admission.id]
    );

    // 4. Update statuses: old bed -> cleaning, new bed -> occupied
    await query("UPDATE beds SET status = 'cleaning', updated_at = NOW() WHERE id = $1", [currentBedId]);
    await query("UPDATE beds SET status = 'occupied', updated_at = NOW() WHERE id = $1", [newBedId]);

    return { success: true, message: 'Patient transferred successfully' };
  }

  /**
   * Discharge patient from bed
   */
  static async dischargePatient({ bedId, dischargeNotes }) {
    const admCheck = await query(
      "SELECT id, patient_id FROM admissions WHERE bed_id = $1 AND status = 'admitted'",
      [bedId]
    );
    if (admCheck.rows.length === 0) {
      throw new AppError('No active admission found for this bed', HTTP_STATUS.NOT_FOUND);
    }
    const admission = admCheck.rows[0];

    // 1. Close admission
    await query(
      "UPDATE admissions SET status = 'discharged', discharged_at = NOW(), notes = COALESCE(notes, '') || E'\\n' || $1, updated_at = NOW() WHERE id = $2",
      [`Discharge summary: ${dischargeNotes || 'Routine discharge'}`, admission.id]
    );

    // 2. Bed marked for cleaning
    await query("UPDATE beds SET status = 'cleaning', updated_at = NOW() WHERE id = $1", [bedId]);

    // 3. Patient marked discharged
    await query("UPDATE patients SET status = 'Discharged', status_type = 'success' WHERE id = $1", [admission.patient_id]);

    return { success: true, message: 'Patient discharged. Bed placed in cleaning queue.' };
  }

  /**
   * Mark bed clean and ready for admission
   */
  static async markBedClean(bedId) {
    const res = await query(
      "UPDATE beds SET status = 'vacant', updated_at = NOW() WHERE id = $1 RETURNING *",
      [bedId]
    );
    if (res.rows.length === 0) {
      throw new AppError('Bed not found', HTTP_STATUS.NOT_FOUND);
    }
    return res.rows[0];
  }

  /**
   * Update status of bed (e.g. mark discharge today, critical, etc.)
   */
  static async updateBedStatus(bedId, status) {
    const valid = ['vacant', 'occupied', 'cleaning', 'discharge', 'critical'];
    if (!valid.includes(status)) {
      throw new AppError('Invalid bed status', HTTP_STATUS.BAD_REQUEST);
    }
    const res = await query(
      "UPDATE beds SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, bedId]
    );
    if (res.rows.length === 0) {
      throw new AppError('Bed not found', HTTP_STATUS.NOT_FOUND);
    }
    return res.rows[0];
  }
}
