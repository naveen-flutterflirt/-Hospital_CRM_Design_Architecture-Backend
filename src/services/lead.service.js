import { query } from '../config/db.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { PatientService } from './patient.service.js';

export class LeadService {
  /**
   * Format database lead row to frontend model
   */
  static formatLeadRecord(l) {
    return {
      id: l.lead_code || l.id,
      uuid: l.id,
      leadCode: l.lead_code,
      name: l.name,
      phone: l.phone,
      email: l.email,
      treatment: l.treatment,
      source: l.source || 'Website',
      stage: l.stage || 'new',
      priority: l.priority || 'Normal',
      estimatedValue: Number(l.estimated_value) || 0,
      tag: l.tag,
      tagType: l.tag_type || 'neutral',
      notes: l.notes,
      assignedTo: l.assigned_to,
      meta: l.meta || 'Recent',
      convertedPatientId: l.converted_patient_id || null,
      patientUhid: l.patient_uhid || null,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    };
  }

  /**
   * Get all leads with optional filtering
   */
  static async getAllLeads({ search = '', stage = 'All', source = '', priority = '' } = {}) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search && search.trim() !== '') {
      conditions.push(`(
        name ILIKE $${paramIndex} OR 
        treatment ILIKE $${paramIndex} OR 
        source ILIKE $${paramIndex} OR
        phone ILIKE $${paramIndex} OR
        lead_code ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (stage && stage !== 'All') {
      conditions.push(`stage = $${paramIndex}`);
      params.push(stage.trim());
      paramIndex++;
    }

    if (source && source !== 'All') {
      conditions.push(`source ILIKE $${paramIndex}`);
      params.push(`%${source.trim()}%`);
      paramIndex++;
    }

    if (priority && priority !== 'All') {
      conditions.push(`priority ILIKE $${paramIndex}`);
      params.push(`%${priority.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT * FROM leads
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const res = await query(sql, params);
    return res.rows.map(this.formatLeadRecord);
  }

  /**
   * Get leads grouped into Kanban board columns
   */
  static async getKanbanBoard({ search = '', source = '' } = {}) {
    const allLeads = await this.getAllLeads({ search, source });

    const board = {
      new: [],
      contacted: [],
      quote: [],
      visited: [],
      wonLost: [],
    };

    allLeads.forEach((lead) => {
      const stage = lead.stage || 'new';
      if (board[stage]) {
        board[stage].push(lead);
      } else {
        board.new.push(lead);
      }
    });

    return board;
  }

  /**
   * Get single lead by ID or leadCode
   */
  static async getLeadById(id) {
    const sql = `
      SELECT * FROM leads 
      WHERE id::text = $1 OR lead_code = $1
      LIMIT 1
    `;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) {
      throw new AppError('Lead not found', HTTP_STATUS.NOT_FOUND);
    }
    return this.formatLeadRecord(res.rows[0]);
  }

  /**
   * Create a new lead
   */
  static async createLead(data) {
    const leadCode = `LD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

    const tag = data.tag || (data.priority === 'High' ? 'High Priority' : undefined);
    const tagType = data.tagType || (data.priority === 'High' ? 'warning' : 'neutral');

    const sql = `
      INSERT INTO leads (
        lead_code, name, phone, email, treatment, source, 
        stage, priority, estimated_value, tag, tag_type, notes, assigned_to, meta, campaign_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      leadCode,
      data.name.trim(),
      data.phone?.trim() || null,
      data.email?.trim() || null,
      data.treatment.trim(),
      data.source?.trim() || 'Website',
      data.stage?.trim() || 'new',
      data.priority?.trim() || 'Normal',
      data.estimatedValue ? Number(data.estimatedValue) : 0,
      tag,
      tagType,
      data.notes?.trim() || null,
      data.assignedTo?.trim() || null,
      data.meta || 'Just now',
      data.campaignId || null,
    ];

    const res = await query(sql, values);

    // If linked to a campaign, increment campaign leads count
    if (data.campaignId) {
      await query(
        `UPDATE campaigns SET leads_count = leads_count + 1, updated_at = NOW() WHERE id::text = $1 OR campaign_code = $1`,
        [data.campaignId]
      );
    }

    return this.formatLeadRecord(res.rows[0]);
  }

  /**
   * Ingest lead automatically from Webhooks (Meta Ads / Google Ads / Landing Page)
   */
  static async ingestWebhookLead(payload) {
    // Normalize payload across Meta / Google / Website forms
    const name = payload.full_name || payload.name || payload.userName || 'Anonymous Patient';
    const phone = payload.phone_number || payload.phone || payload.mobile || '+91 9876543210';
    const email = payload.email || null;
    const treatment = payload.treatment || payload.procedure || payload.ad_name || 'General OPD Inquiry';
    const source = payload.platform || payload.source || 'Meta Ads';
    const campaignRef = payload.campaign_code || payload.campaign_id || payload.utm_campaign || null;

    let campaignId = null;
    if (campaignRef) {
      const campCheck = await query(
        `SELECT id, name FROM campaigns WHERE id::text = $1 OR campaign_code = $1 OR name ILIKE $1 LIMIT 1`,
        [campaignRef]
      );
      if (campCheck.rows.length > 0) {
        campaignId = campCheck.rows[0].id;
      }
    }

    return await this.createLead({
      name,
      phone,
      email,
      treatment,
      source,
      stage: 'new',
      priority: 'High',
      tag: 'Ad Generated',
      tagType: 'primary',
      meta: 'Just now (Auto)',
      campaignId,
      notes: `Automated ingestion from ${source}. Inquiry: ${payload.notes || treatment}`,
    });
  }

  /**
   * Update lead details or stage (drag & drop)
   */
  static async updateLead(id, updates) {
    const existing = await this.getLeadById(id);

    const fields = [];
    const values = [];
    let idx = 1;

    const fieldMap = {
      name: 'name',
      phone: 'phone',
      email: 'email',
      treatment: 'treatment',
      source: 'source',
      stage: 'stage',
      priority: 'priority',
      estimatedValue: 'estimated_value',
      tag: 'tag',
      tagType: 'tag_type',
      notes: 'notes',
      assignedTo: 'assigned_to',
      meta: 'meta',
      convertedPatientId: 'converted_patient_id',
      patientUhid: 'patient_uhid',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${col} = $${idx}`);
        values.push(updates[key]);
        idx++;
      }
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push(`updated_at = NOW()`);
    values.push(existing.uuid);

    const sql = `
      UPDATE leads
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    const res = await query(sql, values);
    return this.formatLeadRecord(res.rows[0]);
  }

  /**
   * Convert Lead to Official Hospital Patient
   */
  static async convertToPatient(leadId, additionalData = {}) {
    const lead = await this.getLeadById(leadId);

    // If already converted, return existing link
    if (lead.convertedPatientId) {
      throw new AppError(`Lead already converted to patient with UHID: ${lead.patientUhid}`, HTTP_STATUS.BAD_REQUEST);
    }

    // Split name into first and last name
    const parts = (lead.name || 'Patient').trim().split(/\s+/);
    const firstName = additionalData.firstName || parts[0];
    const lastName = additionalData.lastName || parts.slice(1).join(' ') || 'Kumar';

    // Map lead treatment to typical hospital department
    let department = additionalData.department || 'General Medicine';
    const treatLower = (lead.treatment || '').toLowerCase();
    if (treatLower.includes('ivf') || treatLower.includes('maternity')) department = 'Gynaecology';
    else if (treatLower.includes('angiography') || treatLower.includes('heart')) department = 'Cardiology';
    else if (treatLower.includes('hernia') || treatLower.includes('spine') || treatLower.includes('tkr')) department = 'Orthopaedics';
    else if (treatLower.includes('cataract') || treatLower.includes('eye')) department = 'Ophthalmology';

    // Create the patient via PatientService
    const patient = await PatientService.createPatient({
      firstName,
      lastName,
      dob: additionalData.dob || '1985-01-01',
      gender: additionalData.gender || 'M',
      phone: additionalData.phone || lead.phone || '+91 9800000000',
      email: additionalData.email || lead.email,
      department,
      source: lead.source || 'Website',
    });

    // Ensure columns exist in database before updating
    await query(`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS patient_uhid VARCHAR(50);
    `);

    // Update lead record with patient link, set stage to 'wonLost' and tag to 'Won / Admitted'
    const updateSql = `
      UPDATE leads 
      SET 
        stage = 'wonLost',
        tag = 'Won / Admitted',
        tag_type = 'success',
        converted_patient_id = $1::uuid,
        patient_uhid = $2::varchar,
        notes = COALESCE(notes, '') || ' [Converted to Patient: ' || $2::varchar || ' on ' || NOW()::text || ']',
        updated_at = NOW()
      WHERE id = $3::uuid
      RETURNING *
    `;

    const updateRes = await query(updateSql, [patient.uuid, patient.uhid, lead.uuid]);
    const updatedLead = this.formatLeadRecord(updateRes.rows[0]);

    return {
      lead: updatedLead,
      patient,
    };
  }

  /**
   * Delete lead
   */
  static async deleteLead(id) {
    const existing = await this.getLeadById(id);
    await query('DELETE FROM leads WHERE id = $1', [existing.uuid]);
    return { success: true, message: `Lead ${existing.name} deleted successfully` };
  }
}
